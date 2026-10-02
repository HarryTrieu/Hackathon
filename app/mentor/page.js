"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Bot, CalendarCheck, Flame, GraduationCap, MessageSquare, ShieldCheck, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { PostCard } from "@/components/post-card";
import { authorOf } from "@/lib/authors";
import { GUARANTEE_DAYS, formatDay } from "@/lib/membership";
import { usePersona } from "@/lib/persona-context";
import { POSTS } from "@/lib/seed";
import { cn } from "@/lib/utils";

const STATUS = {
  pending: { label: "Waiting for review", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Not approved", variant: "destructive" },
};

function Section({ title, hint, children }) {
  return (
    <section className="space-y-3 border-b px-4 py-5">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

// What the fee pays for, shown before you join.
const BENEFITS = [
  { icon: Users, text: "Listed in Find a mentor and suggested by the AI matcher" },
  { icon: MessageSquare, text: "Questions from students in your units, gathered for you" },
  { icon: Flame, text: "Demand in your units, so you know when to open more time" },
  { icon: Bot, text: "Your AI preview answers students 24/7 in your voice" },
  { icon: GraduationCap, text: "A verified record of your sessions and ratings for your CV" },
];

function MembershipCard({ data, meId, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const m = data.membership;

  async function act(action) {
    if (action === "claim_refund" && !window.confirm(`Claim your ${data.price} back? Your listing comes down.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/mentor-hub", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile_id: meId, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error ?? "Something went wrong.");
      else onChanged();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (m.included) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.05] p-3 text-sm">
        <BadgeCheck className="size-4 shrink-0 text-primary" />
        Demo mentor: membership is included, so you&apos;re always listed.
      </p>
    );
  }
  if (!m.ready) {
    return (
      <p className="rounded-xl border p-3 text-sm text-muted-foreground">
        Memberships aren&apos;t switched on yet (the database needs the session-journey update).
      </p>
    );
  }

  if (m.active) {
    const g = m.membership;
    return (
      <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/[0.04] p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold">
          <BadgeCheck className="size-4 text-primary" />
          Member until {formatDay(g.ends_at)}
        </p>
        <p className="flex items-start gap-2 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          {m.guarantee === "met" &&
            `Money-back guarantee met: ${m.requests_in_window} session request${m.requests_in_window === 1 ? "" : "s"} in your first ${GUARANTEE_DAYS} days.`}
          {m.guarantee === "open" &&
            `Money-back guarantee: if no student requests a session by ${formatDay(g.guarantee_until)}, you get your ${data.price} back.`}
          {m.guarantee === "claimable" &&
            `No student requested a session in your first ${GUARANTEE_DAYS} days, so you can have your ${data.price} back.`}
        </p>
        {m.guarantee === "claimable" && (
          <Button size="sm" variant="outline" className="rounded-full" disabled={busy} onClick={() => act("claim_refund")}>
            Claim {data.price} back
          </Button>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border p-4 text-sm">
      <p className="font-semibold">
        Mentor membership · {data.price} per trimester
        <span className="font-normal text-muted-foreground"> (4 months)</span>
      </p>
      {m.membership?.refunded_at && (
        <p className="text-muted-foreground">Refunded on {formatDay(m.membership.refunded_at)}. You can join again any time.</p>
      )}
      {m.membership && !m.membership.refunded_at && (
        <p className="text-muted-foreground">Your last membership ended on {formatDay(m.membership.ends_at)}.</p>
      )}
      <ul className="space-y-1.5">
        {BENEFITS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-2">
            <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
            {text}
          </li>
        ))}
      </ul>
      <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-2.5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        Money-back guarantee: if no student requests a session in your first {GUARANTEE_DAYS} days, you get the full{" "}
        {data.price} back.
      </p>
      <p className="text-muted-foreground">
        You set your own price and keep everything students pay you. Your listing goes live once a moderator approves
        it and your membership is active.
      </p>
      <Button className="rounded-full" disabled={busy} onClick={() => act("pay")}>
        Pay {data.price} (demo, no card charged)
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="size-3.5" />
      <span className="font-semibold text-foreground">{value}</span> {label}
    </span>
  );
}

function Listings({ listings, active }) {
  return (
    <ul className="space-y-2">
      {listings.map((l) => (
        <li key={l.id} className="space-y-2 rounded-xl border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold">{l.unit_code}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{l.unit_name}</span>
            <Badge variant={STATUS[l.status]?.variant ?? "secondary"}>{STATUS[l.status]?.label ?? l.status}</Badge>
          </div>
          <p className="text-sm">
            {l.listed ? (
              <Link href={`/mentors/${l.unit_code}/${l.profile_id}`} className="text-primary hover:underline">
                Live in Find a mentor
              </Link>
            ) : l.status === "approved" && !active ? (
              <span className="text-muted-foreground">Approved. Start your membership to go live.</span>
            ) : (
              <span className="text-muted-foreground">Not listed yet.</span>
            )}
            {l.rate_per_hour ? <span className="text-muted-foreground"> · A${l.rate_per_hour}/hour</span> : null}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Stat icon={Bot} label={l.preview_chats === 1 ? "student tried your AI" : "students tried your AI"} value={l.preview_chats} />
            <Stat icon={MessageSquare} label="session requests" value={l.requests} />
            <Stat icon={CalendarCheck} label="accepted" value={l.accepted} />
            {l.ratings && <Stat icon={Star} label={`rating (${l.ratings.count})`} value={l.ratings.average.toFixed(1)} />}
          </div>
        </li>
      ))}
    </ul>
  );
}

// Students per mentor is the simplest "is it worth opening more time?" signal.
function Demand({ demand }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {demand.map((d) => {
        const asking = d.questions + d.students;
        const perMentor = asking / Math.max(1, d.mentors);
        const level = perMentor >= 6 ? "High" : perMentor >= 2 ? "Medium" : "Low";
        return (
          <li key={d.unit_code} className="space-y-1.5 rounded-xl border p-3 text-sm">
            <p className="flex items-center justify-between gap-2">
              <span className="font-mono font-semibold">{d.unit_code}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  level === "High" && "bg-primary text-primary-foreground",
                  level === "Medium" && "bg-primary/15 text-primary",
                  level === "Low" && "bg-muted text-muted-foreground"
                )}
              >
                {level} demand
              </span>
            </p>
            <p className="text-muted-foreground">
              {d.questions} question{d.questions === 1 ? "" : "s"} in 30 days · {d.students} student
              {d.students === 1 ? "" : "s"} in the community · {d.mentors} mentor{d.mentors === 1 ? "" : "s"} listed
            </p>
          </li>
        );
      })}
    </ul>
  );
}

// Recent posts in your units from students (not mentors, not you): the
// quickest way to help, and to be noticed.
function Questions({ unitCodes, meId }) {
  const [posts, setPosts] = useState(POSTS);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/posts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.posts) setPosts(data.posts);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = posts
    .filter(
      (p) =>
        p.status !== "removed" &&
        p.author_id !== meId &&
        p.unit_codes?.some((c) => unitCodes.includes(c)) &&
        authorOf(p) &&
        authorOf(p).role !== "mentor"
    )
    .sort((a, b) => (a.hours_ago ?? 0) - (b.hours_ago ?? 0))
    .slice(0, 8);

  if (shown.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">No student questions in your units right now.</p>;
  }
  return shown.map((post) => <PostCard key={post.id} post={post} author={authorOf(post)} reason={null} />);
}

export default function MentorHubPage() {
  const { persona } = usePersona();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const res = await fetch(`/api/mentor-hub?profile_id=${encodeURIComponent(persona.id)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error ?? "Could not load the mentor hub.");
      else {
        setError(null);
        setData({ ...json, personaId: persona.id });
      }
    } catch {
      setError("Could not reach the server.");
    }
  }

  useEffect(() => {
    const run = async () => load();
    run();
    // load reads persona.id; re-run when the account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona.id]);

  const current = data?.personaId === persona.id ? data : null;
  const unitCodes = current?.listings.map((l) => l.unit_code) ?? [];

  return (
    <div className="pb-16 md:pb-0">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold">Mentor hub</h1>
        <p className="text-sm text-muted-foreground">Your membership, your listings, and students who need you.</p>
      </div>

      {error && <p className="px-4 py-4 text-sm text-destructive">{error}</p>}
      {!current && !error && (
        <div className="space-y-3 px-4 py-5">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      )}

      {current && current.listings.length === 0 && (
        <Empty className="my-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GraduationCap />
            </EmptyMedia>
            <EmptyTitle>You don&apos;t mentor a unit yet</EmptyTitle>
            <EmptyDescription>
              Got a Distinction or High Distinction? Apply to mentor that unit. You set your own price, and if no
              student requests a session in your first {GUARANTEE_DAYS} days, your membership fee comes back.
            </EmptyDescription>
          </EmptyHeader>
          <Link href="/mentor/apply" className={cn(buttonVariants(), "rounded-full")}>
            Apply to mentor
          </Link>
        </Empty>
      )}

      {current && current.listings.length > 0 && (
        <>
          <Section title="Membership">
            <MembershipCard data={current} meId={persona.id} onChanged={load} />
          </Section>
          <Section title="Your units">
            <Listings listings={current.listings} active={current.membership.included || current.membership.active} />
            <Link href="/mentor/apply" className="text-sm text-primary hover:underline">
              Mentor another unit
            </Link>
          </Section>
          <Section title="Demand in your units" hint="Questions posted and students in each unit, against mentors listed.">
            <Demand demand={current.demand} />
          </Section>
          <div className="px-4 pt-5">
            <h2 className="font-semibold">Questions in your units</h2>
            <p className="text-sm text-muted-foreground">Recent posts from students. Replying is the quickest way to get noticed.</p>
          </div>
          <Questions unitCodes={unitCodes} meId={persona.id} />
        </>
      )}
    </div>
  );
}
