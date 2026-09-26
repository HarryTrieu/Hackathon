import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";

const ReviewAction = z.object({
  post_id: z.string().min(1),
  // Humans decide: approve clears the flag, remove hides (never deletes).
  action: z.enum(["approve", "remove"]),
});

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const parsed = ReviewAction.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid action." },
      { status: 400 }
    );
  }

  const db = supabaseAdmin();
  if (!db) {
    // No DB: the review page applies the action to its local state only.
    return Response.json({ ok: true, mocked: true });
  }

  const { post_id, action } = parsed.data;
  const patch =
    action === "approve"
      ? { flag_reason: null, status: "approved" }
      : { status: "removed" };

  const { error } = await db.from("posts").update(patch).eq("id", post_id);
  if (error) {
    return Response.json({ error: "Update failed." }, { status: 500 });
  }
  return Response.json({ ok: true, mocked: false });
}
