// Generates sample answers from a draft mentor profile so the mentor can
// approve how their AI sounds before submitting the application.
import { z } from "zod";
import { previewAnswers } from "@/lib/mentor-ai";
import { getUnit } from "@/lib/communities";
import { getProfile } from "@/lib/seed";
import { actAs, denied } from "@/lib/actor";
import { realProfiles } from "@/lib/account";
import { clientIp, takeDailyQuota } from "@/lib/rate-limit";

const Draft = z.object({
  profile_id: z.string().min(1).max(80),
  unit_code: z.string().regex(/^[A-Z]{3}\d{3}$/, "Invalid unit code."),
  grade: z.enum(["HD", "D"]),
  style: z.object({
    teaching: z.string().min(1),
    tone: z.string().min(1),
    pace: z.string().min(1),
    help: z.array(z.string()).min(1),
    feedback: z.string().min(1),
    languages: z.array(z.string()).min(1),
    format: z.string().min(1),
  }),
  voice: z.object({
    topics: z.string().trim().min(1),
    explain: z.string().trim().min(1),
    lost: z.string().trim().min(1),
    about: z.string().trim().min(1),
  }),
});

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = Draft.safeParse(body);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path?.[0];
    const message =
      field === "style"
        ? "Answer every question in step 2 (How you teach) before previewing."
        : field === "voice"
          ? "Write something in each box in step 3 (Your voice) before previewing."
          : field === "grade"
            ? "Confirm Distinction or above in step 1."
            : field === "unit_code"
              ? "Pick a unit in step 1."
              : "Check the form and try again.";
    return Response.json({ error: message }, { status: 400 });
  }
  const draft = parsed.data;
  const who = await actAs(draft.profile_id);
  if (!who.ok) return denied(who);
  if (!takeDailyQuota("mentor-preview", draft.profile_id, 15).ok) {
    return Response.json({ error: "You've previewed your AI 15 times today. Try again tomorrow." }, { status: 429 });
  }
  const profile = getProfile(draft.profile_id) ?? (await realProfiles([draft.profile_id])).get(draft.profile_id);
  if (!profile) return Response.json({ error: "Finish setting up your account first." }, { status: 403 });
  const listing = {
    ...draft,
    profile,
    unit_name: getUnit(draft.unit_code)?.name ?? null,
  };
  return Response.json(await previewAnswers(listing));
}
