// Unit communities, scoped to Deakin University for launch. The catalog
// seeds the directory; any other Deakin-format code (SIT221) mentioned in a
// post also gets a community. Codes from other unis are ignored.
// Joins and mentor sign-ups are the only stored state (unit_members table,
// with a localStorage fallback when Supabase is not configured).
import { PROFILES, POSTS } from "./seed.js";

export const UNIVERSITY = "Deakin University";

const DEAKIN_CODE = /^[A-Z]{3}\d{3}$/;

// Official titles from the Deakin handbook.
const CATALOG = [
  { code: "SIT102", name: "Introduction to Programming", course: "CS" },
  { code: "SIT111", name: "Computer Systems", course: "IT" },
  { code: "SIT103", name: "Database Fundamentals", course: "Data Science" },
  { code: "SIT120", name: "Introduction to Responsive Web Apps", course: "IT" },
  { code: "SIT191", name: "Introduction to Statistics and Data Analysis", course: "Data Science" },
  { code: "SIT202", name: "Computer Networks and Communication", course: "IT" },
  { code: "SIT215", name: "Computational Intelligence", course: "CS" },
  { code: "SIT232", name: "Object-Oriented Development", course: "CS" },
  { code: "MAA103", name: "Accounting for Decision Making", course: "Business" },
  { code: "MIS171", name: "Business Analytics", course: "Business" },
  { code: "MMK101", name: "Marketing Fundamentals", course: "Business" },
  { code: "ADD105", name: "Design Fundamentals", course: "Design" },
  { code: "ADT202", name: "Web and Interface Design", course: "Design" },
];

// code -> { code, name, course, postCount, memberIds, mentorIds }
export function unitDirectory(posts = POSTS) {
  const units = new Map();

  const ensure = (code) => {
    if (!units.has(code)) {
      const known = CATALOG.find((u) => u.code === code);
      units.set(code, {
        code,
        name: known?.name ?? null,
        course: known?.course ?? null,
        postCount: 0,
        memberIds: new Set(),
        mentorIds: new Set(),
      });
    }
    return units.get(code);
  };

  for (const { code } of CATALOG) ensure(code);

  // Profiles that list a unit took it, so they count as members.
  // Mentor-role profiles count as unit mentors.
  for (const profile of PROFILES) {
    for (const u of profile.units ?? []) {
      if (!DEAKIN_CODE.test(u.code)) continue;
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
      if (!DEAKIN_CODE.test(code)) continue;
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
