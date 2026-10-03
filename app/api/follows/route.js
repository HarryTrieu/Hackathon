// Following people.
//   GET  ?viewer=V                       ids V follows (Home strip)
//   POST { follower_id, followee_id, follow }   follow or unfollow
// Counts for a profile page are read on the server (lib/follows.js).
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { actAsAuthor, denied } from "@/lib/actor";
import { followingIds } from "@/lib/follows";
import { realProfiles } from "@/lib/account";
import { getProfile } from "@/lib/seed";
import { ping } from "@/lib/realtime";

const NO_STORE = { "Cache-Control": "private, no-store" };
const PROFILE_ID = /^(p\d+|u-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
const missingTable = (error) => ["PGRST205", "42P01"].includes(error?.code);

export async function GET(request) {
  const viewer = new URL(request.url).searchParams.get("viewer");
  const who = await actAsAuthor(viewer);
  if (!who.ok) return denied(who);
  const ids = await followingIds(viewer);
  const real = await realProfiles(ids.filter((id) => id.startsWith("u-")));
  // Profiles ride along so the Home strip can show real accounts too.
  const profiles = ids.map((id) => getProfile(id) ?? real.get(id)).filter(Boolean);
  return Response.json({ ids, profiles }, { headers: NO_STORE });
}

const Toggle = z.object({
  follower_id: z.string().min(1).max(80),
  followee_id: z.string().regex(PROFILE_ID, "That person doesn't exist."),
  follow: z.boolean(),
});

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = Toggle.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { follower_id, followee_id, follow } = parsed.data;
  if (follower_id === "admin") return Response.json({ error: "The moderator account doesn't follow people." }, { status: 400 });
  if (follower_id === followee_id) return Response.json({ error: "You can't follow yourself." }, { status: 400 });
  const who = await actAsAuthor(follower_id);
  if (!who.ok) return denied(who);
  const db = supabaseAdmin();
  if (!db) return Response.json({ error: "Following needs the database." }, { status: 503 });
  const { error } = follow
    ? await db.from("follows").upsert({ follower_id, followee_id })
    : await db.from("follows").delete().eq("follower_id", follower_id).eq("followee_id", followee_id);
  if (missingTable(error)) return Response.json({ error: "Following needs the live-fixes migration." }, { status: 503 });
  if (error) return Response.json({ error: "Could not update that." }, { status: 500 });
  if (follow) await ping([followee_id], "follow");
  return Response.json({ ok: true });
}
