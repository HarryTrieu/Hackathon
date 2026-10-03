// Saved posts, per account, in the database (same list on every device).
//   GET  ?profile_id=X                         your saved posts, newest saved first
//   POST { profile_id, post_id, saved }        save or unsave
// 503 before the live-fixes migration; the client then keeps them locally.
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { actAsAuthor, denied } from "@/lib/actor";
import { withRealAuthors } from "@/lib/account";

const NO_STORE = { "Cache-Control": "private, no-store" };
const missingTable = (error) => ["PGRST205", "42P01"].includes(error?.code);
const notReady = () => Response.json({ error: "Saved posts need the live-fixes migration." }, { status: 503 });

export async function GET(request) {
  const me = new URL(request.url).searchParams.get("profile_id");
  const who = await actAsAuthor(me);
  if (!who.ok) return denied(who);
  const db = supabaseAdmin();
  if (!db) return notReady();
  const { data, error } = await db
    .from("saved_posts")
    .select("created_at, posts!inner(*)")
    .eq("profile_id", me)
    .neq("posts.status", "removed")
    .order("created_at", { ascending: false })
    .limit(100);
  if (missingTable(error)) return notReady();
  if (error) return Response.json({ error: "Could not load saved posts." }, { status: 500 });
  const now = Date.now();
  const posts = data.map(({ posts: p }) => ({
    ...p,
    hours_ago: Math.max(0, (now - new Date(p.created_at).getTime()) / 3600_000),
  }));
  return Response.json({ posts: await withRealAuthors(posts) }, { headers: NO_STORE });
}

const Toggle = z.object({
  profile_id: z.string().min(1).max(80),
  post_id: z.string().min(1).max(64),
  saved: z.boolean(),
});

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = Toggle.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });
  const { profile_id, post_id, saved } = parsed.data;
  const who = await actAsAuthor(profile_id);
  if (!who.ok) return denied(who);
  const db = supabaseAdmin();
  if (!db) return notReady();
  const { error } = saved
    ? await db.from("saved_posts").upsert({ profile_id, post_id })
    : await db.from("saved_posts").delete().eq("profile_id", profile_id).eq("post_id", post_id);
  if (missingTable(error)) return notReady();
  // 23503: the post isn't in the database (e.g. offline-only); keep it local.
  if (error) return Response.json({ error: "Could not save that." }, { status: error.code === "23503" ? 404 : 500 });
  return Response.json({ ok: true });
}
