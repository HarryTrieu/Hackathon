// Mentor hub: everything a mentor needs on one page.
//   GET  ?profile_id=   your listings with stats, your membership and the
//                       money-back guarantee, and demand in your units
//   POST { profile_id, action: "pay" }           start a membership (demo payment)
//   POST { profile_id, action: "claim_refund" }  money-back guarantee
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { actAs, denied } from "@/lib/actor";
import { loadListings } from "@/lib/mentor-ai";
import { POSTS } from "@/lib/seed";
import { getUnit } from "@/lib/communities";
import {
  activeMembership,
  guaranteeState,
  isSeedProfile,
  newMembership,
  PRICE_LABEL,
} from "@/lib/membership";

const NO_STORE = { "Cache-Control": "private, no-store" };
const DEMAND_DAYS = 30;
const missingTable = (error) => ["PGRST205", "42P01"].includes(error?.code);
const notReady = () =>
  Response.json({ error: "Memberships need the database update (session-journey migration)." }, { status: 503 });

async function sessionRequestsFor(db, me) {
  const { data } = await db
    .from("session_requests")
    .select("mentor_listing, unit_code, status, created_at")
    .eq("mentor_id", me);
  return data ?? [];
}

// { included } for seeded mentors; otherwise the active membership (or the
// latest one) and its guarantee state. ready: false before the migration.
async function membershipFor(db, me, requests) {
  if (isSeedProfile(me)) return { included: true };
  if (!db) return { ready: false };
  const { data, error } = await db
    .from("mentor_memberships")
    .select("*")
    .eq("profile_id", me)
    .order("paid_at", { ascending: false })
    .limit(10);
  if (missingTable(error)) return { ready: false };
  const rows = data ?? [];
  const active = activeMembership(rows);
  const latest = active ?? rows[0] ?? null;
  return {
    ready: true,
    active: Boolean(active),
    membership: latest,
    guarantee: latest ? guaranteeState(latest, requests) : null,
    requests_in_window: latest
      ? requests.filter((r) => r.created_at >= latest.paid_at && r.created_at <= latest.guarantee_until).length
      : 0,
  };
}

// Per unit: questions posted lately, students in the community, mentors listed.
async function demandFor(db, me, unitCodes, allListed) {
  const since = Date.now() - DEMAND_DAYS * 24 * 60 * 60 * 1000;
  let posts = POSTS.map((p) => ({ ...p, created_at: new Date(Date.now() - (p.hours_ago ?? 0) * 3600_000).toISOString() }));
  let members = [];
  if (db) {
    const [postsRes, membersRes] = await Promise.all([
      db.from("posts").select("unit_codes, author_id, created_at, status").neq("status", "removed"),
      db.from("unit_members").select("unit_code, role").in("unit_code", unitCodes),
    ]);
    if (!postsRes.error && postsRes.data?.length) posts = postsRes.data;
    if (!membersRes.error) members = membersRes.data ?? [];
  }
  return unitCodes.map((code) => {
    const listed = allListed.filter((l) => l.unit_code === code);
    return {
      unit_code: code,
      unit_name: getUnit(code)?.name ?? null,
      questions: posts.filter(
        (p) => p.unit_codes?.includes(code) && p.author_id !== me && new Date(p.created_at).getTime() >= since
      ).length,
      students: members.filter((m) => m.unit_code === code && m.role === "member").length,
      mentors: listed.length,
    };
  });
}

// Real AI preview chats per listing (students who tried it). Find a mentor
// shows estimates for listings without data; your own stats shouldn't.
async function previewChats(db, listingIds) {
  const counts = new Map();
  if (!db || listingIds.length === 0) return counts;
  const { data } = await db
    .from("mentor_chats")
    .select("mentor_listing, mentee_id")
    .in("mentor_listing", listingIds)
    .eq("role", "mentee");
  const seen = new Set();
  for (const row of data ?? []) {
    const key = `${row.mentor_listing}:${row.mentee_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    counts.set(row.mentor_listing, (counts.get(row.mentor_listing) ?? 0) + 1);
  }
  return counts;
}

export async function GET(request) {
  const me = new URL(request.url).searchParams.get("profile_id");
  const who = await actAs(me);
  if (!who.ok) return denied(who);
  const db = supabaseAdmin();

  const listings = (await loadListings({ includePending: true })).filter((l) => l.profile_id === me);
  const requests = db ? await sessionRequestsFor(db, me) : [];
  const membership = await membershipFor(db, me, requests);
  const allListed = await loadListings();
  const listed = new Set(allListed.filter((l) => l.profile_id === me).map((l) => l.id));
  const unitCodes = [...new Set(listings.map((l) => l.unit_code))];
  const chats = await previewChats(db, listings.map((l) => l.id));

  return Response.json(
    {
      price: PRICE_LABEL,
      membership,
      listings: listings.map((l) => ({
        id: l.id,
        profile_id: l.profile_id,
        unit_code: l.unit_code,
        unit_name: l.unit_name,
        status: l.status,
        rate_per_hour: l.rate_per_hour,
        listed: listed.has(l.id),
        // Seeded demo mentors keep their demo numbers once listed.
        preview_chats: isSeedProfile(me) && listed.has(l.id) ? l.preview_chats : (chats.get(l.id) ?? 0),
        requests: requests.filter((r) => r.mentor_listing === l.id).length,
        accepted: requests.filter((r) => r.mentor_listing === l.id && r.status === "accepted").length,
        ratings: l.ratings,
      })),
      demand: await demandFor(db, me, unitCodes, allListed),
    },
    { headers: NO_STORE }
  );
}

const Action = z.object({
  profile_id: z.string().min(1).max(80),
  action: z.enum(["pay", "claim_refund"]),
});

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = Action.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { profile_id: me, action } = parsed.data;
  const who = await actAs(me);
  if (!who.ok) return denied(who);
  if (isSeedProfile(me)) {
    return Response.json({ error: "Demo mentors already have membership included." }, { status: 400 });
  }
  const db = supabaseAdmin();
  if (!db) return notReady();

  const { data: rows, error } = await db
    .from("mentor_memberships")
    .select("*")
    .eq("profile_id", me)
    .order("paid_at", { ascending: false })
    .limit(10);
  if (missingTable(error)) return notReady();
  if (error) return Response.json({ error: "Could not load your membership." }, { status: 500 });
  const active = activeMembership(rows ?? []);

  if (action === "pay") {
    if (active) return Response.json({ error: "Your membership is already active." }, { status: 409 });
    const { count } = await db
      .from("mentor_profiles")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", me);
    if (!count) return Response.json({ error: "Apply to mentor a unit first." }, { status: 400 });
    const { data, error: insertError } = await db.from("mentor_memberships").insert(newMembership(me)).select().single();
    if (insertError) return Response.json({ error: "Could not start your membership." }, { status: 500 });
    return Response.json({ ok: true, membership: data });
  }

  // claim_refund: only when no student requested a session in the window.
  if (!active) return Response.json({ error: "You don't have an active membership." }, { status: 400 });
  const state = guaranteeState(active, await sessionRequestsFor(db, me));
  if (state !== "claimable") {
    const why = state === "met" ? "A student requested a session, so the guarantee is met." : "The 30 days aren't over yet.";
    return Response.json({ error: why }, { status: 400 });
  }
  const { error: updateError } = await db
    .from("mentor_memberships")
    .update({ refunded_at: new Date().toISOString() })
    .eq("id", active.id)
    .is("refunded_at", null);
  if (updateError) return Response.json({ error: "Could not process the refund." }, { status: 500 });
  return Response.json({ ok: true });
}
