// Persisted "Helpful" votes. One vote per profile per post; the post's
// helpful_count is what mentor reputation is built from.
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { PROFILES } from "@/lib/seed";

const PROFILE_IDS = new Set(PROFILES.map((p) => p.id));

const Vote = z.object({
  post_id: z.string().min(1).max(64),
  profile_id: z.string().refine((id) => PROFILE_IDS.has(id), "Unknown profile."),
  action: z.enum(["like", "unlike"]),
});

export async function GET(request) {
  const profileId = new URL(request.url).searchParams.get("profile_id");
  if (!PROFILE_IDS.has(profileId ?? "")) {
    return Response.json({ error: "profile_id is required." }, { status: 400 });
  }
  const db = supabaseAdmin();
  if (!db) return Response.json({ liked: null });
  const { data, error } = await db
    .from("post_likes")
    .select("post_id")
    .eq("profile_id", profileId);
  return Response.json({ liked: error ? null : data.map((r) => r.post_id) });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = Vote.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { post_id, profile_id, action } = parsed.data;

  const db = supabaseAdmin();
  if (!db) return Response.json({ ok: true, persisted: false });

  // Only move the counter when the like row actually changed, so double
  // clicks and replays cannot inflate reputation.
  let changed = false;
  if (action === "like") {
    const { error } = await db.from("post_likes").insert({ post_id, profile_id });
    changed = !error;
  } else {
    const { data, error } = await db
      .from("post_likes")
      .delete()
      .eq("post_id", post_id)
      .eq("profile_id", profile_id)
      .select("post_id");
    changed = !error && data.length > 0;
  }

  if (changed) {
    const { data: post } = await db
      .from("posts")
      .select("helpful_count")
      .eq("id", post_id)
      .single();
    if (post) {
      await db
        .from("posts")
        .update({ helpful_count: Math.max(0, post.helpful_count + (action === "like" ? 1 : -1)) })
        .eq("id", post_id);
    }
  }
  return Response.json({ ok: true, persisted: changed });
}
