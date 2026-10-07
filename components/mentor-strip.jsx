"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { unitDirectory } from "@/lib/communities";
import { SEED_MENTORS } from "@/lib/mentors";
import { usePersona } from "@/lib/persona-context";
import { getProfile, roleLabel } from "@/lib/seed";
import { useFollowing } from "@/lib/use-following";
import { cn } from "@/lib/utils";

// A mentor earns the "Top mentor" star by performance: enough sessions the
// students ended and rated, rated highly.
const isTop = (l) => (l.completed_sessions ?? 0) >= 3 && (l.ratings?.average ?? 0) >= 4.5;

// Stories-style row at the top of Home: one circle per mentor, people who
// mentor your units first (teal ring), then your course, then everyone else
// (plain ring). Within each group, the best-performing mentors come first
// (the API's order: completed, well-rated sessions, then helpful votes).
// Tapping opens their mentor page. Seeded listings until the API answers.
// People you follow come first (any role), each opening their profile.
export function MentorStrip() {
  const { persona } = usePersona();
  const following = useFollowing(persona.id);
  const [listings, setListings] = useState(SEED_MENTORS);
  // Desktop arrows instead of a scrollbar; each shows only when there's more
  // to scroll that way. Phones swipe.
  const rowRef = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const measure = () => {
    const el = rowRef.current;
    if (el) setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  };
  const scrollBy = (dir) => rowRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  useEffect(() => {
    let cancelled = false;
    fetch("/api/mentors")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.mentors?.length) setListings(data.mentors);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
    // Re-measure when the list changes.
  }, [listings, persona.id]);
  if (persona.role === "admin") return null;

  const myUnits = new Set(persona.units.map((u) => u.code));
  const courseOf = new Map(unitDirectory().map((u) => [u.code, u.course]));
  const rank = (l) =>
    myUnits.has(l.unit_code) ? 2 : courseOf.get(l.unit_code) === persona.course ? 1 : 0;

  const followed = following.ids
    .filter((id) => id !== persona.id)
    .map((id) => getProfile(id) ?? following.profileOf(id))
    .filter(Boolean);
  const seen = new Set(followed.map((p) => p.id));
  const mentors = [];
  // Array sort is stable, so the performance order survives inside each group.
  for (const listing of [...listings].sort((a, b) => rank(b) - rank(a))) {
    if (listing.profile_id === persona.id || seen.has(listing.profile_id)) continue;
    const profile = getProfile(listing.profile_id) ?? listing.profile;
    if (!profile) continue;
    seen.add(listing.profile_id);
    mentors.push({ listing, profile, inYourUnit: myUnits.has(listing.unit_code) });
  }
  if (mentors.length === 0 && followed.length === 0) return null;

  return (
    <section aria-label="Mentors for you" className="group/strip relative border-b py-3">
      {[
        ["left", -1, ChevronLeft, "left-1"],
        ["right", 1, ChevronRight, "right-1"],
      ].map(([side, dir, Icon, pos]) =>
        edges[side] ? (
          <button
            key={side}
            type="button"
            onClick={() => scrollBy(dir)}
            aria-label={side === "left" ? "Scroll mentors left" : "Scroll mentors right"}
            className={cn(
              "absolute top-1/2 z-10 hidden size-8 items-center justify-center rounded-full border bg-background/95 shadow-sm transition-opacity hover:bg-muted md:flex md:opacity-0 md:group-hover/strip:opacity-100 md:focus-visible:opacity-100",
              pos
            )}
          >
            <Icon className="size-4" />
          </button>
        ) : null
      )}
      <ul
        ref={rowRef}
        onScroll={measure}
        className="flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Each group has its own label and scrolls with it, so the mentors
            after the divider aren't mistaken for people you follow. */}
        {followed.length > 0 && (
          <li className="shrink-0">
            <p className="pb-2 text-xs font-semibold text-muted-foreground">Following</p>
            <ul className="flex gap-3">
              {followed.map((profile) => (
                <li key={`f-${profile.id}`} className="shrink-0">
                  <Link href={`/profile/${profile.id}`} className="group flex w-16 flex-col items-center gap-1 text-center">
                    <span className="rounded-full bg-gradient-to-tr from-amber-400 to-primary p-0.5 transition-transform duration-300 ease-out group-hover:scale-105">
                      <span className="block rounded-full bg-background p-0.5">
                        <UserAvatar profile={profile} className="size-12" textClassName="text-xs" />
                      </span>
                    </span>
                    <span className="w-full truncate text-xs font-medium">{profile.name.split(" ")[0]}</span>
                    <span className="text-[10px] text-muted-foreground">{roleLabel(profile.role)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        )}
        {followed.length > 0 && mentors.length > 0 && (
          <li aria-hidden className="my-2 w-px shrink-0 self-stretch bg-border" />
        )}
        {mentors.length > 0 && (
          <li className="shrink-0">
            <p className="pb-2 text-xs font-semibold text-muted-foreground">
              {mentors[0].inYourUnit ? "Mentors in your units" : "Mentors for you"}
            </p>
            <ul className="flex gap-3">
              {mentors.map(({ listing, profile, inYourUnit }) => (
                <li key={profile.id} className="shrink-0">
                  <Link
                    href={`/mentors/${listing.unit_code}/${profile.id}`}
                    title={
                      listing.completed_sessions
                        ? `${listing.completed_sessions} completed session${listing.completed_sessions === 1 ? "" : "s"}${listing.ratings ? ` · ${listing.ratings.average}★` : ""}`
                        : undefined
                    }
                    className="group relative flex w-16 flex-col items-center gap-1 text-center"
                  >
                    {isTop(listing) && (
                      <span
                        aria-label="Top mentor"
                        className="absolute top-0 right-0 z-[1] flex size-5 items-center justify-center rounded-full bg-amber-400 text-white ring-2 ring-background"
                      >
                        <Star className="size-3 fill-current" />
                      </span>
                    )}
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
          </li>
        )}
      </ul>
    </section>
  );
}
