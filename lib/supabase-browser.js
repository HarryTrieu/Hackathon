"use client";

let client = null;

// Browser Supabase client, used only for Google sign-in and live updates. It
// keeps the session in cookies so the server routes can see who is signed
// in. The anon key is public by design; all data still goes through the
// server routes. Resolves to null when Supabase is not configured.
//
// The library (about 70 KB compressed) is loaded with a dynamic import, so
// it downloads after the page shows instead of delaying every page on phones.
export function browserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Promise.resolve(null);
  client ??= import("@supabase/ssr").then(({ createBrowserClient }) => createBrowserClient(url, key));
  return client;
}
