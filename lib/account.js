// Server-only: the Sodu profile that belongs to a signed-in Google user.
import { supabaseAdmin } from "./supabase.js";

// Real accounts get ids that can never clash with seeded ones (p1, p2...).
export const profileIdFor = (authUserId) => `u-${authUserId}`;

// A profiles row in the same shape the app uses for seeded profiles.
export function toProfile(row) {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    role: row.role,
    course: row.course,
    year: row.year,
    verified: row.verified,
    skills: row.skills ?? [],
    goals: row.goals ?? [],
    outcome: row.outcome ?? null,
    units: row.units ?? [],
    resources: row.resources ?? [],
    avatar: row.avatar_url ?? null,
    // Real moderators (set by hand in the database, profiles.is_moderator).
    moderator: row.is_moderator === true,
    is_demo: false,
  };
}

// { profile } for this user, { profile: null } when they haven't set up yet,
// or { error } when the database (or the google-login migration) is missing.
export async function findProfile(authUserId) {
  const db = supabaseAdmin();
  if (!db) return { error: "no-database" };
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error) return { error: error.code === "42703" ? "migration-missing" : "database-error" };
  return { profile: data ? toProfile(data) : null };
}

// A handle from the person's name, e.g. "Huy Le" -> "huyle4f2a".
export function handleFor(name, authUserId) {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14) || "student";
  return `${base}${authUserId.replaceAll("-", "").slice(0, 4)}`;
}
