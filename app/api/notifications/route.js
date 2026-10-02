// Notifications are derived from existing tables, no notifications table:
// likes and replies on your posts, session requests you sent or received,
// and your mentor application decisions. Read state lives on the client.
import { supabaseAdmin } from "@/lib/supabase";
import { actAs, denied } from "@/lib/actor";

function excerpt(text, max = 80) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export async function GET(request) {
  const profileId = new URL(request.url).searchParams.get("profile_id");
  // Your notifications only: a real account's are private to its owner.
  const who = await actAs(profileId);
  if (!who.ok) return denied(who);
  const db = supabaseAdmin();
  if (!db) return Response.json({ notifications: [], requests: { sent: [], received: [] }, persisted: false });

  // Likes and replies join their post (inner join filtered on the author),
  // so every query runs in one parallel round trip.
  const [likes, replies, sent, received, apps] = await Promise.all([
    db
      .from("post_likes")
      .select("post_id, profile_id, created_at, posts!inner(text, author_id, status)")
      .eq("posts.author_id", profileId)
      .neq("posts.status", "removed")
      .neq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("replies")
      .select("id, post_id, author_id, text, created_at, posts!inner(text, author_id, status)")
      .eq("posts.author_id", profileId)
      .neq("posts.status", "removed")
      .neq("author_id", profileId)
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("session_requests")
      .select("*")
      .eq("mentee_id", profileId)
      .order("created_at", { ascending: false })
      .limit(30),
    db
      .from("session_requests")
      .select("*")
      .eq("mentor_id", profileId)
      .order("created_at", { ascending: false })
      .limit(30),
    db
      .from("mentor_profiles")
      .select("id, unit_code, status, created_at")
      .eq("profile_id", profileId)
      .eq("is_demo", false)
      .in("status", ["approved", "rejected"]),
  ]);

  // key identifies one thing the user should see once; a request whose
  // status changes gets a new key, so it shows as unread again.
  const notifications = [
    ...(likes.data ?? []).map((l) => ({
      key: `like:${l.post_id}:${l.profile_id}`,
      type: "like",
      actor_id: l.profile_id,
      post_excerpt: excerpt(l.posts?.text),
      created_at: l.created_at,
    })),
    ...(replies.data ?? []).map((r) => ({
      key: `reply:${r.id}`,
      type: "reply",
      actor_id: r.author_id,
      text: excerpt(r.text, 120),
      post_excerpt: excerpt(r.posts?.text),
      created_at: r.created_at,
    })),
    ...(received.data ?? []).map((r) => ({
      key: `request-in:${r.id}`,
      type: "request_received",
      actor_id: r.mentee_id,
      unit_code: r.unit_code,
      text: excerpt(r.message, 120),
      created_at: r.created_at,
    })),
    ...(sent.data ?? [])
      .filter((r) => r.status !== "sent")
      .map((r) => ({
        key: `request-out:${r.id}:${r.status}`,
        type: "request_update",
        actor_id: r.mentor_id,
        unit_code: r.unit_code,
        status: r.status,
        created_at: r.created_at,
      })),
    ...(apps.data ?? []).map((a) => ({
      key: `application:${a.id}:${a.status}`,
      type: "application",
      unit_code: a.unit_code,
      status: a.status,
      created_at: a.created_at,
    })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return Response.json({
    notifications,
    requests: { sent: sent.data ?? [], received: received.data ?? [] },
    persisted: true,
  });
}
