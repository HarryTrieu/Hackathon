"use client";

import { createBrowserClient } from "@supabase/ssr";

let client = null;

// Browser Supabase client, used only for Google sign-in. It keeps the session
// in cookies so the server routes can see who is signed in. The anon key is
// public by design; all data still goes through the server routes.
// Returns null when Supabase is not configured.
export function browserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createBrowserClient(url, key);
  return client;
}
