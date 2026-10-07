"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Everything about mentoring sits under one nav item ("Mentoring"): finding
// a mentor, and your Mentor hub (stats and membership for mentors, the way
// in for students who want to become one).
const TABS = [
  { href: "/mentors", label: "Find a mentor" },
  { href: "/mentor", label: "Mentor hub" },
];

// Nav items use this to light up on any mentoring page.
export const isMentoringPath = (pathname) =>
  pathname === "/mentors" || pathname.startsWith("/mentors/") || pathname === "/mentor" || pathname.startsWith("/mentor/");

export function MentoringTabs({ className }) {
  const pathname = usePathname();
  const current = pathname === "/mentor" || pathname.startsWith("/mentor/") ? "/mentor" : "/mentors";
  return (
    <nav aria-label="Mentoring" className={cn("-mx-4 -mt-3 mb-2 flex border-b", className)}>
      {/* Each tab takes an equal share of the bar, and the active one is underlined across its whole share. */}
      {TABS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={current === href ? "page" : undefined}
          className={cn(
            "relative flex flex-1 justify-center py-2.5 text-sm transition-colors hover:bg-muted/50 hover:text-foreground",
            current === href
              ? "font-semibold text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
              : "text-muted-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
