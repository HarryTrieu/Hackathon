// User reports on mentor profiles, AI chats and community posts.
// AI never hides anything; a human resolves these on /review.
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { actAs, actAsModerator, denied } from "@/lib/actor";
import { pingModerators } from "@/lib/realtime";

const CreateReport = z.object({
  target_type: z.enum(["mentor", "chat", "post"]),
  target_id: z.string().trim().min(1).max(80),
  reporter_id: z.string().min(1).max(80),
  reason: z.string().trim().min(3, "Pick or write a reason.").max(300),
});

const ResolveReport = z.object({
  id: z.string().min(1),
  action: z.literal("resolve"),
  moderator_id: z.string().min(1).max(80),
});

function memoryStore() {
  globalThis.__soduReports ??= [];
  return globalThis.__soduReports;
}

// The open reports, for moderators only (a reported chat includes messages).
export async function GET(request) {
  const mod = await actAsModerator(new URL(request.url).searchParams.get("moderator_id"));
  if (!mod.ok) return denied(mod);
  const db = supabaseAdmin();
  if (db) {
    const { data, error } = await db
      .from("reports")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && Array.isArray(data)) {
      return Response.json({ reports: await withConversations(db, data), persisted: true });
    }
  }
  return Response.json({
    reports: memoryStore().filter((r) => r.status === "open"),
    persisted: false,
  });
}

// A reported chat ("dm:<other>", filed by one side) gets the last 20 messages
// between the two people, so a moderator can judge it. No AI reads them.
async function withConversations(db, reports) {
  return Promise.all(
    reports.map(async (r) => {
      if (r.target_type === "chat" && r.target_id.startsWith("session:")) return withSessionChat(db, r);
      if (r.target_type !== "chat" || !r.target_id.startsWith("dm:")) return r;
      const other = r.target_id.slice(3);
      const [a, b] = r.reporter_id < other ? [r.reporter_id, other] : [other, r.reporter_id];
      const { data: convo } = await db.from("conversations").select("id").eq("a_id", a).eq("b_id", b).maybeSingle();
      if (!convo) return { ...r, conversation: [] };
      // Deleted messages are included (marked) so evidence can't be removed.
      const query = (cols) =>
        db.from("messages").select(cols).eq("conversation_id", convo.id).order("created_at", { ascending: false }).limit(20);
      let { data: messages, error } = await query("sender_id, text, created_at, deleted_at");
      if (error) ({ data: messages } = await query("sender_id, text, created_at"));
      return { ...r, reported_id: other, conversation: (messages ?? []).reverse() };
    })
  );
}

// A reported session room ("session:<id>"): its last 20 messages, but only
// if the reporter was in that session.
async function withSessionChat(db, r) {
  const id = r.target_id.slice("session:".length);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return r;
  const { data: session } = await db.from("session_requests").select("mentor_id, mentee_id").eq("id", id).maybeSingle();
  if (!session || ![session.mentor_id, session.mentee_id].includes(r.reporter_id)) return { ...r, conversation: [] };
  const { data: messages } = await db
    .from("session_messages")
    .select("sender_id, text, created_at, deleted_at")
    .eq("session_id", id)
    .order("created_at", { ascending: false })
    .limit(20);
  const reported = session.mentor_id === r.reporter_id ? session.mentee_id : session.mentor_id;
  return { ...r, reported_id: reported, conversation: (messages ?? []).reverse() };
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }

  if (body.action === "resolve") {
    const parsed = ResolveReport.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const mod = await actAsModerator(parsed.data.moderator_id);
    if (!mod.ok) return denied(mod);
    const db = supabaseAdmin();
    if (db) {
      const { error } = await db.from("reports").update({ status: "resolved" }).eq("id", parsed.data.id);
      if (!error) return Response.json({ ok: true, persisted: true });
    }
    const store = memoryStore();
    const row = store.find((r) => r.id === parsed.data.id);
    if (row) row.status = "resolved";
    return Response.json({ ok: true, persisted: false });
  }

  const parsed = CreateReport.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const who = await actAs(parsed.data.reporter_id);
  if (!who.ok) return denied(who);

  const report = {
    ...parsed.data,
    status: "open",
    created_at: new Date().toISOString(),
  };

  const db = supabaseAdmin();
  if (db) {
    const { data, error } = await db.from("reports").insert(report).select("*").single();
    if (!error && data) {
      await pingModerators(db, "review");
      return Response.json({ report: data, persisted: true });
    }
  }
  const local = { id: `rep-${parsed.data.reporter_id}-${parsed.data.target_id}`, ...report };
  const store = memoryStore();
  if (!store.some((r) => r.id === local.id && r.status === "open")) store.unshift(local);
  return Response.json({ report: local, persisted: false });
}
