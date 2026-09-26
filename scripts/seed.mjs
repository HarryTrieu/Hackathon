// Pushes the labelled demo data into Supabase. Run after schema.sql:
//   node --env-file=.env.local scripts/seed.mjs
// Idempotent: upserts by id, safe to re-run.

import { createClient } from "@supabase/supabase-js";
import { PROFILES, POSTS } from "../lib/seed.js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with: node --env-file=.env.local scripts/seed.mjs"
  );
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

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

const { error: pErr } = await db.from("profiles").upsert(profileRows);
if (pErr) {
  console.error("profiles upsert failed:", pErr.message);
  process.exit(1);
}
console.log(`profiles: ${profileRows.length} upserted`);

const { error: postErr } = await db.from("posts").upsert(postRows);
if (postErr) {
  console.error("posts upsert failed:", postErr.message);
  process.exit(1);
}
console.log(`posts: ${postRows.length} upserted`);
console.log("Seed complete.");
