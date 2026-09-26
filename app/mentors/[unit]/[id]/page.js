"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BadgeCheck, Briefcase, CalendarCheck, Heart, ShieldCheck } from "lucide-react";
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
import { GRADE_LABELS, STYLE_QUESTIONS, mergeLocalApplications } from "@/lib/mentors";
import { usePersona } from "@/lib/persona-context";

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
              {profile.course} · {profile.year ? `Year ${profile.year}` : "Graduate"} · mentors{" "}
              {code} {unit?.name}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge>
                {GRADE_LABELS[mentor.grade]} ({mentor.grade})
              </Badge>
              {mentor.email_verified && (
                <Badge variant="secondary">
                  <BadgeCheck data-icon="inline-start" />
                  Deakin email verified
                </Badge>
              )}
              {mentor.status === "approved" && (
                <Badge variant="secondary">
                  <ShieldCheck data-icon="inline-start" />
                  Grade checked by reviewer
                </Badge>
              )}
              <Badge variant="outline">
                <Heart data-icon="inline-start" />
                {mentor.reputation} helpful votes
              </Badge>
            </div>
            <p className="mt-2 text-lg font-semibold">
              ${mentor.rate_per_hour}
              <span className="text-sm font-normal text-muted-foreground">/hour</span>
            </p>
          </div>
        </div>

        {mentor.show_experience && mentor.experience?.length > 0 && (
          <div className="mt-4 space-y-1">
            {mentor.experience.map((e) => (
              <p key={`${e.company}-${e.role}`} className="flex items-center gap-2 text-sm">
                <Briefcase className="size-4 text-primary" />
                {e.role} at <span className="font-medium">{e.company}</span>
                {e.current && <Badge variant="outline">Current</Badge>}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="grid gap-x-6 gap-y-2 rounded-xl border p-4 text-sm sm:grid-cols-2">
          {STYLE_QUESTIONS.map((q) => {
            const value = style[q.id];
            return (
              <div key={q.id}>
                <p className="text-xs text-muted-foreground">{q.label}</p>
                <p className="font-medium">{Array.isArray(value) ? value.join(", ") : value}</p>
              </div>
            );
          })}
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Strengths and what students struggle with</p>
            <p>{mentor.voice.topics}</p>
          </div>
        </div>

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
