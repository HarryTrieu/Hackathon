"use client";

import { useState } from "react";
import { CalendarClock, CheckCheck, Flag, Hourglass, MapPin, ReceiptText, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SESSION_DAYS, autoEnded, formatWhen, sessionEndsAt, sessionState } from "@/lib/sessions";
import { formatDay } from "@/lib/membership";
import { SODU_CUT, aud, sessionPayment } from "@/lib/payments";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

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

// "Ends automatically on ..." for both sides while a session runs.
function EndsNotice({ request, mentee }) {
  return (
    <p className="flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-800 dark:text-amber-300">
      <Hourglass className="mt-px size-3.5 shrink-0" />
      <span>
        Sessions last up to {SESSION_DAYS} days. This one ends by itself on {formatDay(sessionEndsAt(request))} and
        {mentee ? " counts as a paid session even if you don't end it." : " counts as completed even if the student doesn't end it."}
      </span>
    </p>
  );
}

// Mentee side: end an accepted session with 1 to 5 stars, did it help, and
// an optional comment. Collapsed to one button until you start. After the
// 5-day limit ends it, you can still rate it.
export function EndSession({ request, menteeId, mentorName, onSaved }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [helped, setHelped] = useState(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const state = sessionState(request);
  const first = mentorName?.split(" ")[0] ?? "Your mentor";
  const pay = sessionPayment(request);

  const lateRating = autoEnded(request);
  if (state === "completed" && !lateRating) {
    return typeof request.rating === "number" ? (
      <p className="text-xs text-muted-foreground">
        Session ended. You rated it{" "}
        <span className="text-primary" aria-label={`${request.rating} out of 5 stars`}>{stars(request.rating)}</span>
        {request.helped === true ? ", and it helped you get unstuck." : "."}
      </p>
    ) : null;
  }
  if (state !== "active" && state !== "ending" && !lateRating) return null;

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
    else {
      toast(lateRating ? "Thanks for rating" : pay ? `Session ended. Paid ${aud(pay.price)} (demo)` : "Session ended. Thanks for rating");
      onSaved?.();
    }
  }

  if (!open) {
    return (
      <div className="space-y-1.5">
        {state === "ending" && (
          <p className="text-xs text-muted-foreground">{first} marked this session as done. Rate it to close it.</p>
        )}
        {lateRating && (
          <p className="text-xs text-muted-foreground">
            This session ended by itself after {SESSION_DAYS} days. How did it go?
          </p>
        )}
        <Button size="sm" variant={state === "active" ? "outline" : "default"} className="rounded-full" onClick={() => setOpen(true)}>
          {lateRating ? <Star data-icon="inline-start" /> : <Flag data-icon="inline-start" />}
          {lateRating ? "Rate this session" : "End session and rate"}
        </Button>
        {!lateRating && <EndsNotice request={request} mentee />}
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
      {pay && !lateRating && (
        <p className="text-xs text-muted-foreground">
          Ending the session pays {first} {aud(pay.price)} for one hour. Demo payment: no card is charged.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="rounded-full" disabled={saving || rating === 0 || helped === null}>
          {lateRating ? "Send rating" : pay ? `End session and pay ${aud(pay.price)}` : "End session"}
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
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">You marked this as done. Waiting for {first} to end it and rate it.</p>
        <EndsNotice request={request} />
      </div>
    );
  }
  if (state === "completed" && autoEnded(request)) {
    return <p className="text-xs text-muted-foreground">This session ended by itself after {SESSION_DAYS} days.</p>;
  }
  if (state !== "active") return null;

  async function ask() {
    setSaving(true);
    setError(null);
    const result = await update({ action: "request_end", id: request.id, mentor_id: mentorId });
    setSaving(false);
    if (!result.ok) setError(result.error);
    else {
      toast(`Asked ${first} to end the session`);
      onSaved?.();
    }
  }
  return (
    <div className="space-y-1">
      <Button size="sm" variant="outline" className="rounded-full" disabled={saving} onClick={ask}>
        <CheckCheck data-icon="inline-start" />
        Mark as done
      </Button>
      <p className="text-[11px] text-muted-foreground">Asks {first} to end the session and rate it.</p>
      <EndsNotice request={request} />
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

// Both sides, once a session has ended: a demo receipt for the student and a
// demo payout for the mentor. Nothing is charged; see lib/payments.js.
export function PaymentReceipt({ request, side, otherName }) {
  const pay = sessionPayment(request);
  if (!pay || sessionState(request) !== "completed") return null;
  const auto = autoEnded(request);
  const day = formatDay(auto ? sessionEndsAt(request) : (request.ended_at ?? request.rated_at ?? request.created_at));
  const first = otherName?.split(" ")[0] ?? (side === "mentor" ? "The student" : "your mentor");
  const rows =
    side === "mentor"
      ? [
          ["Session (1 hour)", aud(pay.price)],
          [`Sodu fee (${Math.round(SODU_CUT * 100)}%)`, `-${aud(pay.fee)}`],
          ["You receive", aud(pay.payout)],
        ]
      : [
          [`Session with ${first} (1 hour)`, aud(pay.price)],
          ["Total paid", aud(pay.price)],
        ];
  return (
    <div className="max-w-sm space-y-1.5 rounded-lg border bg-background p-2.5 text-xs">
      <p className="flex items-center gap-1.5 font-semibold">
        <ReceiptText className="size-3.5 text-primary" />
        {side === "mentor" ? `Payout from ${first}` : "Payment receipt"}
        <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Demo</span>
      </p>
      <dl className="space-y-0.5">
        {rows.map(([label, value], i) => (
          <div key={label} className={cn("flex justify-between gap-3", i === rows.length - 1 && "border-t pt-1 font-semibold")}>
            <dt>{label}</dt>
            <dd className="tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[11px] text-muted-foreground">
        {pay.receipt} · {day}
        {auto ? ` · charged when the session ended after ${SESSION_DAYS} days` : ""}. No money moves in the demo.
      </p>
    </div>
  );
}
