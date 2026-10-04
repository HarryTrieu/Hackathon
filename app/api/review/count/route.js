// What's waiting in /review, for the nav badge and the page's first tab:
// GET ?moderator_id=X -> { flagged, reports, applications, total }.
import { supabaseAdmin } from "@/lib/supabase";
import { actAsModerator, denied } from "@/lib/actor";
import { isSupportFlag } from "@/lib/moderation";

export async function GET(request) {
  const mod = await actAsModerator(new URL(request.url).searchParams.get("moderator_id"));
  if (!mod.ok) return denied(mod);
  const db = supabaseAdmin();
  if (!db) return Response.json({ flagged: 0, reports: 0, applications: 0, total: 0 });
  const [posts, reports, apps] = await Promise.all([
    db.from("posts").select("flag_reason").not("flag_reason", "is", null).neq("status", "removed").neq("status", "approved"),
    db.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    db.from("mentor_profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const flagged = (posts.data ?? []).length;
  const counts = { flagged, reports: reports.count ?? 0, applications: apps.count ?? 0 };
  // Wellbeing checks are counted too: a person should look at them.
  return Response.json(
    { ...counts, wellbeing: (posts.data ?? []).filter((p) => isSupportFlag(p.flag_reason)).length, total: counts.flagged + counts.reports + counts.applications },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
