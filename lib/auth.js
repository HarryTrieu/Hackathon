// Server-only: who is signed in with Google on this request.
// Never import this from a "use client" file.
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// A Supabase client bound to this request's auth cookies. Create a new one
// per request (the library requires it). null when Supabase is not set up.
export async function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server Components can't set cookies; route handlers can.
        }
      },
    },
  });
}

// The signed-in Google user, checked with Supabase (not just read from the
// cookie), or null when nobody is signed in.
export async function getAuthUser() {
  const supabase = await authClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  return error ? null : (data.user ?? null);
}
