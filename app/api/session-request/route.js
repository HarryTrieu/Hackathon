// Mentee asks the real mentor for a paid session. No payments: the request
// records the listed rate and the mentor follows up.
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { loadListings } from "@/lib/mentor-ai";
import { PROFILES } from "@/lib/seed";

const PROFILE_IDS = new Set(PROFILES.map((p) => p.id));

const SessionRequest = z.object({
  listing_id: z.string().regex(/^p\d+-[A-Z]{3}\d{3}$/, "Invalid mentor."),
  mentee_id: z.string().refine((id) => PROFILE_IDS.has(id), "Unknown mentee."),
  message: z.string().trim().min(5, "Add a short message for the mentor.").max(1000),
});

export async function GET(request) {
  const mentorId = new URL(request.url).searchParams.get("mentor_id");
  if (!PROFILE_IDS.has(mentorId ?? "")) {
    return Response.json({ error: "mentor_id is required." }, { status: 400 });
  }
  const db = supabaseAdmin();
  if (!db) return Response.json({ requests: null });
  const { data, error } = await db
    .from("session_requests")
    .select("*")
    .eq("mentor_id", mentorId)
    .order("created_at", { ascending: false })
    .limit(20);
  return Response.json({ requests: error ? null : data });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = SessionRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { listing_id, mentee_id, message } = parsed.data;
  const [mentorId, unitCode] = listing_id.split("-");
  if (mentorId === mentee_id) {
    return Response.json({ error: "You can't book a session with yourself." }, { status: 400 });
  }
  const listing = (await loadListings({ unitCode })).find((l) => l.id === listing_id);
  if (!listing) return Response.json({ error: "Mentor not found." }, { status: 404 });

  const row = {
    id: randomUUID(),
    mentor_listing: listing_id,
    mentor_id: mentorId,
    mentee_id,
    unit_code: unitCode,
    message,
    rate_per_hour: listing.rate_per_hour,
    status: "sent",
    created_at: new Date().toISOString(),
  };
  const db = supabaseAdmin();
  let persisted = false;
  if (db) {
    const { error } = await db.from("session_requests").insert(row);
    persisted = !error;
  }
  return Response.json({ request: row, persisted });
}
