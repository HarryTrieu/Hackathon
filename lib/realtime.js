// Server-only: "something changed for you" pings through Supabase Realtime.
// A ping carries no content (just a kind like "message"); the browser then
// refetches through our own routes, which check who you are. Each person's
// channel name is derived from a server secret, so nobody can guess another
// person's channel and watch their activity.
import { createHmac } from "node:crypto";

export function topicFor(profileId) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev";
  return `sodu-${createHmac("sha256", secret).update(profileId).digest("hex").slice(0, 24)}`;
}

// Best effort and fast: a failed ping only means the 15 s refresh catches it.
export async function ping(profileIds, kind) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ids = [...new Set(profileIds.filter(Boolean))];
  if (!url || !key || ids.length === 0) return;
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        messages: ids.map((id) => ({ topic: topicFor(id), event: "changed", payload: { kind } })),
      }),
      signal: AbortSignal.timeout(2500),
    });
  } catch {
    // Realtime down or slow: polling still covers it.
  }
}

// Every moderator: the demo Moderator persona plus real accounts marked
// is_moderator. Used to alert them when something lands in /review.
export async function pingModerators(db, kind) {
  let ids = ["admin"];
  if (db) {
    const { data } = await db.from("profiles").select("id").eq("is_moderator", true);
    ids = [...ids, ...(data ?? []).map((p) => p.id)];
  }
  await ping(ids, kind);
}
