// Pushes the labelled demo data into Supabase. Run after schema.sql:
//   node --env-file=.env.local scripts/seed.mjs
import { createClient } from "@supabase/supabase-js";
import { pushSeed } from "../lib/push-seed.js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with: node --env-file=.env.local scripts/seed.mjs"
  );
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const result = await pushSeed(db);
if (!result.ok) {
  console.error("seed failed:", result.error);
  process.exit(1);
}
console.log(`profiles: ${result.profiles} upserted`);
console.log(`posts: ${result.posts} upserted`);
console.log(`replies: ${result.replies} upserted`);
console.log("Seed complete.");
