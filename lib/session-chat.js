// Server-only helpers for session rooms (the conversation inside one
// session), shared by /api/session-chat and the Messages inbox count.
import { isOpenSession, sessionState } from "./sessions.js";

export const missingTable = (error) => ["PGRST205", "42P01"].includes(error?.code);

export const roleIn = (session, me) => (session.mentor_id === me ? "mentor" : session.mentee_id === me ? "mentee" : null);

// Unread when the other person wrote last after you last opened the room.
export function isUnread(session, me) {
  const role = roleIn(session, me);
  if (!role || !session.last_message_at || session.last_sender_id === me) return false;
  const readAt = role === "mentor" ? session.mentor_read_at : session.mentee_read_at;
  return !readAt || session.last_message_at > readAt;
}

// Your sessions, newest activity first, for the Sessions tab and the badge.
export async function mySessions(db, me) {
  const { data } = await db
    .from("session_requests")
    .select("*")
    .or(`mentor_id.eq.${me},mentee_id.eq.${me}`)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? [])
    .map((s) => ({ ...s, state: sessionState(s), role: roleIn(s, me), unread: isUnread(s, me) }))
    .sort((a, b) => (b.last_message_at ?? b.created_at).localeCompare(a.last_message_at ?? a.created_at));
}

export const openCount = (sessions) => sessions.filter(isOpenSession).length;
