// Human decision on a mentor application. Never deletes the row.
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { actAsModerator, denied } from "@/lib/actor";
import { LISTING_ID, parseListingId } from "@/lib/mentors";

const Decision = z.object({
  id: z.string().regex(LISTING_ID, "Invalid application id."),
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
  // An approved real account becomes a mentor on its profile too (seeded
  // mentors already are).
  const { profileId } = parseListingId(parsed.data.id);
  if (status === "approved" && !error && data?.length > 0 && profileId.startsWith("u-")) {
    await db.from("profiles").update({ role: "mentor" }).eq("id", profileId);
  }
  return Response.json({ ok: true, status, persisted: !error && data?.length > 0 });
}
