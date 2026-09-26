import { supabaseAdmin } from "@/lib/supabase";
import { pushSeed } from "@/lib/push-seed";

export async function POST() {
  const db = supabaseAdmin();
  if (!db) return Response.json({ ok: true, persisted: false });
  const result = await pushSeed(db);
  if (!result.ok) return Response.json({ error: result.error }, { status: 500 });
  return Response.json({ ok: true, persisted: true, ...result });
}
