"use client";

import { useState } from "react";
import { CalendarClock, CheckCheck, Flag, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { autoCloseDate, formatWhen, sessionState } from "@/lib/sessions";
import { formatDay } from "@/lib/membership";
import { cn } from "@/lib/utils";

const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

async function update(body) {
  const res = await fetch("/api/session-request", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return res.ok ? { ok: true } : { ok: false, error: data.error ?? "Could not save that." };
}

// Proposed time and place of a request, when the mentee gave them.
export function SessionPlan({ request }) {
  if (!request.proposed_time && !request.proposed_place) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {request.proposed_time && (
        <span className="flex items-center gap-1">
          <CalendarClock className="size-3.5 text-primary" />
          {formatWhen(request.proposed_time)}
        </span>
      )}
      {request.proposed_place && (
        <span className="flex items-center gap-1">
          <MapPin className="size-3.5 text-primary" />
          {request.proposed_place}
        </span>
      )}
    </p>
  );
}

// Mentee side: end an accepted session with 1 to 5 stars, did it help, and
// an optional comment. Collapsed to one button until you start.
export function EndSession({ request, menteeId, mentorName, onSaved }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [helped, setHelped] = useState(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const state = sessionState(request);
  const first = mentorName?.split(" ")[0] ?? "Your mentor";

  if (state === "completed") {
    return typeof request.rating === "number" ? (
      <p className="text-xs text-muted-foreground">
        Session ended. You rated it{" "}
        <span className="text-primary" aria-label={`${request.rating} out of 5 stars`}>{stars(request.rating)}</span>
        {request.helped === true ? ", and it helped you get unstuck." : "."}
      </p>
    ) : null;
  }
  if (state !== "active" && state !== "ending" && state !== "unconfirmed") return null;

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const result = await update({
      action: "end",
      id: request.id,
      mentee_id: menteeId,
      rating,
      helped,
      comment: comment.trim() || undefined,
    });
    setSaving(false);
    if (!result.ok) setError(result.error);
    else onSaved?.();
  }

  const nudge = state !== "active" && (
    <p className="text-xs text-muted-foreground">{first} marked this session as done. Rate it to close it.</p>
  );

  if (!open) {
    return (
      <div className="space-y-1.5">
        {nudge}
        <Button size="sm" variant={state === "active" ? "outline" : "default"} className="rounded-full" onClick={() => setOpen(true)}>
          <Flag data-icon="inline-start" />
          End session and rate
        </Button>
        <p className="text-[11px] text-muted-foreground">You can keep chatting afterwards; this only closes the session.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-lg border bg-background p-2.5">
      <p className="text-xs font-semibold">How did the session go?</p>
      <div className="flex gap-0.5" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
            className="rounded p-0.5 transition-transform hover:scale-110"
          >
            <Star className={cn("size-5", n <= rating ? "fill-primary text-primary" : "text-muted-foreground")} />
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span>Did it help you get unstuck?</span>
        {[
          [true, "Yes"],
          [false, "Not really"],
        ].map(([value, label]) => (
          <button
            key={label}
            type="button"
            aria-pressed={helped === value}
            onClick={() => setHelped(value)}
            className={cn(
              "rounded-full border px-2.5 py-0.5",
              helped === value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        placeholder="Optional: what helped, or what could be better"
        className="h-9 w-full rounded-lg border bg-transparent px-3 text-base outline-none focus:border-primary/50 md:text-sm"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="rounded-full" disabled={saving || rating === 0 || helped === null}>
          End session
        </Button>
        <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => setOpen(false)}>
          Not yet
        </Button>
      </div>
    </form>
  );
}

// Mentor side: you can't end a session yourself, only ask the student to.
export function RequestEnd({ request, mentorId, menteeName, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const state = sessionState(request);
  const first = menteeName?.split(" ")[0] ?? "The student";

  if (state === "ending") {
    return (
      <p className="text-xs text-muted-foreground">
        You marked this as done. Waiting for {first} to end it and rate it. If they don&apos;t, it closes on{" "}
        {formatDay(autoCloseDate(request))} without counting toward your stats.
      </p>
    );
  }
  if (state === "unconfirmed") {
    return (
      <p className="text-xs text-muted-foreground">
        Closed without {first}&apos;s confirmation, so it doesn&apos;t count toward your stats.
      </p>
    );
  }
  if (state !== "active") return null;

  async function ask() {
    setSaving(true);
    setError(null);
    const result = await update({ action: "request_end", id: request.id, mentor_id: mentorId });
    setSaving(false);
    if (!result.ok) setError(result.error);
    else onSaved?.();
  }
  return (
    <div className="space-y-1">
      <Button size="sm" variant="outline" className="rounded-full" disabled={saving} onClick={ask}>
        <CheckCheck data-icon="inline-start" />
        Mark as done
      </Button>
      <p className="text-[11px] text-muted-foreground">
        {first} ends the session and rates it. Only sessions they confirm count toward your ranking.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Mentor side: the mentee's rating, once they've given it.
export function ReceivedRating({ request }) {
  if (typeof request.rating !== "number") return null;
  return (
    <div className="text-xs">
      <p>
        Rated <span className="text-primary" aria-label={`${request.rating} out of 5 stars`}>{stars(request.rating)}</span>
        {request.helped === true ? " · helped them get unstuck" : request.helped === false ? " · didn't quite get them unstuck" : ""}
      </p>
      {request.rating_comment && <p className="mt-0.5 text-muted-foreground">&ldquo;{request.rating_comment}&rdquo;</p>}
    </div>
  );
}
