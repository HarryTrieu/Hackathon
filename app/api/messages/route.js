// In-app messages between any two people.
//   GET  ?profile_id=X             your conversations, newest first, unread count
//   GET  ?profile_id=X&with=Y      the conversation with Y (marks it read)
//   POST { profile_id, to_id, text }                  send a message
//   POST { profile_id, other_id, action: block|unblock }
//   POST { profile_id, message_id, action: "delete" }   delete your own message
// No AI reads messages. A message can be reported; a moderator then sees it.
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { actAs, denied } from "@/lib/actor";
import { realProfiles } from "@/lib/account";
import { getProfile } from "@/lib/seed";

const MAX_PER_MINUTE = 15;
// A profile id: seeded ("p13") or a real account ("u-<uuid>"). Checked before
// any id goes into a database filter string.
const PROFILE_ID = /^(p\d+|u-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
const NO_STORE = { "Cache-Control": "private, no-store" };

// The chat tables (session-journey migration) aren't there yet.
const missingTable = (error) => ["PGRST205", "42P01"].includes(error?.code);
const notReady = () =>
  Response.json({ error: "Messages need the database update (session-journey migration)." }, { status: 503 });

// messages.deleted_at isn't there yet (column added later in the migration).
const missingColumn = (error) => ["42703", "PGRST204"].includes(error?.code);

// Run a messages select with deleted_at, or without it before the migration.
async function selectMessages(build, columns) {
  const res = await build(`${columns}, deleted_at`);
  return missingColumn(res.error) ? build(columns) : res;
}

// What people see: a deleted message keeps its place but not its text.
const shown = (m) => (m.deleted_at ? { ...m, text: null, deleted: true } : m);

// Conversations are stored once per pair, with a_id < b_id.
const pairOf = (x, y) => (x < y ? [x, y] : [y, x]);

async function profilesById(ids) {
  const real = await realProfiles(ids);
  return (id) => getProfile(id) ?? real.get(id) ?? null;
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

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const me = params.get("profile_id");
  const who = await actAs(me);
  if (!who.ok) return denied(who);
  const db = supabaseAdmin();
  if (!db) return Response.json({ conversations: [], unread: 0 }, { headers: NO_STORE });

  const other = params.get("with");
  if (other && !PROFILE_ID.test(other)) return Response.json({ error: "That person doesn't exist." }, { status: 404 });
  if (!PROFILE_ID.test(me)) return Response.json({ error: "Unknown profile." }, { status: 400 });
  if (!other) {
    const { data, error } = await db
      .from("conversations")
      .select("*")
      .or(`a_id.eq.${me},b_id.eq.${me}`)
      .not("last_message_at", "is", null)
      .order("last_message_at", { ascending: false })
      .limit(50);
    if (missingTable(error)) return notReady();
    if (error) return Response.json({ error: "Could not load messages." }, { status: 500 });
    const lookup = await profilesById(data.map((c) => (c.a_id === me ? c.b_id : c.a_id)));
    const lastTexts = await lastMessages(db, data.map((c) => c.id));
    const conversations = data
      .map((c) => {
        const otherId = c.a_id === me ? c.b_id : c.a_id;
        const readAt = c.a_id === me ? c.a_read_at : c.b_read_at;
        return {
          id: c.id,
          other: lookup(otherId),
          last_text: lastTexts.get(c.id) ?? "",
          last_message_at: c.last_message_at,
          last_sender_id: c.last_sender_id,
          unread: c.last_sender_id !== me && (!readAt || c.last_message_at > readAt),
        };
      })
      .filter((c) => c.other);
    return Response.json(
      { conversations, unread: conversations.filter((c) => c.unread).length },
      { headers: NO_STORE }
    );
  }

  // One conversation.
  const lookup = await profilesById([other]);
  const otherProfile = lookup(other);
  if (!otherProfile) return Response.json({ error: "That person doesn't exist." }, { status: 404 });
  const [a, b] = pairOf(me, other);
  const { data: convo, error } = await db.from("conversations").select("*").eq("a_id", a).eq("b_id", b).maybeSingle();
  if (missingTable(error)) return notReady();
  if (error) return Response.json({ error: "Could not load messages." }, { status: 500 });

  let messages = [];
  if (convo) {
    const res = await selectMessages(
      (cols) =>
        db.from("messages").select(cols).eq("conversation_id", convo.id).order("created_at", { ascending: false }).limit(100),
      "id, sender_id, text, created_at"
    );
    messages = (res.data ?? []).reverse().map(shown);
    // Opening the conversation reads it.
    await db.from("conversations").update({ [me === a ? "a_read_at" : "b_read_at"]: new Date().toISOString() }).eq("id", convo.id);
  }
  // Session requests between the two, so the chat can show rating steps.
  const { data: sessions } = await db
    .from("session_requests")
    .select("*")
    .or(`and(mentor_id.eq.${me},mentee_id.eq.${other}),and(mentor_id.eq.${other},mentee_id.eq.${me})`)
    .order("created_at", { ascending: false })
    .limit(10);
  const blocked = await blockedEitherWay(db, me, other);
  return Response.json(
    {
      other: otherProfile,
      messages,
      sessions: sessions ?? [],
      blocked_by_me: blocked.byMe,
      blocked_me: blocked.me,
    },
    { headers: NO_STORE }
  );
}

// The newest message text of each conversation, for the list preview.
async function lastMessages(db, ids) {
  const texts = new Map();
  if (ids.length === 0) return texts;
  const { data } = await selectMessages(
    (cols) => db.from("messages").select(cols).in("conversation_id", ids).order("created_at", { ascending: false }).limit(ids.length * 5),
    "conversation_id, text, created_at"
  );
  for (const m of data ?? []) {
    if (!texts.has(m.conversation_id)) texts.set(m.conversation_id, m.deleted_at ? "Message deleted" : m.text);
  }
  return texts;
}

const Send = z.object({
  profile_id: z.string().min(1).max(80),
  to_id: z.string().regex(PROFILE_ID, "That person doesn't exist."),
  text: z.string().trim().min(1, "Type a message.").max(2000, "Keep it under 2000 characters."),
});

const DeleteAction = z.object({
  profile_id: z.string().min(1).max(80),
  message_id: z.string().uuid(),
  action: z.literal("delete"),
});

const BlockAction = z.object({
  profile_id: z.string().min(1).max(80),
  other_id: z.string().regex(PROFILE_ID, "That person doesn't exist."),
  action: z.enum(["block", "unblock"]),
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
    const parsed = DeleteAction.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const who = await actAs(parsed.data.profile_id);
    if (!who.ok) return denied(who);
    if (!db) return notReady();
    // Only your own message, and only once.
    const { data, error } = await db
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", parsed.data.message_id)
      .eq("sender_id", parsed.data.profile_id)
      .is("deleted_at", null)
      .select("id");
    if (missingColumn(error)) {
      return Response.json({ error: "Deleting messages needs the database update (session-journey migration)." }, { status: 503 });
    }
    if (error) return Response.json({ error: "Could not delete the message." }, { status: 500 });
    if (data.length === 0) return Response.json({ error: "You can only delete your own messages." }, { status: 404 });
    return Response.json({ ok: true });
  }

  if (body?.action) {
    const parsed = BlockAction.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const { profile_id: me, other_id: other, action } = parsed.data;
    const who = await actAs(me);
    if (!who.ok) return denied(who);
    if (!db) return notReady();
    const { error } =
      action === "block"
        ? await db.from("blocks").upsert({ blocker_id: me, blocked_id: other })
        : await db.from("blocks").delete().eq("blocker_id", me).eq("blocked_id", other);
    if (missingTable(error)) return notReady();
    if (error) return Response.json({ error: "Could not update that." }, { status: 500 });
    return Response.json({ ok: true });
  }

  const parsed = Send.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { profile_id: me, to_id: other, text } = parsed.data;
  const who = await actAs(me);
  if (!who.ok) return denied(who);
  if (me === other) return Response.json({ error: "You can't message yourself." }, { status: 400 });
  if (!PROFILE_ID.test(me)) return Response.json({ error: "Unknown profile." }, { status: 400 });
  if (!db) return notReady();

  const lookup = await profilesById([other]);
  if (!lookup(other)) return Response.json({ error: "That person doesn't exist." }, { status: 404 });

  const blocked = await blockedEitherWay(db, me, other);
  if (blocked.me) return Response.json({ error: "You can't message this person." }, { status: 403 });
  if (blocked.byMe) return Response.json({ error: "Unblock them first to send a message." }, { status: 403 });

  // A simple flood limit per sender.
  const since = new Date(Date.now() - 60_000).toISOString();
  const recent = await db.from("messages").select("id", { count: "exact", head: true }).eq("sender_id", me).gte("created_at", since);
  if (missingTable(recent.error)) return notReady();
  if ((recent.count ?? 0) >= MAX_PER_MINUTE) {
    return Response.json({ error: "You're sending messages too fast. Wait a minute." }, { status: 429 });
  }

  const [a, b] = pairOf(me, other);
  const now = new Date().toISOString();
  let { data: convo, error } = await db.from("conversations").select("id").eq("a_id", a).eq("b_id", b).maybeSingle();
  if (missingTable(error)) return notReady();
  if (!convo) {
    ({ data: convo, error } = await db.from("conversations").insert({ a_id: a, b_id: b }).select("id").single());
    // Two first messages at once: the other insert won, so read it back.
    if (error?.code === "23505") ({ data: convo, error } = await db.from("conversations").select("id").eq("a_id", a).eq("b_id", b).single());
  }
  if (error || !convo) return Response.json({ error: "Could not start the conversation." }, { status: 500 });

  const { data: message, error: sendError } = await db
    .from("messages")
    .insert({ conversation_id: convo.id, sender_id: me, text })
    .select("id, sender_id, text, created_at")
    .single();
  if (sendError) return Response.json({ error: "Could not send the message." }, { status: 500 });
  // The sender has read everything up to their own message.
  await db
    .from("conversations")
    .update({ last_message_at: now, last_sender_id: me, [me === a ? "a_read_at" : "b_read_at"]: now })
    .eq("id", convo.id);
  return Response.json({ message });
}
