"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { BookOpen, HeartHandshake, MessageSquarePlus, Route, Sparkles, Users, X } from "lucide-react";
import { AuthButton } from "@/components/auth-button";
import { usePersona } from "@/lib/persona-context";

// Small per-browser "don't show this again" flags.
const listeners = new Set();
const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
function read(store, key) {
  try {
    return window[store].getItem(key) === "1";
  } catch {
    return false;
  }
}
function hide(store, key) {
  try {
    window[store].setItem(key, "1");
  } catch {
    // Not remembered: it just shows again next time.
  }
  for (const cb of listeners) cb();
}
const useHidden = (store, key) => useSyncExternalStore(subscribe, () => read(store, key), () => true);

// Signed out: say plainly that this is a demo student, and how to get a real
// account. Hidden for this tab once dismissed.
export function DemoBanner() {
  const { account, persona } = usePersona();
  const hidden = useHidden("sessionStorage", "sodu.demoBanner.hidden");
  if (account.status !== "demo" || hidden) return null;
  return (
    <div className="flex items-start gap-3 border-b bg-primary/[0.06] px-4 py-3 text-sm">
      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1 space-y-2">
        <p>
          You&apos;re exploring as <b>{persona.name}</b>, a demo student. Switch demo students from your picture, or
          sign in with Google to make your own account.
        </p>
        <AuthButton className="w-fit" />
      </div>
      <button
        type="button"
        onClick={() => hide("sessionStorage", "sodu.demoBanner.hidden")}
        aria-label="Hide this message"
        className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

// A new account's first steps, until dismissed.
export function GettingStarted() {
  const { persona, realActive } = usePersona();
  const key = `sodu.gettingStarted.${persona.id}`;
  const hidden = useHidden("localStorage", key);
  if (!realActive || hidden) return null;
  const firstUnit = persona.units?.[0]?.code;
  const steps = [
    { icon: Users, text: "Join your unit communities", href: "/communities" },
    { icon: HeartHandshake, text: "Find a mentor who aced your unit (try their AI preview first)", href: "/mentors" },
    {
      icon: Route,
      text: firstUnit ? `Build your ${firstUnit} study plan` : "Build a study plan for a unit",
      href: firstUnit ? `/unit/${firstUnit}/plan` : "/communities",
    },
    { icon: MessageSquarePlus, text: "Ask a question or share a tip with the + button", href: null },
  ];
  return (
    <div className="border-b px-4 py-4">
      <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-4">
        <div className="flex items-start gap-2">
          <BookOpen className="mt-0.5 size-4 text-primary" />
          <p className="flex-1 font-semibold">Welcome, {persona.name.split(" ")[0]}! Four ways to start:</p>
          <button
            type="button"
            onClick={() => hide("localStorage", key)}
            aria-label="Hide getting started"
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <ol className="mt-2 space-y-1.5 text-sm">
          {steps.map(({ icon: Icon, text, href }, i) => (
            <li key={text}>
              {href ? (
                <Link href={href} className="flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-primary/5 hover:text-primary">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <Icon className="size-4 text-primary" />
                  {text}
                </Link>
              ) : (
                <span className="flex items-center gap-2 px-1 py-1">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <Icon className="size-4 text-primary" />
                  {text}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
