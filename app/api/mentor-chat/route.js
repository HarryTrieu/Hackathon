// Chat with a mentor's AI preview. Limited to MAX_CHATS_PER_DAY mentee
// messages per mentor per day (Melbourne time), counted server-side.
// Without the database the count lives in server memory, which resets on
// restart and is per-instance on Vercel: fine for a demo, not for billing.
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { loadListings, mentorReply } from "@/lib/mentor-ai";
import { MAX_CHATS_PER_DAY } from "@/lib/mentors";
import { PROFILES } from "@/lib/seed";

const PROFILE_IDS = new Set(PROFILES.map((p) => p.id));
const LISTING_ID = /^p\d+-[A-Z]{3}\d{3}$/;

const memoryCounts = (globalThis.__soduChatCounts ??= new Map());

function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });
}

async function usedToday(db, listingId, menteeId) {
  if (db) {
    const { count, error } = await db
      .from("mentor_chats")
      .select("id", { count: "exact", head: true })
      .eq("mentor_listing", listingId)
      .eq("mentee_id", menteeId)
      .eq("role", "mentee")
      .eq("day", today());
    // A missing table comes back as count null with no error on HEAD requests.
    if (!error && typeof count === "number") return { used: count, store: "db" };
  }
  return { used: memoryCounts.get(`${listingId}|${menteeId}|${today()}`) ?? 0, store: "memory" };
}

const ChatRequest = z.object({
  listing_id: z.string().regex(LISTING_ID, "Invalid mentor."),
  mentee_id: z.string().refine((id) => PROFILE_IDS.has(id), "Unknown mentee."),
  history: z
    .array(z.object({ role: z.enum(["mentee", "mentor"]), text: z.string().max(2000) }))
    .max(20)
    .default([]),
  text: z.string().trim().min(1, "Type a message.").max(500),
});

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const listingId = params.get("listing_id") ?? "";
  const menteeId = params.get("mentee_id") ?? "";
  if (!LISTING_ID.test(listingId) || !PROFILE_IDS.has(menteeId)) {
    return Response.json({ error: "listing_id and mentee_id are required." }, { status: 400 });
  }
  const { used } = await usedToday(supabaseAdmin(), listingId, menteeId);
  return Response.json({ remaining: Math.max(0, MAX_CHATS_PER_DAY - used) });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = ChatRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { listing_id, mentee_id, history, text } = parsed.data;

  const unitCode = listing_id.split("-")[1];
  const listing = (await loadListings({ unitCode })).find((l) => l.id === listing_id);
  if (!listing) return Response.json({ error: "Mentor not found." }, { status: 404 });

  const db = supabaseAdmin();
  const { used, store } = await usedToday(db, listing_id, mentee_id);
  if (used >= MAX_CHATS_PER_DAY) {
    return Response.json(
      { error: `You've used your ${MAX_CHATS_PER_DAY} messages with this mentor today. Request a session or try another mentor.`, remaining: 0 },
      { status: 429 }
    );
  }

  const { reply, mocked } = await mentorReply(listing, history, text);

  let saved = false;
  if (store === "db") {
    const { error } = await db.from("mentor_chats").insert([
      { mentor_listing: listing_id, mentee_id, role: "mentee", text, day: today() },
      { mentor_listing: listing_id, mentee_id, role: "mentor", text: reply, day: today() },
    ]);
    saved = !error;
  }
  if (!saved) memoryCounts.set(`${listing_id}|${mentee_id}|${today()}`, used + 1);

  return Response.json({
    reply,
    mocked,
    remaining: Math.max(0, MAX_CHATS_PER_DAY - used - 1),
  });
}
