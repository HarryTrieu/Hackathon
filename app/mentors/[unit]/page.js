"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, RotateCcw, Send, Sparkles, UserPlus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { MentorCard } from "@/components/mentor-card";
import { getUnit } from "@/lib/communities";
import { mergeLocalApplications } from "@/lib/mentors";
import { cn } from "@/lib/utils";

const STARTERS = [
  "I want a mentor with a calm way of talking, who can explain Marketing so it actually makes sense.",
  "My exam is in two weeks. I need someone direct who focuses on exam prep.",
  "I'd like a mentor who can explain things in Vietnamese.",
  "Not sure yet. Ask me a few questions to find my match.",
];

export default function FindMentorPage() {
  const { unit: rawUnit } = useParams();
  const code = String(rawUnit).toUpperCase();
  const unit = getUnit(code);

  const [mentors, setMentors] = useState(null);
  // [{ role: "mentee" | "ai", text, suggestions? }]
  const [messages, setMessages] = useState([]);
  const [matches, setMatches] = useState(null);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [matching, setMatching] = useState(false);
  const [budget, setBudget] = useState("any");
  const [language, setLanguage] = useState("any");
  const [format, setFormat] = useState("any");
  const endRef = useRef(null);
  const matchTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/mentors?unit=${code}`)
      .then((res) => (res.ok ? res.json() : { mentors: [] }))
      .then((data) => {
        if (!cancelled) setMentors(mergeLocalApplications(data.mentors, { unitCode: code }));
      })
      .catch(() => !cancelled && setMentors([]));
    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, matches, matching]);

  useEffect(() => () => clearTimeout(matchTimer.current), []);

  async function send(text) {
    const clean = text.trim();
    if (!clean || thinking) return;
    const next = [...messages, { role: "mentee", text: clean }].slice(-12);
    setMessages(next);
    setDraft("");
    setThinking(true);
    setError(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          unit_code: code,
          messages: next.map(({ role, text: t }) => ({ role, text: t })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Matching failed. Try again.");
        return;
      }
      setMocked(Boolean(data.mocked));
      if (data.type === "question") {
        setMessages((prev) => [...prev, { role: "ai", text: data.question, suggestions: data.suggestions }]);
      } else {
        setMessages((prev) => [...prev, { role: "ai", text: data.summary }]);
        setMatches(null);
        setMatching(true);
        clearTimeout(matchTimer.current);
        matchTimer.current = setTimeout(() => {
          setMatches(data.matches);
          setMatching(false);
        }, 3000);
      }
    } catch {
      setError("Could not reach the matcher. Browse the mentors below instead.");
    } finally {
      setThinking(false);
    }
  }

  function reset() {
    clearTimeout(matchTimer.current);
    setMessages([]);
    setMatches(null);
    setMatching(false);
    setError(null);
  }

  const byId = new Map((mentors ?? []).map((m) => [m.id, m]));
  const rankedAll = (matches ?? [])
    .map((m) => ({ mentor: byId.get(m.id), reason: m.reason }))
    .filter((r) => r.mentor);

  function pickRecommended(list) {
    if (list.length <= 5) return list;
    const top = list.slice(0, 4);
    const newer = [...list].sort((a, b) => a.mentor.reputation - b.mentor.reputation)[0];
    if (newer && !top.some((r) => r.mentor.id === newer.mentor.id)) {
      return [...top.slice(0, 3), { ...newer, reason: `${newer.reason} Newer mentor, included so newer listings still get seen.` }];
    }
    return list.slice(0, 5);
  }

  const filtered = rankedAll.filter(({ mentor }) => {
    if (budget === "30" && mentor.rate_per_hour > 30) return false;
    if (budget === "50" && mentor.rate_per_hour > 50) return false;
    if (language !== "any" && !mentor.style.languages.includes(language)) return false;
    if (format !== "any" && mentor.style.format !== format && mentor.style.format !== "Both") return false;
    return true;
  });
  const ranked = pickRecommended(filtered);
  const lastAi = messages.at(-1)?.role === "ai" ? messages.at(-1) : null;

  return (
    <div className="pb-16 md:pb-0">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/mentors"
            aria-label="Back to all units"
            className="rounded-full p-1.5 transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold">
              Mentors for <span className="font-mono">{code}</span>
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {unit?.name ?? "Unit"} · tell the AI what kind of mentor suits you
            </p>
          </div>
          {messages.length > 0 && (
            <Button size="sm" variant="ghost" onClick={reset}>
              <RotateCcw data-icon="inline-start" />
              Start over
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3 border-b px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="size-4 text-primary" />
              Describe the mentor you want, or pick a starting point:
            </p>
            <div className="flex flex-col gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-xl border px-3 py-2 text-left text-sm transition-colors duration-300 hover:border-primary/40 hover:bg-primary/[0.03]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "mentee" ? "justify-end" : "justify-start")}>
            <p
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                m.role === "mentee" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              {m.text}
            </p>
          </div>
        ))}

        {lastAi?.suggestions && !thinking && (
          <div className="flex flex-wrap gap-2">
            {lastAi.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border px-3 py-1 text-sm transition-colors duration-300 hover:border-primary/40 hover:bg-primary/[0.05]"
              >
                {s}
              </button>
            ))}
            <button
              type="button"
              onClick={() => send("Just show me the mentors.")}
              className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
            >
              Skip, show mentors
            </button>
          </div>
        )}

        {thinking && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Thinking about who fits you...
          </p>
        )}
        {matching && (
          <p className="flex items-center gap-2 rounded-xl border bg-primary/5 px-3 py-3 text-sm font-medium duration-700 animate-in fade-in">
            <Spinner /> Matching a mentor for you...
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
          className="flex items-center gap-2 pt-1"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={matches ? "Refine: e.g. cheaper, or online only..." : "e.g. someone gentle who uses real examples"}
            maxLength={1000}
            className="h-10 min-w-0 flex-1 rounded-full border bg-transparent px-4 text-sm outline-none transition-colors focus:border-primary/50"
          />
          <Button type="submit" size="icon-lg" className="rounded-full" disabled={!draft.trim() || thinking} aria-label="Send">
            <Send />
          </Button>
        </form>
        <div ref={endRef} />
      </div>

      {ranked.length > 0 && (
        <section className="space-y-3 border-b px-4 py-4 duration-700 animate-in fade-in slide-in-from-bottom-2">
          <h2 className="text-sm font-semibold">
            Your matches {mocked && <span className="font-normal text-muted-foreground">(offline matcher)</span>}
          </h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <label className="flex items-center gap-1">
              Budget
              <select value={budget} onChange={(e) => setBudget(e.target.value)} className="rounded-md border bg-transparent px-1 py-0.5">
                <option value="any">Any</option>
                <option value="30">Under $30</option>
                <option value="50">$50 or under</option>
              </select>
            </label>
            <label className="flex items-center gap-1">
              Language
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-md border bg-transparent px-1 py-0.5">
                <option value="any">Any</option>
                <option value="English">English</option>
                <option value="Vietnamese">Vietnamese</option>
                <option value="Mandarin">Mandarin</option>
                <option value="Hindi">Hindi</option>
                <option value="Arabic">Arabic</option>
              </select>
            </label>
            <label className="flex items-center gap-1">
              Format
              <select value={format} onChange={(e) => setFormat(e.target.value)} className="rounded-md border bg-transparent px-1 py-0.5">
                <option value="any">Any</option>
                <option value="Online">Online</option>
                <option value="In person">In person</option>
              </select>
            </label>
          </div>
          {ranked.map(({ mentor, reason }, i) => (
            <MentorCard key={mentor.id} mentor={mentor} reason={reason} rank={i + 1} />
          ))}
        </section>
      )}

      <section className="space-y-3 px-4 py-4">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {matches ? "All mentors for this unit" : "Or browse every mentor"}
        </h2>
        {mentors === null && (
          <>
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </>
        )}
        {mentors?.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm font-medium">No mentors for {code} yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Scored a D or HD here? Be the first.
            </p>
            <Link
              href={`/mentor/apply?unit=${code}`}
              className={cn(buttonVariants({ size: "sm" }), "mt-3 rounded-full")}
            >
              <UserPlus data-icon="inline-start" />
              Become a mentor
            </Link>
          </div>
        )}
        {mentors?.map((m) => <MentorCard key={m.id} mentor={m} />)}
      </section>
    </div>
  );
}
