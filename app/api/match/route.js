// Conversational mentor matching for one unit. The client sends the whole
// conversation; the AI either asks one follow-up question or returns every
// mentor ranked with a reason.
import { z } from "zod";
import { loadListings, matchMentors } from "@/lib/mentor-ai";

const MatchRequest = z.object({
  unit_code: z.string().regex(/^[A-Z]{3}\d{3}$/, "Invalid unit code."),
  messages: z
    .array(
      z.object({
        role: z.enum(["mentee", "ai"]),
        text: z.string().trim().min(1).max(1000),
      })
    )
    .min(1, "Describe what you are looking for.")
    .max(24),
});

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = MatchRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { unit_code, messages } = parsed.data;
  if (messages.at(-1).role !== "mentee") {
    return Response.json({ error: "Last message must be from the mentee." }, { status: 400 });
  }

  const candidates = await loadListings({ unitCode: unit_code });
  const result = await matchMentors(candidates, messages);
  return Response.json(result);
}
