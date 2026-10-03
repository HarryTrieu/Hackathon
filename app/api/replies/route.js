// Flat replies on posts. GET lists by post, POST creates, DELETE removes your own.
// Without Supabase: GET returns replies:null (client falls back to seed),
// POST returns the reply unpersisted so the UI can keep it for the session.
import { randomUUID } from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { actAsAuthor, denied } from "@/lib/actor";
import { withRealAuthors } from "@/lib/account";
import { ping } from "@/lib/realtime";

const CreateReply = z.object({
  post_id: z.string().min(1).max(64),
  author_id: z.string().min(1).max(80),
  text: z.string().max(1000),
});

export async function GET(request) {
  const postId = new URL(request.url).searchParams.get("post_id");
  if (!postId) {
    return Response.json({ error: "post_id is required." }, { status: 400 });
  }

  const db = supabaseAdmin();
  if (!db) return Response.json({ source: "seed", replies: null });

  const { data, error } = await db
    .from("replies")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) return Response.json({ source: "seed", replies: null });

  return Response.json({ source: "supabase", replies: await withRealAuthors(data) });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const parsed = CreateReply.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const who = await actAsAuthor(parsed.data.author_id);
  if (!who.ok) return denied(who);
  const text = parsed.data.text.trim();
  if (!text) {
    return Response.json({ error: "Reply text is required." }, { status: 400 });
  }

  const reply = {
    id: randomUUID(),
    post_id: parsed.data.post_id,
    author_id: parsed.data.author_id,
    text,
    is_demo: false,
    created_at: new Date().toISOString(),
  };

  const db = supabaseAdmin();
  const [shown] = await withRealAuthors([reply]);
  if (!db) return Response.json({ reply: shown, persisted: false });

  const { error } = await db.from("replies").insert(reply);
  if (!error) {
    const { data: post } = await db.from("posts").select("author_id").eq("id", reply.post_id).maybeSingle();
    if (post && post.author_id !== reply.author_id) await ping([post.author_id], "reply");
  }
  return Response.json({ reply: shown, persisted: !error });
}

const DeleteReply = z.object({
  id: z.string().min(1).max(64),
  author_id: z.string().min(1).max(80),
});

// Delete your own reply (only yours: the author must match).
export async function DELETE(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = DeleteReply.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });
  const { id, author_id } = parsed.data;
  const who = await actAsAuthor(author_id);
  if (!who.ok) return denied(who);
  const db = supabaseAdmin();
  if (!db) return Response.json({ ok: true, persisted: false });
  const { data, error } = await db.from("replies").delete().eq("id", id).eq("author_id", author_id).select("id");
  if (error) return Response.json({ error: "Could not delete the reply." }, { status: 500 });
  if (data.length === 0) return Response.json({ error: "You can only delete your own replies." }, { status: 403 });
  return Response.json({ ok: true, persisted: true });
}
