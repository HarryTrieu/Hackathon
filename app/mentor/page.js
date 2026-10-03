"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Bot,
  CalendarCheck,
  Check,
  Copy,
  Flame,
  GraduationCap,
  MessageSquare,
  Plus,
  ShieldCheck,
  Star,
  Users,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { HoverGlow } from "@/components/hover-glow";
import { PostCard } from "@/components/post-card";
import { UserAvatar } from "@/components/user-avatar";
import { authorOf } from "@/lib/authors";
import { GUARANTEE_DAYS, formatDay } from "@/lib/membership";
import { usePersona } from "@/lib/persona-context";
import { POSTS } from "@/lib/seed";
import { cn } from "@/lib/utils";
import { MentoringTabs } from "@/components/mentoring-tabs";

const CARD_HOVER = "group/card relative transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/40";

// What the fee pays for, shown before you join.
const BENEFITS = [
  { icon: Users, text: "Listed in Find a mentor and suggested by the AI matcher" },
  { icon: MessageSquare, text: "Questions from students in your units, gathered for you" },
  { icon: Flame, text: "Demand in your units, so you know when to open more time" },
  { icon: Bot, text: "Your AI preview answers students 24/7 in your voice" },
  { icon: GraduationCap, text: "A verified record of your sessions and ratings for your CV" },
];

// Counts up from 0 when the number first appears (skipped with reduced motion).
function CountUp({ value, decimals = 0 }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const duration = reduce ? 0 : 700;
    let frame;
    const step = (now) => {
      const t = duration ? Math.min(1, (now - start) / duration) : 1;
      setShown(value * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return shown.toFixed(decimals);
}

function StatTile({ icon: Icon, label, value, decimals, hint }) {
  return (
    <Card className={cn(CARD_HOVER, "gap-1 py-3")}>
      <HoverGlow />
      <CardContent className="relative space-y-0.5 px-3">
        <Icon className="size-4 text-primary transition-transform duration-300 group-hover/card:scale-110" />
        <p className="text-2xl font-bold tabular-nums">
          {value === null ? "–" : <CountUp value={value} decimals={decimals} />}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground/80">{hint}</p>}
      </CardContent>
    </Card>
  );
}

// Header: who you are, membership at a glance, totals across your units.
function Hero({ persona, data }) {
  const m = data.membership;
  const total = (key) => data.listings.reduce((sum, l) => sum + (l[key] ?? 0), 0);
  const rated = data.listings.filter((l) => l.ratings);
  const ratingCount = rated.reduce((sum, l) => sum + l.ratings.count, 0);
  const rating = ratingCount
    ? rated.reduce((sum, l) => sum + l.ratings.average * l.ratings.count, 0) / ratingCount
    : null;
  const status = m.included
    ? { text: "Membership included (demo)", tone: "on" }
    : m.active
      ? { text: `Member until ${formatDay(m.membership.ends_at)}`, tone: "on" }
      : m.ready === false
        ? { text: "Memberships not switched on yet", tone: "off" }
        : { text: "Not a member yet", tone: "off" };

  return (
    <div className="space-y-4 border-b bg-gradient-to-b from-primary/[0.08] to-transparent px-4 py-5">
      <div className="flex items-center gap-3">
        <UserAvatar profile={persona} className="size-12" textClassName="text-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">Hi {persona.name.split(" ")[0]}</p>
          <p
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              status.tone === "on" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            {status.tone === "on" ? <BadgeCheck className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
            {status.text}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile icon={Bot} label="students tried your AI" value={total("preview_chats")} />
        <StatTile icon={MessageSquare} label="session requests" value={total("requests")} />
        <StatTile icon={CalendarCheck} label="sessions completed" value={total("completed")} />
        <StatTile
          icon={Star}
          label="average rating"
          value={rating}
          decimals={1}
          hint={ratingCount ? `${ratingCount} rating${ratingCount === 1 ? "" : "s"}` : "no ratings yet"}
        />
      </div>
    </div>
  );
}

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

  // Seeded mentors and the pre-migration state are covered by the hero pill.
  if (m.included || m.ready === false) return null;

  if (m.active) {
    const g = m.membership;
    return (
      <div className="flex items-start gap-3 border-b px-4 py-4 text-sm">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="flex-1 space-y-2">
          <p className="font-semibold">Money-back guarantee</p>
          <p className="text-muted-foreground">
            {m.guarantee === "met" &&
              `Met: ${m.requests_in_window} session request${m.requests_in_window === 1 ? "" : "s"} in your first ${GUARANTEE_DAYS} days.`}
            {m.guarantee === "open" &&
              `If no student requests a session by ${formatDay(g.guarantee_until)}, you get your ${data.price} back.`}
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
      </div>
    );
  }

  return (
    <div className="border-b px-4 py-5">
      <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/[0.04] p-4 text-sm">
        <p className="text-base font-semibold">
          Go live for {data.price} a trimester
          <span className="text-sm font-normal text-muted-foreground"> (4 months)</span>
        </p>
        {m.membership?.refunded_at && (
          <p className="text-muted-foreground">Refunded on {formatDay(m.membership.refunded_at)}. You can join again any time.</p>
        )}
        {m.membership && !m.membership.refunded_at && (
          <p className="text-muted-foreground">Your last membership ended on {formatDay(m.membership.ends_at)}.</p>
        )}
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2">
              <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
              {text}
            </li>
          ))}
        </ul>
        <p className="flex items-start gap-2 rounded-lg bg-background/70 p-2.5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          Money-back guarantee: if no student requests a session in your first {GUARANTEE_DAYS} days, you get the full{" "}
          {data.price} back. You set your own price and keep everything students pay you.
        </p>
        <Button className="rounded-full" disabled={busy} onClick={() => act("pay")}>
          Pay {data.price} (demo, no card charged)
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}

// Applied -> Approved -> Member -> Live, so you can see what's left to do.
function Steps({ listing, member }) {
  const rejected = listing.status === "rejected";
  const approved = listing.status === "approved";
  // Ticks in order: a step only counts once every step before it is done
  // (a demo account's included membership doesn't jump ahead of approval).
  const steps = [
    { label: "Applied", done: true },
    { label: rejected ? "Not approved" : "Approved", done: approved, failed: rejected },
    { label: "Member", done: approved && member },
    { label: "Live", done: approved && member && listing.listed },
  ];
  return (
    <ol className="grid grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex flex-col items-center gap-1 text-center">
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={cn(
                "absolute top-2.5 left-[calc(50%+14px)] right-[calc(-50%+14px)] h-px",
                s.done && steps[i + 1].done ? "bg-primary/60" : "bg-border"
              )}
            />
          )}
          <span
            className={cn(
              "relative flex size-5 items-center justify-center rounded-full border bg-background text-[10px] transition-transform duration-300 group-hover/card:scale-110",
              s.done && "border-primary bg-primary text-primary-foreground",
              s.failed && "border-destructive bg-destructive/10 text-destructive"
            )}
          >
            {s.done ? <Check className="size-3" /> : s.failed ? <X className="size-3" /> : i + 1}
          </span>
          <span className={cn("text-[11px] leading-tight", s.done ? "font-medium" : "text-muted-foreground")}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

function CopyLink({ path }) {
  const [copied, setCopied] = useState(false);
  async function copy(event) {
    event.preventDefault();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: nothing to do.
    }
  }
  return (
    <Button size="sm" variant="outline" className="h-7 rounded-full text-xs" onClick={copy}>
      {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

function UnitCard({ listing: l, member }) {
  const path = `/mentors/${l.unit_code}/${l.profile_id}`;
  const next =
    l.status === "pending"
      ? "A moderator is checking your grade."
      : l.status === "rejected"
        ? "This application wasn't approved."
        : !member
          ? "Approved. Start your membership to go live."
          : null;
  return (
    <Card className={cn(CARD_HOVER, "gap-3 py-4")}>
      <HoverGlow />
      <CardContent className="relative space-y-3 px-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-bold text-primary">{l.unit_code}</p>
            <p className="truncate text-sm text-muted-foreground">{l.unit_name}</p>
          </div>
          {l.rate_per_hour ? (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">A${l.rate_per_hour}/h</span>
          ) : null}
        </div>
        <Steps listing={l} member={member} />
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bot className="size-3.5" />
            <b className="text-foreground">{l.preview_chats}</b> tried your AI
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3.5" />
            <b className="text-foreground">{l.requests}</b> requests
          </span>
          {l.ratings && (
            <span className="flex items-center gap-1">
              <Star className="size-3.5" />
              <b className="text-foreground">{l.ratings.average.toFixed(1)}</b> ({l.ratings.count})
            </span>
          )}
        </div>
        {next && <p className="text-xs text-muted-foreground">{next}</p>}
        {l.listed && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`${path}?from=hub`}
              className={cn(buttonVariants({ size: "sm" }), "h-7 rounded-full text-xs")}
            >
              View your page
              <ArrowUpRight data-icon="inline-end" />
            </Link>
            <CopyLink path={path} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Units({ listings, member }) {
  return (
    <div className="space-y-3 px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {listings.map((l) => (
          <UnitCard key={l.id} listing={l} member={member} />
        ))}
        <Link
          href="/mentor/apply"
          className="group flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/[0.04] hover:text-primary"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Plus className="size-4" />
          </span>
          Mentor another unit
        </Link>
      </div>
    </div>
  );
}

// Students per mentor is the simplest "is it worth opening more time?" signal.
function Demand({ demand }) {
  return (
    <div className="grid gap-3 px-4 py-4 sm:grid-cols-2">
      {demand.map((d) => {
        const asking = d.questions + d.students;
        const perMentor = asking / Math.max(1, d.mentors);
        const level = perMentor >= 6 ? "High" : perMentor >= 2 ? "Medium" : "Low";
        return (
          <Link key={d.unit_code} href={`/unit/${d.unit_code}`} aria-label={`Open the ${d.unit_code} community`}>
            <Card className={cn(CARD_HOVER, "h-full gap-3 py-4")}>
              <HoverGlow />
              <CardContent className="relative space-y-3 px-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-primary">{d.unit_code}</span>
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      level === "High" && "bg-primary text-primary-foreground",
                      level === "Medium" && "bg-primary/15 text-primary",
                      level === "Low" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {level === "High" && <Flame className="size-3" />}
                    {level} demand
                  </span>
                </div>
                <p className="truncate text-sm text-muted-foreground">{d.unit_name}</p>
                <div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500 ease-out group-hover/card:brightness-110"
                      style={{ width: `${Math.min(100, Math.max(6, (perMentor / 8) * 100))}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    About <b className="text-foreground">{Number(perMentor.toFixed(1))}</b> student{perMentor === 1 ? "" : "s"} per mentor
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    [d.questions, "questions (30 days)"],
                    [d.students, "in community"],
                    [d.mentors, "mentors listed"],
                  ].map(([n, label]) => (
                    <div key={label} className="rounded-lg bg-muted/50 px-1 py-1.5 transition-colors group-hover/card:bg-primary/[0.06]">
                      <p className="font-semibold tabular-nums">{n}</p>
                      <p className="text-[10px] leading-tight text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
                  Open the {d.unit_code} community
                  <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5" />
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

// Recent posts in your units from students (not mentors, not you): the
// quickest way to help, and to be noticed.
function useStudentQuestions(unitCodes, meId) {
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
  return posts
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
}

function Hub({ data, persona, onChanged }) {
  const [tab, setTab] = useState("units");
  const unitCodes = data.listings.map((l) => l.unit_code);
  const questions = useStudentQuestions(unitCodes, persona.id);
  const member = Boolean(data.membership.included || data.membership.active || data.membership.ready === false);
  const hot = data.demand.filter((d) => (d.questions + d.students) / Math.max(1, d.mentors) >= 6).length;

  return (
    <>
      <Hero persona={persona} data={data} />
      <MembershipCard data={data} meId={persona.id} onChanged={onChanged} />
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        <div className="border-b">
          <TabsList variant="line" className="w-full justify-start px-2">
            <TabsTrigger value="units" className="flex-none px-3 py-2">
              Your units
              <span className="ml-1.5 text-xs text-muted-foreground">{data.listings.length}</span>
            </TabsTrigger>
            <TabsTrigger value="demand" className="flex-none px-3 py-2">
              Demand
              {hot > 0 && <Flame className="ml-1 size-3.5 text-primary" />}
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex-none px-3 py-2">
              Questions
              {questions.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                  {questions.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="units">
          <Units listings={data.listings} member={member} />
        </TabsContent>
        <TabsContent value="demand">
          <p className="px-4 pt-4 text-sm text-muted-foreground">
            Questions posted and students in each unit, against mentors listed. Tap a unit to see what people are asking.
          </p>
          <Demand demand={data.demand} />
        </TabsContent>
        <TabsContent value="questions">
          <p className="px-4 pt-4 text-sm text-muted-foreground">
            Recent posts from students in your units. Replying is the quickest way to get noticed.
          </p>
          {questions.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No student questions in your units right now.</p>
          ) : (
            questions.map((post) => <PostCard key={post.id} post={post} author={authorOf(post)} reason={null} />)
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function MentorHubPage() {
  const { persona } = usePersona();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  // The page can start as the default account and switch to the saved one
  // right away; a slower answer for the old account must not win.
  const wanted = useRef(null);

  async function load(id) {
    wanted.current = id;
    try {
      const res = await fetch(`/api/mentor-hub?profile_id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (wanted.current !== id) return;
      if (!res.ok) setError(json.error ?? "Could not load the mentor hub.");
      else {
        setError(null);
        setData({ ...json, personaId: id });
      }
    } catch {
      if (wanted.current === id) setError("Could not reach the server.");
    }
  }

  useEffect(() => {
    const run = async () => load(persona.id);
    run();
  }, [persona.id]);

  const current = data?.personaId === persona.id ? data : null;

  return (
    <div className="pb-16 md:pb-0">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <MentoringTabs />
        <h1 className="text-lg font-bold">Mentor hub</h1>
        <p className="text-sm text-muted-foreground">Your membership, your units, and students who need you.</p>
      </div>

      {error && <p className="px-4 py-4 text-sm text-destructive">{error}</p>}
      {!current && !error && (
        <div className="space-y-3 px-4 py-5">
          <Skeleton className="h-12 w-48 rounded-xl" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
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
            <Plus data-icon="inline-start" />
            Apply to mentor
          </Link>
        </Empty>
      )}

      {current && current.listings.length > 0 && <Hub data={current} persona={persona} onChanged={() => load(persona.id)} />}
    </div>
  );
}
