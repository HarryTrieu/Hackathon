"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BadgeCheck, Briefcase, CalendarCheck, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { MentorChat } from "@/components/mentor-chat";
import { ReportButton } from "@/components/report-button";
import { UserAvatar } from "@/components/user-avatar";
import { getUnit } from "@/lib/communities";
import { gradeBand, mergeLocalApplications } from "@/lib/mentors";
import { usePersona } from "@/lib/persona-context";

// Short labels for the mentor's Part A answers, shown as chips. The full
// questions are written for the mentor filling in the form, not the student.
const STYLE_CHIPS = [
  ["teaching", "Style"],
  ["tone", "Tone"],
  ["pace", "Pace"],
  ["feedback", "Feedback"],
  ["languages", "Speaks"],
  ["format", "Format"],
];

function SessionRequest({ mentor, persona }) {
  const first = mentor.profile.name.split(" ")[0];
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(
    `Hi ${first}, I'm ${persona.name.split(" ")[0]} and I'm taking ${mentor.unit_code}. I'd like a session on `
  );
  const [state, setState] = useState("idle");
  const [note, setNote] = useState(null);

  if (persona.id === mentor.profile_id) return null;

  async function submit(e) {
    e.preventDefault();
    setState("sending");
    setNote(null);
    try {
      const res = await fetch("/api/session-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listing_id: mentor.id, mentee_id: persona.id, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("idle");
        setNote(data.error ?? "Could not send the request.");
        return;
      }
      fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "contact_clicked", listing_id: mentor.id, mentee_id: persona.id }),
      }).catch(() => {});
      setState("sent");
      setNote(
        data.persisted
          ? `Sent. ${first} will reply to arrange a time. Listed rate: $${mentor.rate_per_hour}/h.`
          : `Sent for this session only (database table not set up). Listed rate: $${mentor.rate_per_hour}/h.`
      );
    } catch {
      setState("idle");
      setNote("Could not reach the server.");
    }
  }

  if (state === "sent") {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.05] p-3 text-sm">
        <CalendarCheck className="size-4 shrink-0 text-primary" />
        {note}
      </p>
    );
  }

  return (
    <div className="rounded-xl border p-4">
      {!open ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">
            <span className="font-semibold">Good fit?</span>{" "}
            <span className="text-muted-foreground">Book the real {first} at ${mentor.rate_per_hour}/h.</span>
          </p>
          <Button className="rounded-full" onClick={() => setOpen(true)}>
            <CalendarCheck data-icon="inline-start" />
            Request a session
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-2">
          <p className="text-sm font-semibold">Message to {first}</p>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={3} />
          {note && <p className="text-sm text-destructive">{note}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-full" disabled={state === "sending"}>
              {state === "sending" ? <Spinner /> : "Send request"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function MentorDetailPage() {
  const { unit: rawUnit, id } = useParams();
  const code = String(rawUnit).toUpperCase();
  const unit = getUnit(code);
  const { persona } = usePersona();
  const [mentor, setMentor] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/mentors?unit=${code}`)
      .then((res) => (res.ok ? res.json() : { mentors: [] }))
      .then((data) => {
        if (cancelled) return;
        const all = mergeLocalApplications(data.mentors, { unitCode: code });
        setMentor(all.find((m) => m.profile_id === id) ?? null);
      })
      .catch(() => !cancelled && setMentor(null));
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (mentor === undefined) {
    return (
      <div className="space-y-3 px-4 py-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }
  if (mentor === null) {
    return (
      <Empty className="py-20">
        <EmptyHeader>
          <EmptyTitle>Mentor not found</EmptyTitle>
          <EmptyDescription>
            This person doesn&apos;t mentor {code} (or isn&apos;t approved yet).{" "}
            <Link href={`/mentors/${code}`} className="text-primary hover:underline">
              See {code} mentors
            </Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const { profile, style } = mentor;
  const first = profile.name.split(" ")[0];

  return (
    <div className="pb-16 md:pb-0">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <Link
          href={`/mentors/${code}`}
          aria-label="Back to mentors"
          className="rounded-full p-1.5 transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <p className="min-w-0 flex-1 text-sm text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">{code}</span> mentors
        </p>
        <Link href={`/mentors/${code}`} className="text-xs text-primary hover:underline">
          Back to results
        </Link>
        <Link href={`/mentors/${code}`} className="text-xs text-muted-foreground hover:underline">
          Try another mentor
        </Link>
        {mentor && <ReportButton targetType="mentor" targetId={mentor.id} />}
      </div>

      <div className="border-b bg-gradient-to-b from-primary/[0.06] to-transparent px-4 py-5">
        <div className="flex items-start gap-4">
          <UserAvatar profile={profile} className="size-16 ring-4 ring-background" textClassName="text-xl" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">
              <Link href={`/profile/${profile.id}`} className="hover:underline">
                {profile.name}
              </Link>
            </h1>
            <p className="text-sm text-muted-foreground">
              Mentors <span className="font-mono">{code}</span>
              {unit?.name ? ` · ${unit.name}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile.course} · {profile.year ? `Year ${profile.year}` : "Graduate"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge>{gradeBand(mentor.grade)} · {code}</Badge>
              {mentor.is_demo && <span className="text-xs text-muted-foreground">Sample data</span>}
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          <span className="text-2xl font-bold text-foreground">${mentor.rate_per_hour}</span>/hour
          {mentor.availability && <> · Usually free: {mentor.availability}</>}
        </p>

        {/* Numbers as a stats row, like post / follower counts on social apps. */}
        <dl className="mt-3 grid grid-cols-3 divide-x rounded-xl border bg-background/60 text-center">
          {[
            [mentor.reputation, "helpful votes"],
            [mentor.preview_chats ?? 0, "preview chats"],
            [mentor.contact_requests ?? 0, "contact requests"],
          ].map(([value, label]) => (
            <div key={label} className="flex flex-col-reverse px-2 py-2">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-lg font-bold">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Trust signals and experience as one quiet line instead of badges. */}
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {mentor.email_verified && (
            <li className="flex items-center gap-1">
              <BadgeCheck className="size-3.5 text-primary" />
              Deakin email verified
            </li>
          )}
          {mentor.status === "approved" && (
            <li className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-primary" />
              Grade checked by reviewer
            </li>
          )}
          {mentor.show_experience &&
            mentor.experience?.map((e) => (
              <li key={`${e.company}-${e.role}`} className="flex items-center gap-1">
                <Briefcase className="size-3.5 text-primary" />
                {e.role} at <span className="font-medium text-foreground">{e.company}</span>
                {e.current && " (current)"}
              </li>
            ))}
        </ul>
      </div>

      <div className="space-y-4 px-4 py-4">
        <section className="space-y-3 rounded-xl border p-4 text-sm">
          <h2 className="font-semibold">How {first} teaches</h2>
          <div className="flex flex-wrap gap-1.5">
            {STYLE_CHIPS.map(([key, label]) => (
              <Badge key={key} variant="secondary" className="font-normal">
                <span className="text-muted-foreground">{label}</span>
                {[style[key]].flat().join(", ")}
              </Badge>
            ))}
          </div>
          <p>
            <span className="text-muted-foreground">Helps most with: </span>
            {(style.help ?? []).join(", ")}
          </p>
          <blockquote className="border-l-2 border-primary/50 pl-3">
            <p>&ldquo;{mentor.voice.topics}&rdquo;</p>
            <footer className="mt-1 text-xs text-muted-foreground">
              Strengths and common struggles, in {first}&apos;s words
            </footer>
          </blockquote>
        </section>

        <MentorChat
          key={`${persona.id}-${mentor.id}`}
          mentor={mentor}
          persona={persona}
          unitName={unit?.name}
        />

        <SessionRequest key={`req-${persona.id}-${mentor.id}`} mentor={mentor} persona={persona} />

        <p className="text-center text-xs text-muted-foreground">
          {first} agreed to the mentor code of conduct: concept coaching only, never writing assessments.
        </p>
      </div>
    </div>
  );
}
