// Google sends the user back here (via Supabase) with a one-time code. Swap it
// for a session cookie, then return to the page they started from.
import { NextResponse } from "next/server";
import { authClient } from "@/lib/auth";
import { findProfile } from "@/lib/account";

const NO_STORE = { "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0" };

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  // Only same-site paths, so the link can't bounce users to another site.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await authClient();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // First sign-in: go straight to the one-screen setup, then back.
        const { profile } = await findProfile(data.user.id);
        const dest = profile ? safeNext : `/welcome?next=${encodeURIComponent(safeNext)}`;
        return NextResponse.redirect(`${origin}${dest}`, { headers: NO_STORE });
      }
    }
  }
  return NextResponse.redirect(`${origin}/?signin=failed`, { headers: NO_STORE });
}
