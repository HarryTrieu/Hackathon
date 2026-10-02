"use client";

import { useState } from "react";
import { CalendarClock, Check, Copy, Mail, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { firstMessage, formatWhen } from "@/lib/sessions";
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

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-7 px-2 text-xs"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard blocked: the text is on screen to copy by hand.
        }
      }}
    >
      {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

// Once accepted: how to reach the other person, and a first message.
export function SessionContact({ request, me, other, fromMentor }) {
  if (request.status !== "accepted") return null;
  const message = firstMessage({
    fromName: me?.name,
    toName: other?.name,
    unitCode: request.unit_code,
    proposedTime: request.proposed_time,
    proposedPlace: request.proposed_place,
    fromMentor,
  });
  return (
    <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/[0.04] p-2.5">
      <p className="text-xs font-semibold">Accepted. Contact {other?.name?.split(" ")[0] ?? "them"} to confirm:</p>
      {request.contact?.hidden ? (
        <p className="text-xs text-muted-foreground">
          They use a real account, so their email is only shared with signed-in accounts, not demo ones.
        </p>
      ) : request.contact ? (
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <Mail className="size-3.5 text-primary" />
          <span className="font-medium">{request.contact.email}</span>
          {request.contact.demo && <span className="text-xs text-muted-foreground">(demo account, not a real inbox)</span>}
          <CopyButton text={request.contact.email} label="Copy email" />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Their contact isn&apos;t available right now.</p>
      )}
      <div className="rounded-md bg-background/70 p-2 text-xs">
        <p className="mb-1 font-medium text-muted-foreground">Suggested first message</p>
        <p className="whitespace-pre-wrap">{message}</p>
        <CopyButton text={message} label="Copy message" />
      </div>
    </div>
  );
}

// Mentee side, after an accepted session: 1 to 5 stars, did it help, comment.
export function RateSession({ request, menteeId, onSaved }) {
  const [rating, setRating] = useState(0);
  const [helped, setHelped] = useState(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (request.status !== "accepted") return null;
  if (typeof request.rating === "number") {
    return (
      <p className="text-xs text-muted-foreground">
        You rated this session <span className="text-primary" aria-label={`${request.rating} out of 5 stars`}>{stars(request.rating)}</span>
        {request.helped === true ? ", and it helped you get unstuck." : request.helped === false ? "." : ""}
      </p>
    );
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const result = await update({
      action: "rate",
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

  return (
    <form onSubmit={submit} className="space-y-2 rounded-lg border p-2.5">
      <p className="text-xs font-semibold">After your session: how did it go?</p>
      <div className="flex gap-0.5" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
            className="rounded p-0.5"
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
      <Button type="submit" size="sm" className="rounded-full" disabled={saving || rating === 0 || helped === null}>
        Send rating
      </Button>
    </form>
  );
}

// Mentor side, after accepting: did the session actually happen?
export function ConfirmHeld({ request, mentorId, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  if (request.status !== "accepted") return null;
  if (typeof request.held === "boolean") {
    return (
      <p className="text-xs text-muted-foreground">
        {request.held ? "You confirmed this session happened." : "You said this session didn't happen."}
      </p>
    );
  }
  async function answer(held) {
    setSaving(true);
    setError(null);
    const result = await update({ action: "held", id: request.id, mentor_id: mentorId, held });
    setSaving(false);
    if (!result.ok) setError(result.error);
    else onSaved?.();
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="font-semibold">After the session: did it happen?</span>
      <Button size="sm" variant="outline" className="h-7 rounded-full" disabled={saving} onClick={() => answer(true)}>
        Yes
      </Button>
      <Button size="sm" variant="ghost" className="h-7 rounded-full" disabled={saving} onClick={() => answer(false)}>
        No
      </Button>
      {error && <span className="w-full text-destructive">{error}</span>}
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
