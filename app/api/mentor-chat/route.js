// Chat with a mentor's AI preview. Limited to MAX_CHATS_PER_DAY messages per
// person per day across all mentors (Melbourne time), counted server-side.
// The conversation so far is read from the database, never trusted from the
// browser, so nobody can slip a fake "mentor said..." into the AI's context.
// Without the database the count lives in server memory, which resets on
// restart and is per-instance on Vercel: fine for a demo, not for billing.
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { loadListings, mentorReply } from "@/lib/mentor-ai";
import { LISTING_ID, MAX_CHATS_PER_DAY, parseListingId } from "@/lib/mentors";
import { actAs, denied } from "@/lib/actor";


const memoryCounts = (globalThis.__soduChatCounts ??= new Map());

function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });
}

async function usedToday(db, menteeId) {
  if (db) {
    const { count, error } = await db
      .from("mentor_chats")
      .select("id", { count: "exact", head: true })
      .eq("mentee_id", menteeId)
      .eq("role", "mentee")
      .eq("day", today());
    // A missing table comes back as count null with no error on HEAD requests.
    if (!error && typeof count === "number") return { used: count, store: "db" };
  }
  return { used: memoryCounts.get(`${menteeId}|${today()}`) ?? 0, store: "memory" };
}

// Today's conversation with this mentor's AI, oldest first (last 10 turns).
async function storedHistory(db, listingId, menteeId) {
  const { data } = await db
    .from("mentor_chats")
    .select("role, text, created_at")
    .eq("mentor_listing", listingId)
    .eq("mentee_id", menteeId)
    .eq("day", today())
    .order("created_at", { ascending: false })
    .limit(10);
  return (data ?? []).reverse().map(({ role, text }) => ({ role, text }));
}

const ChatRequest = z.object({
  listing_id: z.string().regex(LISTING_ID, "Invalid mentor."),
  mentee_id: z.string().min(1).max(80),
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
  if (!LISTING_ID.test(listingId)) {
    return Response.json({ error: "listing_id and mentee_id are required." }, { status: 400 });
  }
  const who = await actAs(menteeId);
  if (!who.ok) return denied(who);
  const { used } = await usedToday(supabaseAdmin(), menteeId);
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
  const who = await actAs(mentee_id);
  if (!who.ok) return denied(who);

  const { unitCode } = parseListingId(listing_id);
  const listing = (await loadListings({ unitCode })).find((l) => l.id === listing_id);
  if (!listing) return Response.json({ error: "Mentor not found." }, { status: 404 });

  const db = supabaseAdmin();
  const { used, store } = await usedToday(db, mentee_id);
  if (used >= MAX_CHATS_PER_DAY) {
    return Response.json(
      {
        error: `You've used your ${MAX_CHATS_PER_DAY} AI messages for today. Request a session, or come back tomorrow.`,
        remaining: 0,
      },
      { status: 429 }
    );
  }

  // With the database, the history comes from what was actually said; the
  // browser's copy is only used when there's no database (local demo).
  const context = store === "db" ? await storedHistory(db, listing_id, mentee_id) : history;
  const { reply, mocked } = await mentorReply(listing, context, text);

  let saved = false;
  if (store === "db") {
    const { error } = await db.from("mentor_chats").insert([
      { mentor_listing: listing_id, mentee_id, role: "mentee", text, day: today() },
      { mentor_listing: listing_id, mentee_id, role: "mentor", text: reply, day: today() },
    ]);
    saved = !error;
  }
  if (!saved) memoryCounts.set(`${mentee_id}|${today()}`, used + 1);

  return Response.json({
    reply,
    mocked,
    remaining: Math.max(0, MAX_CHATS_PER_DAY - used - 1),
  });
}
