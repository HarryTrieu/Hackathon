"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BookOpen,
  Check,
  GraduationCap,
  Link2,
  MapPin,
  PenLine,
  PlayCircle,
  RefreshCw,
  Route,
  Sparkles,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { BackButton } from "@/components/back-button";
import { getUnit } from "@/lib/communities";
import { usePersona } from "@/lib/persona-context";
import { getProfile } from "@/lib/seed";
import { GRADES, OUTLINES } from "@/lib/study-outlines";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const KIND_ICON = { video: PlayCircle, docs: BookOpen, practice: PenLine, course: GraduationCap, shared: Link2 };

function Chip({ active, onClick, children, className }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/40 hover:bg-primary/5",
        className
      )}
    >
      {children}
    </button>
  );
}

function PlanForm({ code, outline, initial, onBuilt, onCancel, meId }) {
  const [goal, setGoal] = useState(initial?.goal ?? 1);
  const [weak, setWeak] = useState(initial?.weak_spots ?? []);
  const [showWorries, setShowWorries] = useState((initial?.weak_spots?.length ?? 0) > 0);
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function toggleWeak(topic) {
    setWeak((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : prev.length < 3 ? [...prev, topic] : prev));
  }

  async function build(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          profile_id: meId,
          unit_code: code,
          goal,
          weak_spots: weak.map((w) => w.slice(0, 40)),
          note: note.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.error ?? "Could not build the plan.");
      toast("Your study plan is ready");
      onBuilt(json);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={build} className="space-y-5 px-4 py-5">
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">What grade are you aiming for?</h2>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g, i) => (
            <Chip key={g} active={goal === i} onClick={() => setGoal(i)}>
              {g}
            </Chip>
          ))}
        </div>
      </section>
      {!showWorries ? (
        <button
          type="button"
          onClick={() => setShowWorries(true)}
          className="text-sm font-medium text-primary hover:underline"
        >
          + Add topics you&apos;re worried about (optional)
        </button>
      ) : (
        <section className="space-y-3">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">
              Anything you&apos;re worried about? <span className="font-normal text-muted-foreground">Pick up to 3</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {outline.map((b) => (
                <Chip key={b.topic} active={weak.includes(b.topic)} onClick={() => toggleWeak(b.topic)}>
                  {b.topic}
                </Chip>
              ))}
            </div>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Anything else? e.g. I work weekends, or I'm new to coding"
            className="w-full resize-none rounded-xl border bg-transparent px-3 py-2 text-base outline-none focus:border-primary/50 md:text-sm"
          />
        </section>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" className="rounded-full" disabled={busy}>
          {busy ? <Spinner data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
          {busy ? `Reading what ${code} students shared...` : "Build my plan"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" className="rounded-full" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Built by AI from this unit&apos;s posts, mentors&apos; tips and a sample outline. It tells you what to learn and
        practise, never the answers.
      </p>
    </form>
  );
}

function Source({ source, refs }) {
  if (!source) return null;
  if (source.startsWith("tip:")) {
    const tip = refs.tips[source];
    if (!tip) return null;
    return (
      <p className="text-xs text-muted-foreground">
        Tip from{" "}
        <Link href={`/profile/${tip.by_id}`} className="font-medium text-primary hover:underline">
          {tip.by}
        </Link>
      </p>
    );
  }
  const post = refs.posts[source];
  if (!post) return null;
  const author = getProfile(post.author_id);
  return (
    <p className="text-xs text-muted-foreground">
      From{" "}
      <Link href={`/profile/${post.author_id}`} className="font-medium text-primary hover:underline">
        {author?.name ?? "a student"}
      </Link>
      &apos;s post: &ldquo;{post.excerpt}...&rdquo;
    </p>
  );
}

function PlanView({ code, row, refs, meId, onChanged, onRebuild }) {
  const [done, setDone] = useState(row.done ?? []);
  const plan = row.plan;
  const steps = plan.blocks.flatMap((b) => b.steps);
  const pct = steps.length ? Math.round((done.length / steps.length) * 100) : 0;
  // "Up next": the first block with steps left, so the plan follows your
  // progress rather than a calendar week.
  const current = plan.blocks.find((b) => b.steps.some((s) => !done.includes(s.id)))?.weeks;

  async function tick(stepId, next) {
    setDone((prev) => (next ? [...prev, stepId] : prev.filter((s) => s !== stepId)));
    if (row.id === "local") return;
    const res = await fetch("/api/study-plan", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profile_id: meId, plan_id: row.id, step_id: stepId, done: next }),
    });
    if (!res.ok) {
      setDone((prev) => (next ? prev.filter((s) => s !== stepId) : [...prev, stepId]));
      toast("Couldn't save that tick. Try again.", { tone: "info" });
    } else if (next && done.length + 1 === steps.length) {
      toast("Plan complete. Nice work!");
      onChanged?.();
    }
  }

  return (
    <div>
      <div className="space-y-3 border-b bg-gradient-to-b from-primary/[0.08] to-transparent px-4 py-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge>{GRADES[row.inputs.goal]}</Badge>
          <Badge variant="outline" className="text-muted-foreground">
            <Sparkles data-icon="inline-start" />
            {row.mocked ? "Built without AI (fallback)" : "AI-generated"}
          </Badge>
        </div>
        <p className="text-sm leading-relaxed">{plan.summary}</p>
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {done.length} of {steps.length} steps done
            </span>
            <span className="font-semibold text-foreground">{pct}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <Button size="sm" variant="outline" className="rounded-full" onClick={onRebuild}>
          <RefreshCw data-icon="inline-start" />
          Change grade or rebuild
        </Button>
      </div>

      <ol className="relative space-y-4 px-4 py-5">
        {plan.blocks.map((block) => {
          const blockDone = block.steps.every((s) => done.includes(s.id));
          const here = block.weeks === current;
          return (
            <li key={block.weeks} className="relative pl-8">
              <span
                className={cn(
                  "absolute top-1 left-0 flex size-6 items-center justify-center rounded-full border-2 bg-background",
                  blockDone ? "border-primary bg-primary text-primary-foreground" : here ? "border-primary" : "border-border"
                )}
              >
                {blockDone ? <Check className="size-3.5" /> : here ? <MapPin className="size-3.5 text-primary" /> : null}
              </span>
              <span aria-hidden className="absolute top-8 bottom-[-1rem] left-[11px] w-0.5 bg-border" />
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-semibold">
                  {block.weeks.includes("-") ? "Weeks" : "Week"} {block.weeks}
                </span>
                {here && <Badge>Up next</Badge>}
                <span className="text-sm text-muted-foreground">{block.focus}</span>
              </div>
              <ul className="space-y-2">
                {block.steps.map((s) => {
                  const checked = done.includes(s.id);
                  return (
                    <li
                      key={s.id}
                      className={cn(
                        "rounded-xl border p-3 transition-colors",
                        checked ? "border-primary/30 bg-primary/[0.04]" : "hover:border-primary/30"
                      )}
                    >
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => tick(s.id, e.target.checked)}
                          className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
                        />
                        <span className="min-w-0 flex-1 space-y-1">
                          <span className={cn("block text-sm font-medium", checked && "text-muted-foreground line-through")}>
                            {s.title}
                          </span>
                          {s.task && (
                            <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">{s.task}</span>
                          )}
                          <span className="block text-sm text-muted-foreground">{s.detail}</span>
                        </span>
                      </label>
                      {s.resources.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 pl-7">
                          {s.resources.map((key) => {
                            const r = refs.links[key];
                            if (!r) return null;
                            const Icon = KIND_ICON[r.kind] ?? Link2;
                            return (
                              <a
                                key={key}
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-primary/40 hover:text-primary"
                              >
                                <Icon className="size-3.5" />
                                {r.title}
                              </a>
                            );
                          })}
                        </div>
                      )}
                      <div className="mt-1.5 pl-7">
                        <Source source={s.source} refs={refs} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>

      <div className="mx-4 mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/[0.05] p-4 text-sm">
        <Star className="size-5 shrink-0 text-primary" />
        <p className="min-w-0 flex-1">{plan.mentor_nudge ?? `Stuck on a step? A ${code} mentor can walk you through the idea.`}</p>
        <Link href={`/mentors/${code}`} className={cn(buttonVariants({ size: "sm" }), "rounded-full")}>
          Ask a {code} mentor
        </Link>
      </div>
      <p className="px-4 pb-8 text-xs text-muted-foreground">
        The outline is a sample for this demo. Check your unit site for the real tasks and due dates.
      </p>
    </div>
  );
}

export default function StudyPlanPage() {
  const { code: raw } = useParams();
  const code = String(raw).toUpperCase();
  const unit = getUnit(code);
  const outline = OUTLINES[code];
  const { persona } = usePersona();
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const wanted = useRef(null);

  async function load(id) {
    wanted.current = id;
    try {
      const res = await fetch(`/api/study-plan?profile_id=${encodeURIComponent(id)}&unit=${code}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (wanted.current !== id) return;
      if (!res.ok) setError(json.error ?? "Could not load your plan.");
      else {
        setError(null);
        setState({ ...json, personaId: id });
      }
    } catch {
      if (wanted.current === id) setError("Could not reach the server.");
    }
  }

  useEffect(() => {
    const run = async () => load(persona.id);
    run();
    // load reads code too, which never changes on this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona.id]);

  const current = state?.personaId === persona.id ? state : null;
  const showForm = current && (!current.plan || editing);

  return (
    <div className="pb-16 md:pb-0">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <BackButton fallback={`/unit/${code}`} className="-ml-2 mb-1" />
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <Route className="size-5 text-primary" />
          Study plan · <span className="font-mono">{code}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {unit?.name ?? "Unit"}: a week-by-week road map built from what students here shared.
        </p>
      </div>

      {!outline && <p className="px-4 py-6 text-sm text-muted-foreground">No study plans for this unit yet.</p>}
      {outline && error && <p className="px-4 py-6 text-sm text-destructive">{error}</p>}
      {outline && !current && !error && (
        <div className="space-y-3 px-4 py-5">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      )}
      {outline && showForm && (
        <PlanForm
          code={code}
          outline={outline}
          meId={persona.id}
          initial={current.plan?.inputs}
          onCancel={current.plan ? () => setEditing(false) : null}
          onBuilt={(json) => {
            setEditing(false);
            setState({ ...json, personaId: persona.id });
          }}
        />
      )}
      {outline && current?.plan && !editing && (
        <PlanView
          key={current.plan.id}
          code={code}
          row={current.plan}
          refs={current.refs}
          meId={persona.id}
          onRebuild={() => setEditing(true)}
        />
      )}
    </div>
  );
}
