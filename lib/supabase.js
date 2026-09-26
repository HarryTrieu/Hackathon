// Server-only Supabase client. Never import this from a "use client" file.
import { createClient } from "@supabase/supabase-js";

let cached = null;

// Returns null when env is missing so callers can fall back to seed data.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cached ??= createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
