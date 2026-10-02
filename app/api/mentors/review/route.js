// Human decision on a mentor application. Never deletes the row.
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { actAsModerator, denied } from "@/lib/actor";

const Decision = z.object({
  id: z.string().regex(/^p\d+-[A-Z]{3}\d{3}$/, "Invalid application id."),
  action: z.enum(["approve", "reject"]),
  moderator_id: z.string().min(1).max(80),
});

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = Decision.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const mod = await actAsModerator(parsed.data.moderator_id);
  if (!mod.ok) return denied(mod);

  const status = parsed.data.action === "approve" ? "approved" : "rejected";
  const db = supabaseAdmin();
  if (!db) return Response.json({ ok: true, status, persisted: false });

  const { data, error } = await db
    .from("mentor_profiles")
    .update({ status })
    .eq("id", parsed.data.id)
    .select("id");
  return Response.json({ ok: true, status, persisted: !error && data?.length > 0 });
}
