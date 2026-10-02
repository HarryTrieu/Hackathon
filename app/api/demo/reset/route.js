import { supabaseAdmin } from "@/lib/supabase";
import { pushSeed } from "@/lib/push-seed";
import { denied, requireRealModerator } from "@/lib/actor";

// Re-seeds the shared production database, so only a signed-in moderator
// account may do it (never a demo persona, which anyone can pick).
export async function POST() {
  const mod = await requireRealModerator();
  if (!mod.ok) return denied(mod);
  const db = supabaseAdmin();
  if (!db) return Response.json({ ok: true, persisted: false });
  const result = await pushSeed(db);
  if (!result.ok) return Response.json({ error: result.error }, { status: 500 });
  return Response.json({ ok: true, persisted: true, ...result });
}
