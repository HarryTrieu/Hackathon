import { PROFILES, POSTS, REPLIES } from "./seed.js";

export async function pushSeed(db) {
  const profileRows = PROFILES.map((p) => ({
    id: p.id,
    name: p.name,
    handle: p.handle,
    role: p.role,
    course: p.course,
    year: p.year,
    verified: p.verified,
    skills: p.skills,
    goals: p.goals,
    outcome: p.outcome,
    units: p.units,
    resources: p.resources,
    is_demo: true,
  }));
  const postRows = POSTS.map((p) => ({
    id: p.id,
    author_id: p.author_id,
    lang: p.lang,
    text: p.text,
    tldr: p.tldr,
    summary_en: p.summary_en,
    tags: p.tags,
    unit_codes: p.unit_codes,
    topic: p.topic,
    helpful_count: p.helpful_count,
    image_url: p.image_url ?? null,
    link_preview: p.link_preview ?? null,
    flag_reason: p.flag_reason,
    status: "visible",
    is_demo: true,
    mocked: false,
    created_at: new Date(Date.now() - p.hours_ago * 3600_000).toISOString(),
  }));
  const replyRows = REPLIES.map((r) => ({
    id: r.id,
    post_id: r.post_id,
    author_id: r.author_id,
    text: r.text,
    is_demo: true,
    created_at: new Date(Date.now() - r.hours_ago * 3600_000).toISOString(),
  }));

  const { error: pErr } = await db.from("profiles").upsert(profileRows);
  if (pErr) return { ok: false, error: pErr.message };
  const { error: postErr } = await db.from("posts").upsert(postRows);
  if (postErr) return { ok: false, error: postErr.message };
  const { error: rErr } = await db.from("replies").upsert(replyRows);
  if (rErr) return { ok: false, error: rErr.message };
  return { ok: true, profiles: profileRows.length, posts: postRows.length, replies: replyRows.length };
}
