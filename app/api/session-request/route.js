// Session requests between a mentee and a mentor, end to end:
//   POST   mentee asks for a session (message, proposed time and place)
//   PATCH  mentor accepts or declines; later the mentee rates the session
//          and the mentor confirms whether it happened
//   GET    a mentor's incoming requests
// No payments: the request records the listed rate and the two people
// arrange the rest once it's accepted (contacts show in Notifications).
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { loadListings } from "@/lib/mentor-ai";
import { LISTING_ID, parseListingId } from "@/lib/mentors";
import { PLACES } from "@/lib/sessions";
import { actAs, denied } from "@/lib/actor";

// The session-journey migration hasn't run yet: Postgres says 42703 for an
// unknown column in a filter, Supabase (PostgREST) PGRST204 for one in data.
const missingColumn = (error) => error?.code === "42703" || error?.code === "PGRST204";

const SessionRequest = z.object({
  listing_id: z.string().regex(LISTING_ID, "Invalid mentor."),
  mentee_id: z.string().min(1).max(80),
  message: z.string().trim().min(5, "Add a short message for the mentor.").max(1000),
  // Optional: since 2 Oct the mentor arranges time and place in Messages
  // after accepting. Still accepted if a client sends them.
  proposed_time: z.string().datetime({ offset: true }).optional(),
  proposed_place: z.enum(PLACES).optional(),
  place_detail: z.string().trim().max(80).optional(),
});

export async function GET(request) {
  const mentorId = new URL(request.url).searchParams.get("mentor_id");
  // A mentor's incoming requests are private to that mentor.
  const who = await actAs(mentorId);
  if (!who.ok) return denied(who);
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

const Update = z.discriminatedUnion("action", [
  // Mentor answers a pending request.
  z.object({
    action: z.enum(["accept", "decline"]),
    id: z.string().uuid(),
    mentor_id: z.string().min(1).max(80),
  }),
  // Mentee rates an accepted session, once.
  z.object({
    action: z.literal("rate"),
    id: z.string().uuid(),
    mentee_id: z.string().min(1).max(80),
    rating: z.number().int().min(1, "Pick 1 to 5 stars.").max(5),
    helped: z.boolean({ message: "Say whether it helped." }),
    comment: z.string().trim().max(500).optional(),
  }),
  // Mentor confirms whether an accepted session happened, once.
  z.object({
    action: z.literal("held"),
    id: z.string().uuid(),
    mentor_id: z.string().min(1).max(80),
    held: z.boolean(),
  }),
]);

export async function PATCH(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = Update.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const input = parsed.data;
  // Each action belongs to one side of the request.
  const who = await actAs(input.action === "rate" ? input.mentee_id : input.mentor_id);
  if (!who.ok) return denied(who);

  const db = supabaseAdmin();
  const now = new Date().toISOString();

  if (input.action === "accept" || input.action === "decline") {
    const status = input.action === "accept" ? "accepted" : "declined";
    if (!db) return Response.json({ ok: true, status, persisted: false });
    // Only a still-pending ("sent") request of this mentor can change, so a
    // replay cannot flip a decision.
    const answer = (patch) =>
      db
        .from("session_requests")
        .update(patch)
        .eq("id", input.id)
        .eq("mentor_id", input.mentor_id)
        .eq("status", "sent")
        .select("id");
    let { data, error } = await answer({ status, decided_at: now });
    if (missingColumn(error)) ({ data, error } = await answer({ status }));
    if (error) return Response.json({ error: "Could not update the request." }, { status: 500 });
    if (data.length === 0) {
      return Response.json({ error: "Request not found or already answered." }, { status: 409 });
    }
    return Response.json({ ok: true, status, persisted: true });
  }

  if (!db) return Response.json({ error: "Ratings need the database." }, { status: 503 });

  const patch =
    input.action === "rate"
      ? { rating: input.rating, helped: input.helped, rating_comment: input.comment || null, rated_at: now }
      : { held: input.held, held_at: now };
  const owner = input.action === "rate" ? ["mentee_id", input.mentee_id] : ["mentor_id", input.mentor_id];
  const answered = input.action === "rate" ? "rating" : "held";
  const { data, error } = await db
    .from("session_requests")
    .update(patch)
    .eq("id", input.id)
    .eq(owner[0], owner[1])
    .eq("status", "accepted")
    .is(answered, null)
    .select("id");
  if (missingColumn(error)) {
    return Response.json(
      { error: "The database needs the session-journey update before sessions can be rated." },
      { status: 503 }
    );
  }
  if (error) return Response.json({ error: "Could not save that." }, { status: 500 });
  if (data.length === 0) {
    return Response.json(
      { error: "Only an accepted session can be answered, and only once." },
      { status: 409 }
    );
  }
  return Response.json({ ok: true, persisted: true });
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
  const { listing_id, mentee_id, message, proposed_time, proposed_place, place_detail } = parsed.data;
  const who = await actAs(mentee_id);
  if (!who.ok) return denied(who);
  const { profileId: mentorId, unitCode } = parseListingId(listing_id);
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
    proposed_time: proposed_time ? new Date(proposed_time).toISOString() : null,
    proposed_place: proposed_place ? (place_detail ? `${proposed_place}: ${place_detail}` : proposed_place) : null,
    created_at: new Date().toISOString(),
  };
  const db = supabaseAdmin();
  let persisted = false;
  if (db) {
    let { error } = await db.from("session_requests").insert(row);
    if (missingColumn(error)) {
      // Before the migration: save the request without time and place.
      const { proposed_time: _t, proposed_place: _p, ...basic } = row;
      ({ error } = await db.from("session_requests").insert(basic));
    }
    persisted = !error;
  }
  return Response.json({ request: row, persisted });
}
