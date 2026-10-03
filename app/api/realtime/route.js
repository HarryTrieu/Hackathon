// Your realtime channel name (see lib/realtime.js): GET ?profile_id=X.
import { actAsAuthor, denied } from "@/lib/actor";
import { topicFor } from "@/lib/realtime";

export async function GET(request) {
  const me = new URL(request.url).searchParams.get("profile_id");
  const who = await actAsAuthor(me);
  if (!who.ok) return denied(who);
  return Response.json({ topic: topicFor(me) }, { headers: { "Cache-Control": "private, no-store" } });
}
