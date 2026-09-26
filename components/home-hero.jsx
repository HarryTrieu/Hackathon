import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles, UserPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: "1", title: "Describe", text: "Tell the AI the mentor you want" },
  { n: "2", title: "Preview chat", text: "Talk to their AI, 5 messages a day" },
  { n: "3", title: "Contact", text: "Request a paid session if it fits" },
];

export function HomeHero() {
  return (
    <section className="space-y-4 border-b bg-gradient-to-br from-primary/[0.07] via-transparent to-transparent px-4 py-5">
      <p className="text-lg font-bold leading-snug">
        Find a Deakin peer who already passed your unit, try their AI first, then book the real person.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/mentors" className={cn(buttonVariants(), "rounded-full")}>
          Find a mentor
          <ArrowRight data-icon="inline-end" />
        </Link>
        <Link href="/mentor/apply" className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>
          <UserPlus data-icon="inline-start" />
          Become a mentor
        </Link>
      </div>
      <ol className="grid gap-2 sm:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-2 rounded-xl border bg-background/70 p-2.5 text-sm">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {s.n}
            </span>
            <span>
              <span className="font-semibold">{s.title}</span>
              <span className="block text-xs text-muted-foreground">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="size-3.5 text-primary" />
        <MessageCircle className="size-3.5" />
        Deakin only for now. Pick a unit on Find a mentor. How we use your data: we store posts you write
        and a verified-email flag, never your address, transcript or exact grade on your public profile.
      </p>
    </section>
  );
}
