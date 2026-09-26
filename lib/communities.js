// Unit communities derived from seed data. No extra tables needed for the
// directory: a unit "exists" when posts mention it or a profile lists it.
// Joins and mentor sign-ups are the only stored state (unit_members table,
// with a localStorage fallback when Supabase is not configured).
import { PROFILES, POSTS } from "./seed.js";

// code -> { code, name, course, postCount, memberIds, mentorIds }
export function unitDirectory(posts = POSTS) {
  const units = new Map();

  const ensure = (code) => {
    if (!units.has(code)) {
      units.set(code, {
        code,
        name: null,
        course: null,
        postCount: 0,
        memberIds: new Set(),
        mentorIds: new Set(),
      });
    }
    return units.get(code);
  };

  // Profiles that list a unit give us its human name and course, and count
  // as members (they took it). Mentor-role profiles count as unit mentors.
  for (const profile of PROFILES) {
    for (const u of profile.units ?? []) {
      const unit = ensure(u.code);
      unit.name ??= u.name ?? null;
      unit.course ??= profile.course;
      unit.memberIds.add(profile.id);
      if (profile.role === "mentor") unit.mentorIds.add(profile.id);
    }
  }

  // Posters about a unit are members too.
  for (const post of posts) {
    for (const code of post.unit_codes ?? []) {
      const unit = ensure(code);
      unit.postCount += 1;
      unit.memberIds.add(post.author_id);
      const author = PROFILES.find((p) => p.id === post.author_id);
      if (author?.course && !unit.course) unit.course = author.course;
    }
  }

  return [...units.values()]
    .map((u) => ({
      ...u,
      memberIds: [...u.memberIds],
      mentorIds: [...u.mentorIds],
    }))
    .sort((a, b) => b.postCount - a.postCount || a.code.localeCompare(b.code));
}

export function unitsByCourse(posts = POSTS) {
  const groups = new Map();
  for (const unit of unitDirectory(posts)) {
    const course = unit.course ?? "General";
    if (!groups.has(course)) groups.set(course, []);
    groups.get(course).push(unit);
  }
  return [...groups.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])
  );
}

export function getUnit(code, posts = POSTS) {
  return unitDirectory(posts).find((u) => u.code === code) ?? null;
}

// localStorage shape: { [profileId]: { [unitCode]: "member" | "mentor" } }
const STORAGE_KEY = "sodu-memberships";

export function readLocalMemberships() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

export function writeLocalMembership(profileId, unitCode, role) {
  const all = readLocalMemberships();
  const mine = { ...(all[profileId] ?? {}) };
  if (role === null) delete mine[unitCode];
  else mine[unitCode] = role;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...all, [profileId]: mine })
  );
}
