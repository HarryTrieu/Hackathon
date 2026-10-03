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
    links: row.links ?? [],
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

// Real (Google) account profiles by id, for showing who wrote a post or
// reply. Seeded ids are skipped: the client already knows those.
export async function realProfiles(ids) {
  const wanted = [...new Set(ids)].filter((id) => typeof id === "string" && id.startsWith("u-"));
  const db = supabaseAdmin();
  if (!db || wanted.length === 0) return new Map();
  const { data, error } = await db.from("profiles").select("*").in("id", wanted);
  if (error || !data) return new Map();
  return new Map(data.map((row) => [row.id, toProfile(row)]));
}

// Adds `author` to items written by real accounts (posts, replies).
export async function withRealAuthors(items) {
  const authors = await realProfiles(items.map((item) => item.author_id));
  return items.map((item) => (authors.has(item.author_id) ? { ...item, author: authors.get(item.author_id) } : item));
}

// A handle from the person's name, e.g. "Huy Le" -> "huyle4f2a".
export function handleFor(name, authUserId) {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14) || "student";
  return `${base}${authUserId.replaceAll("-", "").slice(0, 4)}`;
}
