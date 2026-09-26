import { randomUUID } from "node:crypto";
import { z } from "zod";
import { enrichPost } from "@/lib/enrich";
import { supabaseAdmin } from "@/lib/supabase";
import { PROFILES } from "@/lib/seed";

const PROFILE_IDS = PROFILES.map((p) => p.id);

const CreatePost = z.object({
  author_id: z.string().refine((id) => PROFILE_IDS.includes(id), {
    message: "Unknown author.",
  }),
  text: z.string().trim().min(1, "Post text is required.").max(2000),
  image_url: z.string().max(500).optional(),
  link_preview: z
    .object({
      url: z.string().url(),
      title: z.string().max(300),
      site: z.string().max(120),
      description: z.string().max(500).nullable(),
      image: z.string().max(500).nullable(),
    })
    .optional(),
});

function withHoursAgo(row) {
  return {
    ...row,
    hours_ago: Math.max(
      0,
      (Date.now() - new Date(row.created_at).getTime()) / 3600_000
    ),
  };
}

// Feed data. { source: "supabase", posts } when the DB answers,
// { source: "seed", posts: null } when the client should use local seed data.
export async function GET() {
  const db = supabaseAdmin();
  if (!db) return Response.json({ source: "seed", posts: null });

  const { data, error } = await db
    .from("posts")
    .select("*")
    .neq("status", "removed")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return Response.json({ source: "seed", posts: null });
  return Response.json({ source: "supabase", posts: data.map(withHoursAgo) });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const parsed = CreatePost.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid post." },
      { status: 400 }
    );
  }

  const { author_id, text, image_url, link_preview } = parsed.data;
  const ai = await enrichPost(text);

  const post = {
    id: randomUUID(),
    author_id,
    lang: ai.lang,
    text,
    tldr: ai.tldr,
    summary_en: ai.summary_en,
    tags: ai.tags,
    unit_codes: ai.unit_codes,
    topic: ai.topic,
    helpful_count: 0,
    image_url: image_url ?? null,
    link_preview: link_preview ?? null,
    flag_reason: ai.flag_reason,
    status: "visible",
    is_demo: false,
    mocked: ai.mocked,
    created_at: new Date().toISOString(),
  };

  let persisted = false;
  const db = supabaseAdmin();
  if (db) {
    const { error } = await db.from("posts").insert(post);
    persisted = !error;
  }

  // Even unpersisted posts return 200: the feed shows them for this session
  // and the composer tells the user which mode they are in.
  return Response.json({
    post: withHoursAgo(post),
    mocked: ai.mocked,
    persisted,
  });
}
