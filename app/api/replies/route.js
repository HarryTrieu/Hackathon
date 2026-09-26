// Flat replies on posts. GET lists by post, POST creates.
// Without Supabase: GET returns replies:null (client falls back to seed),
// POST returns the reply unpersisted so the UI can keep it for the session.
import { randomUUID } from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { PROFILES } from "@/lib/seed";

const PROFILE_IDS = new Set(PROFILES.map((p) => p.id));

const CreateReply = z.object({
  post_id: z.string().min(1).max(64),
  author_id: z.string().refine((id) => PROFILE_IDS.has(id), "Unknown author."),
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

  return Response.json({ source: "supabase", replies: data });
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
  if (!db) return Response.json({ reply, persisted: false });

  const { error } = await db.from("replies").insert(reply);
  return Response.json({ reply, persisted: !error });
}
