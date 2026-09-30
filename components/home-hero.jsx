import { Fragment } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ShieldCheck, UserPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import styles from "./home-hero.module.css";

const STEPS = [
  { n: "1", title: "Describe", text: "Tell the AI the mentor you want" },
  { n: "2", title: "Preview chat", text: "Talk to their AI, 5 messages a day" },
  { n: "3", title: "Contact", text: "Request a paid session if it fits" },
];

// Animation delay per position: step, arrow, step, arrow, step.
const DELAY = [styles.d0, styles.d1, styles.d2, styles.d3, styles.d4];

export function HomeHero() {
  return (
    <section className="space-y-4 border-b bg-gradient-to-br from-primary/[0.07] via-transparent to-transparent px-4 py-5">
      <p className="text-lg font-bold leading-snug">
        Find a Deakin peer who already passed your unit, try their AI first, then book the real person.
      </p>
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
      <ol className="flex flex-col gap-1 sm:flex-row sm:items-center">
        {STEPS.map((s, i) => (
          <Fragment key={s.n}>
            {i > 0 && (
              <li
                aria-hidden="true"
                className={cn("flex shrink-0 justify-center", styles.arrow, DELAY[i * 2 - 1])}
              >
                <ArrowRight className="hidden size-4 sm:block" />
                <ArrowDown className="size-4 sm:hidden" />
              </li>
            )}
            <li
              className={cn(
                "flex min-w-0 flex-1 gap-2 rounded-xl border bg-background/70 p-2.5 text-sm",
                styles.step,
                DELAY[i * 2]
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground",
                  styles.badge,
                  DELAY[i * 2]
                )}
              >
                {s.n}
              </span>
              <span>
                <span className="font-semibold">{s.title}</span>
                <span className="block text-xs text-muted-foreground">{s.text}</span>
              </span>
            </li>
          </Fragment>
        ))}
      </ol>
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-primary" />
        <span>
          Deakin only for now. We keep the posts you write and a verified-email flag. Never your address or
          transcript, and your exact grade never appears on your profile.
        </span>
      </p>
    </section>
  );
}
