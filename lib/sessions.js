// The session journey after a request, shared by the request form, the API
// and the Requests tab: where to meet, how times read, the first message.
export const PLACES = ["On campus (library)", "Online (Teams)", "Online (Zoom)", "Other"];

export const MAX_DAYS_AHEAD = 60;

// "Thu 8 Oct, 5:00 pm" in Melbourne time, where Deakin is.
export function formatWhen(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-AU", {
    timeZone: "Australia/Melbourne",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// A ready-to-copy first message once a request is accepted.
export function firstMessage({ fromName, toName, unitCode, proposedTime, proposedPlace, fromMentor }) {
  const first = (name) => name?.split(" ")[0] ?? "there";
  const when = formatWhen(proposedTime);
  const plan = [when, proposedPlace].filter(Boolean).join(", ");
  return fromMentor
    ? `Hi ${first(toName)}, it's ${first(fromName)} from Sodu. Happy to help with ${unitCode}${plan ? `. Does ${plan} still work for you?` : ". When suits you?"} Bring the part you're stuck on and we'll go through it together.`
    : `Hi ${first(toName)}, it's ${first(fromName)} from Sodu. Thanks for accepting my ${unitCode} session${plan ? ` (${plan})` : ""}. I'll bring the part I'm stuck on. See you then!`;
}

// Average rating, number of ratings and how many said it helped, for a
// mentor listing. null when nobody has rated yet.
export function ratingSummary(requests) {
  const rated = requests.filter((r) => typeof r.rating === "number");
  if (rated.length === 0) return null;
  const average = rated.reduce((sum, r) => sum + r.rating, 0) / rated.length;
  const helped = rated.filter((r) => r.helped === true).length;
  return {
    average: Math.round(average * 10) / 10,
    count: rated.length,
    helpedPercent: Math.round((helped / rated.length) * 100),
  };
}

// ---------- Session states ----------
// A request moves sent -> accepted -> completed or declined. The student ends
// a session with their rating. A session also ends by itself SESSION_DAYS
// after the mentor accepted it, and then counts as completed (and paid) even
// if the student never ended it, so nobody can keep one open to avoid paying.
// The mentor's "Mark as done" (end_requested_at) just asks the student to end it.
export const SESSION_DAYS = 5;
const DAY = 24 * 60 * 60 * 1000;

// When an accepted session ends by itself.
export function sessionEndsAt(r) {
  const start = r.decided_at ?? r.created_at;
  return start ? new Date(Date.parse(start) + SESSION_DAYS * DAY).toISOString() : null;
}

// Ended by the 5-day limit rather than by the student.
export const autoEnded = (r, now = Date.now()) =>
  r.status === "accepted" && !r.ended_at && typeof r.rating !== "number" && now > Date.parse(sessionEndsAt(r));

// "pending" | "active" | "ending" | "completed" | "declined"
export function sessionState(r, now = Date.now()) {
  if (r.status === "sent") return "pending";
  if (r.status === "declined") return "declined";
  // Ratings given before "End session" existed also count as completed.
  if (r.status === "completed" || r.ended_at || typeof r.rating === "number") return "completed";
  if (autoEnded(r, now)) return "completed";
  return r.end_requested_at ? "ending" : "active";
}

export const isOpenSession = (r) => ["pending", "active", "ending"].includes(sessionState(r));
export const isCompletedSession = (r) => sessionState(r) === "completed";


// A session room is open for messages while the session runs; it is
// read-only before the mentor accepts and after it ends.
export const canChatInSession = (r) => ["active", "ending"].includes(sessionState(r));

// Milestone pills for one session's room.
export function sessionEvents(s, meId, otherName) {
  const who = (id) => (id === meId ? "You" : otherName.split(" ")[0]);
  const state = sessionState(s);
  const events = [];
  if (state === "declined") events.push({ at: s.decided_at ?? s.created_at, text: "Session declined" });
  if (state !== "pending" && state !== "declined" && s.decided_at) {
    events.push({ at: s.decided_at, text: "Session started", tone: "start" });
  }
  if (s.end_requested_at) events.push({ at: s.end_requested_at, text: `${who(s.mentor_id)} marked the session as done` });
  if (state === "completed") {
    const rated = typeof s.rating === "number" ? ` · ${"★".repeat(s.rating)}${"☆".repeat(5 - s.rating)}` : "";
    const auto = autoEnded(s);
    events.push({
      at: auto ? sessionEndsAt(s) : (s.ended_at ?? s.rated_at ?? s.created_at),
      text: auto ? `Session ended after ${SESSION_DAYS} days${rated}` : `Session ended${rated}`,
      tone: "end",
    });
  }
  return events.map((e, i) => ({ ...e, id: `event-${i}`, event: true }));
}
