"use client";

import { Fragment, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp, ShieldCheck, UserPlus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_CHATS_PER_DAY } from "@/lib/mentors";
import styles from "./home-hero.module.css";

const STEPS = [
  { n: "1", title: "Describe", text: "Tell the AI the mentor you want" },
  { n: "2", title: "Preview chat", text: `Talk to their AI, ${MAX_CHATS_PER_DAY} messages a day` },
  { n: "3", title: "Contact", text: "Request a paid session if it fits" },
];

// Animation delay per position: step, arrow, step, arrow, step.
const DELAY = [styles.d0, styles.d1, styles.d2, styles.d3, styles.d4];

// Folded or not, remembered in this browser (it's only a preference, so a
// blocked or cleared storage just shows the banner open).
const KEY = "sodu.heroFolded";
const listeners = new Set();
function readFolded() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
function setFolded(value) {
  try {
    if (value) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the change still applies until the page reloads.
  }
  memory = value;
  for (const cb of listeners) cb();
}
let memory = null;
function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
const useFolded = () => useSyncExternalStore(subscribe, () => memory ?? readFolded(), () => false);

export function HomeHero() {
  const folded = useFolded();

  if (folded) {
    return (
      <section className="flex items-center gap-2 border-b px-4 py-2 text-sm">
        <Link href="/mentors" className="min-w-0 flex-1 truncate font-medium hover:text-primary">
          Find a Deakin peer who already passed your unit
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 rounded-full text-muted-foreground"
          onClick={() => setFolded(false)}
          aria-expanded="false"
        >
          Show
          <ChevronDown data-icon="inline-end" />
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-3 border-b px-4 py-4 sm:space-y-4 sm:py-5">
      <div className="flex items-start gap-2">
        <p className="flex-1 text-base font-bold leading-snug sm:text-lg">
          Find a Deakin peer who already passed your unit, try their AI first, then book the real person.
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          className="-mr-2 -mt-1 shrink-0 rounded-full text-muted-foreground"
          onClick={() => setFolded(true)}
          aria-label="Fold this banner"
          aria-expanded="true"
          title="Fold"
        >
          <ChevronUp />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/mentors" className={cn(buttonVariants(), "rounded-full", styles.cta)}>
          Find a mentor
          <ArrowRight data-icon="inline-end" />
        </Link>
        <Link href="/mentor/apply" className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>
          <UserPlus data-icon="inline-start" />
          Become a mentor
        </Link>
      </div>
      {/* Phones: one row of compact steps without the subtitles. */}
      <ol className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <Fragment key={s.n}>
            {i > 0 && (
              <li
                aria-hidden="true"
                className={cn("flex shrink-0 justify-center", styles.arrow, DELAY[i * 2 - 1])}
              >
                <ArrowRight className="size-3.5 sm:size-4" />
              </li>
            )}
            <li
              className={cn(
                "flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border bg-background/70 p-1.5 text-xs sm:items-start sm:gap-2 sm:p-2.5 sm:text-sm",
                styles.step,
                DELAY[i * 2]
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground sm:size-6 sm:text-xs",
                  styles.badge,
                  DELAY[i * 2]
                )}
              >
                {s.n}
              </span>
              <span className="min-w-0">
                <span className="font-semibold">{s.title}</span>
                <span className="hidden text-xs text-muted-foreground sm:block">{s.text}</span>
              </span>
            </li>
          </Fragment>
        ))}
      </ol>
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-primary" />
        <span className="sm:hidden">Deakin only. Never your address, transcript or exact grade.</span>
        <span className="hidden sm:inline">
          Deakin only for now. We keep the posts you write and a verified-email flag. Never your address or
          transcript, and your exact grade never appears on your profile.
        </span>
      </p>
    </section>
  );
}
