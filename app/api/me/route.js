// Who is signed in with Google, as the server sees it, and their Sodu
// profile. GET: { user: null } when signed out (the app then runs as a demo
// persona). POST: create or update your own profile from /welcome.
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { findProfile, handleFor, profileIdFor } from "@/lib/account";
import { supabaseAdmin } from "@/lib/supabase";
import { unitDirectory } from "@/lib/communities";
import { COURSES, GOALS, MAX_GOALS, MAX_UNITS, YEARS } from "@/lib/onboarding";

const NO_STORE = { "Cache-Control": "private, no-store" };

function publicUser(user) {
  return {
    id: user.id,
    email: user.email ?? null,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    avatar: user.user_metadata?.avatar_url ?? null,
  };
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return Response.json({ user: null, profile: null }, { headers: NO_STORE });
  const { profile = null, error = null } = await findProfile(user.id);
  return Response.json({ user: publicUser(user), profile, error }, { headers: NO_STORE });
}

const Setup = z.object({
  name: z.string().trim().min(2, "Add your name.").max(60),
  course: z.enum(COURSES, { message: "Pick your course." }),
  year: z.number().int().refine((y) => YEARS.includes(y), "Pick your year."),
  units: z.array(z.string().regex(/^[A-Z]{3}\d{3}$/)).max(MAX_UNITS, `Up to ${MAX_UNITS} units.`),
  goals: z.array(z.enum(GOALS)).max(MAX_GOALS, `Up to ${MAX_GOALS} goals.`),
});

export async function POST(request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Sign in with Google first." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = Setup.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  }
  const { name, course, year, goals } = parsed.data;

  // Only units Sodu knows, stored the same way seeded profiles store them.
  const names = new Map(unitDirectory().map((u) => [u.code, u.name]));
  const units = [...new Set(parsed.data.units)]
    .filter((code) => names.has(code))
    .map((code) => ({ code, name: names.get(code), tip: null }));

  const db = supabaseAdmin();
  if (!db) return Response.json({ error: "Accounts need the database, which isn't set up here." }, { status: 503 });

  const existing = await findProfile(user.id);
  if (existing.error === "migration-missing") {
    return Response.json(
      { error: "The database needs the google-login update before accounts can be saved." },
      { status: 503 }
    );
  }
  if (existing.error) return Response.json({ error: "Could not reach the database." }, { status: 500 });

  const fields = { name, course, year, units, goals: [...new Set(goals)] };
  const { error } = existing.profile
    ? // Updating keeps role, verified and everything else as it was.
      await db.from("profiles").update(fields).eq("id", existing.profile.id)
    : await db.from("profiles").insert({
        ...fields,
        id: profileIdFor(user.id),
        auth_user_id: user.id,
        handle: handleFor(name, user.id),
        role: "mentee",
        verified: false,
        skills: [],
        resources: [],
        avatar_url: user.user_metadata?.avatar_url ?? null,
        is_demo: false,
      });
  if (error) return Response.json({ error: "Could not save your profile." }, { status: 500 });

  const saved = await findProfile(user.id);
  return Response.json({ user: publicUser(user), profile: saved.profile ?? null }, { headers: NO_STORE });
}
