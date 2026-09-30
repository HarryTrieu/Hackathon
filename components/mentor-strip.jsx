"use client";

import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import { unitDirectory } from "@/lib/communities";
import { SEED_MENTORS } from "@/lib/mentors";
import { usePersona } from "@/lib/persona-context";
import { getProfile } from "@/lib/seed";
import { cn } from "@/lib/utils";

// Stories-style row at the top of Home: one circle per mentor, people who
// mentor your units first (teal ring), then your course, then everyone else
// (plain ring). Tapping opens their mentor page. Seeded listings only.
export function MentorStrip() {
  const { persona } = usePersona();
  if (persona.role === "admin") return null;

  const myUnits = new Set(persona.units.map((u) => u.code));
  const courseOf = new Map(unitDirectory().map((u) => [u.code, u.course]));
  const rank = (l) =>
    myUnits.has(l.unit_code) ? 2 : courseOf.get(l.unit_code) === persona.course ? 1 : 0;

  const seen = new Set();
  const mentors = [];
  for (const listing of [...SEED_MENTORS].sort((a, b) => rank(b) - rank(a))) {
    if (listing.profile_id === persona.id || seen.has(listing.profile_id)) continue;
    const profile = getProfile(listing.profile_id);
    if (!profile) continue;
    seen.add(listing.profile_id);
    mentors.push({ listing, profile, inYourUnit: myUnits.has(listing.unit_code) });
  }
  if (mentors.length === 0) return null;

  return (
    <section aria-label="Mentors for you" className="border-b py-3">
      <p className="px-4 pb-2 text-xs font-semibold text-muted-foreground">
        {mentors[0].inYourUnit ? "Mentors in your units" : "Mentors for you"}
      </p>
      <ul className="flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:thin]">
        {mentors.map(({ listing, profile, inYourUnit }) => (
          <li key={profile.id} className="shrink-0">
            <Link
              href={`/mentors/${listing.unit_code}/${profile.id}`}
              className="group flex w-16 flex-col items-center gap-1 text-center"
            >
              <span
                className={cn(
                  "rounded-full p-0.5 transition-transform duration-300 ease-out group-hover:scale-105",
                  inYourUnit ? "bg-gradient-to-tr from-primary to-sky-400" : "bg-border"
                )}
              >
                <span className="block rounded-full bg-background p-0.5">
                  <UserAvatar profile={profile} className="size-12" textClassName="text-xs" />
                </span>
              </span>
              <span className="w-full truncate text-xs font-medium">{profile.name.split(" ")[0]}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{listing.unit_code}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
