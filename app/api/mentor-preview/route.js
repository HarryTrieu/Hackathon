// Generates sample answers from a draft mentor profile so the mentor can
// approve how their AI sounds before submitting the application.
import { z } from "zod";
import { previewAnswers } from "@/lib/mentor-ai";
import { getUnit } from "@/lib/communities";
import { getProfile, PROFILES } from "@/lib/seed";

const PROFILE_IDS = new Set(PROFILES.map((p) => p.id));

const Draft = z.object({
  profile_id: z.string().refine((id) => PROFILE_IDS.has(id), "Unknown profile."),
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
    return Response.json(
      { error: "Finish Part A and type something for each Part B question before previewing." },
      { status: 400 }
    );
  }
  const draft = parsed.data;
  const listing = {
    ...draft,
    profile: getProfile(draft.profile_id),
    unit_name: getUnit(draft.unit_code)?.name ?? null,
  };
  return Response.json(await previewAnswers(listing));
}
