// Study plans for one unit (lib/study-plan.js builds them).
//   GET   ?profile_id=X&unit=SIT102        your latest plan for the unit, plus
//                                          what its links and sources point to
//   POST  { profile_id, unit_code, goal, week, hours, weak_spots, note }  new plan
//   PATCH { profile_id, plan_id, step_id, done }                          tick a step
// Up to MAX_PLANS_PER_DAY new plans per person per day.
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { actAs, denied } from "@/lib/actor";
import { getUnit } from "@/lib/communities";
import { POSTS } from "@/lib/seed";
import { OUTLINES } from "@/lib/study-outlines";
import { MAX_PLANS_PER_DAY, PlanInput, buildStudyPlan, planReferences } from "@/lib/study-plan";
import { takeDailyQuota } from "@/lib/rate-limit";

const NO_STORE = { "Cache-Control": "private, no-store" };
const UNIT = /^[A-Z]{3}\d{3}$/;
const missingTable = (error) => ["PGRST205", "42P01"].includes(error?.code);
const notReady = () =>
  Response.json({ error: "Study plans need the database update (study-plan migration)." }, { status: 503 });

// The unit's community posts: the database's, plus seed posts it doesn't have.
async function unitPosts(db, code) {
  const seed = POSTS.filter((p) => p.unit_codes?.includes(code));
  if (!db) return seed;
  const { data } = await db
    .from("posts")
    .select("id, author_id, text, helpful_count, status, flag_reason, link_preview, unit_codes")
    .contains("unit_codes", [code])
    .neq("status", "removed")
    .limit(100);
  const ids = new Set((data ?? []).map((p) => p.id));
  return [...(data ?? []), ...seed.filter((p) => !ids.has(p.id))];
}

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const me = params.get("profile_id");
  const code = (params.get("unit") ?? "").toUpperCase();
  const who = await actAs(me);
  if (!who.ok) return denied(who);
  if (!UNIT.test(code) || !OUTLINES[code]) return Response.json({ error: "No study plans for that unit yet." }, { status: 404 });
  const db = supabaseAdmin();
  const posts = await unitPosts(db, code);
  let plan = null;
  if (db) {
    const { data, error } = await db
      .from("study_plans")
      .select("*")
      .eq("profile_id", me)
      .eq("unit_code", code)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (missingTable(error)) return notReady();
    plan = data ?? null;
  }
  return Response.json({ plan, refs: planReferences(code, posts) }, { headers: NO_STORE });
}

const Create = PlanInput.extend({
  profile_id: z.string().min(1).max(80),
  unit_code: z.string().regex(UNIT, "Invalid unit code."),
});

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = Create.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { profile_id: me, unit_code: code, ...inputs } = parsed.data;
  const who = await actAs(me);
  if (!who.ok) return denied(who);
  if (!OUTLINES[code]) return Response.json({ error: "No study plans for that unit yet." }, { status: 404 });
  const db = supabaseAdmin();

  // Daily limit: counted in the database when there is one.
  if (db) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const { count, error } = await db
      .from("study_plans")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", me)
      .gte("created_at", since.toISOString());
    if (missingTable(error)) return notReady();
    if ((count ?? 0) >= MAX_PLANS_PER_DAY) {
      return Response.json({ error: `You've made ${MAX_PLANS_PER_DAY} plans today. Try again tomorrow.` }, { status: 429 });
    }
  } else if (!takeDailyQuota("study-plan", me, MAX_PLANS_PER_DAY).ok) {
    return Response.json({ error: `You've made ${MAX_PLANS_PER_DAY} plans today. Try again tomorrow.` }, { status: 429 });
  }

  const posts = await unitPosts(db, code);
  const unit = { code, name: getUnit(code)?.name ?? null };
  const built = await buildStudyPlan({ unit, inputs, posts });
  if (!built) return Response.json({ error: "The trimester is over for this outline." }, { status: 400 });
  const { mocked, ...plan } = built;
  const row = { profile_id: me, unit_code: code, inputs, plan, done: [], mocked };

  if (!db) return Response.json({ plan: { id: "local", ...row, created_at: new Date().toISOString() }, refs: planReferences(code, posts) });
  const { data, error } = await db.from("study_plans").insert(row).select().single();
  if (missingTable(error)) return notReady();
  if (error) return Response.json({ error: "Could not save the plan." }, { status: 500 });
  return Response.json({ plan: data, refs: planReferences(code, posts) });
}

const Tick = z.object({
  profile_id: z.string().min(1).max(80),
  plan_id: z.string().uuid(),
  step_id: z.string().regex(/^\d+-\d+$/),
  done: z.boolean(),
});

export async function PATCH(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = Tick.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { profile_id: me, plan_id, step_id, done } = parsed.data;
  const who = await actAs(me);
  if (!who.ok) return denied(who);
  const db = supabaseAdmin();
  if (!db) return notReady();
  const { data: row, error } = await db.from("study_plans").select("done").eq("id", plan_id).eq("profile_id", me).maybeSingle();
  if (missingTable(error)) return notReady();
  if (!row) return Response.json({ error: "Plan not found." }, { status: 404 });
  const next = done ? [...new Set([...row.done, step_id])] : row.done.filter((s) => s !== step_id);
  const { error: saveError } = await db.from("study_plans").update({ done: next }).eq("id", plan_id).eq("profile_id", me);
  if (saveError) return Response.json({ error: "Could not save that." }, { status: 500 });
  return Response.json({ done: next });
}
