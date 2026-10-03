// The conversation inside one session ("session room"), separate from
// Messages. Only the session's mentor and mentee can read or write it; it
// takes messages only while the session runs (accepted, not yet ended).
//   GET  ?profile_id=X                  your sessions (Sessions tab)
//   GET  ?profile_id=X&id=S             one session room (marks it read)
//   POST { profile_id, session_id, text }                send
//   POST { profile_id, message_id, action: "delete" }    delete your own message
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { actAs, denied } from "@/lib/actor";
import { realProfiles } from "@/lib/account";
import { getProfile } from "@/lib/seed";
import { canChatInSession } from "@/lib/sessions";
import { missingTable, mySessions, roleIn } from "@/lib/session-chat";
import { ping } from "@/lib/realtime";

const MAX_PER_MINUTE = 15;
const PROFILE_ID = /^(p\d+|u-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NO_STORE = { "Cache-Control": "private, no-store" };
const notReady = () =>
  Response.json({ error: "Session chats need the database update (session-journey migration)." }, { status: 503 });

async function profileOf(id) {
  return getProfile(id) ?? (await realProfiles([id])).get(id) ?? null;
}

async function blockedEitherWay(db, x, y) {
  const { data } = await db
    .from("blocks")
    .select("blocker_id, blocked_id")
    .or(`and(blocker_id.eq.${x},blocked_id.eq.${y}),and(blocker_id.eq.${y},blocked_id.eq.${x})`);
  return {
    byMe: (data ?? []).some((b) => b.blocker_id === x),
    me: (data ?? []).some((b) => b.blocker_id === y),
  };
}

// The session if you're in it, else null.
async function sessionFor(db, id, me) {
  if (!UUID.test(id ?? "")) return null;
  const { data } = await db.from("session_requests").select("*").eq("id", id).maybeSingle();
  return data && roleIn(data, me) ? data : null;
}

const shown = (m) => (m.deleted_at ? { ...m, text: null, deleted: true } : m);

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const me = params.get("profile_id");
  const who = await actAs(me);
  if (!who.ok) return denied(who);
  if (!PROFILE_ID.test(me ?? "")) return Response.json({ error: "Unknown profile." }, { status: 400 });
  const db = supabaseAdmin();
  if (!db) return Response.json({ sessions: [] }, { headers: NO_STORE });

  const id = params.get("id");
  if (!id) {
    const sessions = await mySessions(db, me);
    const people = await realProfiles(sessions.map((s) => (s.role === "mentor" ? s.mentee_id : s.mentor_id)));
    // Last message text per session for the list preview.
    const ids = sessions.filter((s) => s.last_message_at).map((s) => s.id);
    const last = new Map();
    if (ids.length) {
      const { data } = await db
        .from("session_messages")
        .select("session_id, text, deleted_at, created_at")
        .in("session_id", ids)
        .order("created_at", { ascending: false })
        .limit(ids.length * 5);
      for (const m of data ?? []) if (!last.has(m.session_id)) last.set(m.session_id, m.deleted_at ? "Message deleted" : m.text);
    }
    return Response.json(
      {
        sessions: sessions
          .map((s) => {
            const otherId = s.role === "mentor" ? s.mentee_id : s.mentor_id;
            return {
              id: s.id,
              unit_code: s.unit_code,
              state: s.state,
              role: s.role,
              other: getProfile(otherId) ?? people.get(otherId) ?? null,
              last_text: last.get(s.id) ?? s.message,
              last_message_at: s.last_message_at ?? s.created_at,
              last_sender_id: s.last_message_at ? s.last_sender_id : s.mentee_id,
              unread: s.unread,
            };
          })
          .filter((s) => s.other),
      },
      { headers: NO_STORE }
    );
  }

  const session = await sessionFor(db, id, me);
  if (!session) return Response.json({ error: "Session not found." }, { status: 404 });
  const otherId = roleIn(session, me) === "mentor" ? session.mentee_id : session.mentor_id;
  const other = await profileOf(otherId);
  if (!other) return Response.json({ error: "Session not found." }, { status: 404 });

  const { data, error } = await db
    .from("session_messages")
    .select("id, sender_id, text, deleted_at, created_at")
    .eq("session_id", session.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (missingTable(error)) return notReady();
  // Opening the room reads it (ignored before the read columns exist).
  await db
    .from("session_requests")
    .update({ [roleIn(session, me) === "mentor" ? "mentor_read_at" : "mentee_read_at"]: new Date().toISOString() })
    .eq("id", session.id);
  const blocked = await blockedEitherWay(db, me, otherId);
  return Response.json(
    {
      session,
      other,
      messages: (data ?? []).reverse().map(shown),
      can_send: canChatInSession(session) && !blocked.me && !blocked.byMe,
      blocked: blocked.me || blocked.byMe,
    },
    { headers: NO_STORE }
  );
}

const Send = z.object({
  profile_id: z.string().min(1).max(80),
  session_id: z.string().uuid(),
  text: z.string().trim().min(1, "Type a message.").max(2000, "Keep it under 2000 characters."),
});

const Delete = z.object({
  profile_id: z.string().min(1).max(80),
  message_id: z.string().uuid(),
  action: z.literal("delete"),
});

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const db = supabaseAdmin();

  if (body?.action === "delete") {
    const parsed = Delete.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const who = await actAs(parsed.data.profile_id);
    if (!who.ok) return denied(who);
    if (!db) return notReady();
    const { data, error } = await db
      .from("session_messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", parsed.data.message_id)
      .eq("sender_id", parsed.data.profile_id)
      .is("deleted_at", null)
      .select("id");
    if (missingTable(error)) return notReady();
    if (error) return Response.json({ error: "Could not delete the message." }, { status: 500 });
    if (data.length === 0) return Response.json({ error: "You can only delete your own messages." }, { status: 404 });
    return Response.json({ ok: true });
  }

  const parsed = Send.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { profile_id: me, session_id, text } = parsed.data;
  const who = await actAs(me);
  if (!who.ok) return denied(who);
  if (!PROFILE_ID.test(me)) return Response.json({ error: "Unknown profile." }, { status: 400 });
  if (!db) return notReady();

  const session = await sessionFor(db, session_id, me);
  if (!session) return Response.json({ error: "Session not found." }, { status: 404 });
  if (!canChatInSession(session)) {
    return Response.json(
      { error: "This session isn't running, so its chat is closed. Message them in Messages instead." },
      { status: 409 }
    );
  }
  const otherId = roleIn(session, me) === "mentor" ? session.mentee_id : session.mentor_id;
  const blocked = await blockedEitherWay(db, me, otherId);
  if (blocked.me || blocked.byMe) return Response.json({ error: "You can't message this person." }, { status: 403 });

  const since = new Date(Date.now() - 60_000).toISOString();
  const recent = await db
    .from("session_messages")
    .select("id", { count: "exact", head: true })
    .eq("sender_id", me)
    .gte("created_at", since);
  if (missingTable(recent.error)) return notReady();
  if ((recent.count ?? 0) >= MAX_PER_MINUTE) {
    return Response.json({ error: "You're sending messages too fast. Wait a minute." }, { status: 429 });
  }

  const { data: message, error } = await db
    .from("session_messages")
    .insert({ session_id: session.id, sender_id: me, text })
    .select("id, sender_id, text, created_at")
    .single();
  if (error) return Response.json({ error: "Could not send the message." }, { status: 500 });
  const now = new Date().toISOString();
  await db
    .from("session_requests")
    .update({
      last_message_at: now,
      last_sender_id: me,
      [roleIn(session, me) === "mentor" ? "mentor_read_at" : "mentee_read_at"]: now,
    })
    .eq("id", session.id);
  await ping([otherId], "session-message");
  return Response.json({ message });
}
