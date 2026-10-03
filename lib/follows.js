// Server-only follow counts and lists (empty before the live-fixes migration).
import { supabaseAdmin } from "./supabase.js";

export async function followCounts(profileId, viewerId = null) {
  const db = supabaseAdmin();
  if (!db) return { followers: 0, following: 0, followed: false, ready: false };
  const [followers, following, mine] = await Promise.all([
    db.from("follows").select("follower_id", { count: "exact", head: true }).eq("followee_id", profileId),
    db.from("follows").select("followee_id", { count: "exact", head: true }).eq("follower_id", profileId),
    viewerId
      ? db.from("follows").select("follower_id").eq("follower_id", viewerId).eq("followee_id", profileId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return {
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    followed: Boolean(mine.data),
    ready: !followers.error,
  };
}

export async function followingIds(viewerId) {
  const db = supabaseAdmin();
  if (!db) return [];
  const { data, error } = await db
    .from("follows")
    .select("followee_id")
    .eq("follower_id", viewerId)
    .order("created_at", { ascending: false })
    .limit(200);
  return error ? [] : data.map((r) => r.followee_id);
}
