// Mentee asks the real mentor for a paid session. No payments: the request
// records the listed rate and the mentor follows up.
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { loadListings } from "@/lib/mentor-ai";
import { LISTING_ID, parseListingId } from "@/lib/mentors";
import { actAs, denied } from "@/lib/actor";

const SessionRequest = z.object({
  listing_id: z.string().regex(LISTING_ID, "Invalid mentor."),
  mentee_id: z.string().min(1).max(80),
  message: z.string().trim().min(5, "Add a short message for the mentor.").max(1000),
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

const Decision = z.object({
  id: z.string().uuid(),
  mentor_id: z.string().min(1).max(80),
  action: z.enum(["accept", "decline"]),
});

// The mentor answers a request. Only a still-pending ("sent") request that
// belongs to this mentor can change, so a replay cannot flip a decision.
export async function PATCH(request) {
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
  const { id, mentor_id, action } = parsed.data;
  const who = await actAs(mentor_id);
  if (!who.ok) return denied(who);
  const status = action === "accept" ? "accepted" : "declined";

  const db = supabaseAdmin();
  if (!db) return Response.json({ ok: true, status, persisted: false });
  const { data, error } = await db
    .from("session_requests")
    .update({ status })
    .eq("id", id)
    .eq("mentor_id", mentor_id)
    .eq("status", "sent")
    .select("id");
  if (error) return Response.json({ error: "Could not update the request." }, { status: 500 });
  if (data.length === 0) {
    return Response.json({ error: "Request not found or already answered." }, { status: 409 });
  }
  return Response.json({ ok: true, status, persisted: true });
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
