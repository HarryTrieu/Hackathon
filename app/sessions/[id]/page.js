"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarCheck, Lock, MessageCircle, ShieldAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportButton } from "@/components/report-button";
import { UserAvatar } from "@/components/user-avatar";
import { ChatItems, Composer } from "@/components/chat-thread";
import { EndSession, ReceivedRating, RequestEnd } from "@/components/session-details";
import { usePersona } from "@/lib/persona-context";
import { refreshInbox } from "@/lib/use-inbox";
import { firstMessage, sessionEvents, sessionState } from "@/lib/sessions";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

const POLL_MS = 4000;
const isDemo = (id) => /^p\d+$/.test(id ?? "");

const STATE_LABEL = {
  pending: "Waiting for an answer",
  active: "In progress",
  ending: "Wrapping up",
  completed: "Ended",
  declined: "Declined",
};

async function post(url, method, body) {
  const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  return res.ok ? { ok: true, json } : { ok: false, error: json.error ?? "Something went wrong." };
}

// Accept / decline, ending and rating: whatever this session needs next.
function SessionActions({ session, me, other, iAmMentor, onChanged, onAccepted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const state = sessionState(session);

  async function decide(action) {
    setBusy(true);
    setError(null);
    const result = await post("/api/session-request", "PATCH", { action, id: session.id, mentor_id: me.id });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    toast(action === "accept" ? "Session accepted. Say hi to get started." : "Request declined");
    if (action === "accept") onAccepted();
    onChanged();
  }

  return (
    <div className="space-y-2 border-b bg-primary/[0.04] px-4 py-3 text-sm">
      {state === "pending" && iAmMentor && (
        <>
          <p className="text-xs text-muted-foreground">
            Accept to open this session. You&apos;ll write first to arrange a time and place.
          </p>
          <div className="flex gap-2">
            <Button size="sm" className="rounded-full" disabled={busy} onClick={() => decide("accept")}>
              Accept and reply
            </Button>
            <Button size="sm" variant="outline" className="rounded-full" disabled={busy} onClick={() => decide("decline")}>
              Decline
            </Button>
          </div>
        </>
      )}
      {state === "pending" && !iAmMentor && (
        <p className="text-xs text-muted-foreground">
          Once {other.name.split(" ")[0]} accepts, the session opens here and they&apos;ll message you to arrange a time
          and place.
        </p>
      )}
      {state !== "pending" && state !== "declined" &&
        (iAmMentor ? (
          <>
            <ReceivedRating request={session} />
            <RequestEnd request={session} mentorId={me.id} menteeName={other.name} onSaved={onChanged} />
          </>
        ) : (
          <EndSession request={session} menteeId={me.id} mentorName={other.name} onSaved={onChanged} />
        ))}
      {state === "declined" && <p className="text-xs text-muted-foreground">This request was declined.</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Why you can't type, and where to go instead.
function Closed({ session, other, iAmMentor, blocked }) {
  const state = sessionState(session);
  const first = other.name.split(" ")[0];
  if (blocked) return <p className="text-sm text-muted-foreground">You can&apos;t message this person.</p>;
  if (state === "pending") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="size-4" />
        {iAmMentor ? "Accept the request to start the session chat." : `The chat opens when ${first} accepts.`}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Lock className="size-4" />
      <span className="flex-1">
        {state === "completed" ? "This session has ended, so its chat is closed." : "This request was declined."}
        {!iAmMentor && " Want more help? Request another session."}
      </span>
      {!iAmMentor && (
        <Link
          href={`/mentors/${session.unit_code}/${session.mentor_id}`}
          className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
        >
          Request another session
        </Link>
      )}
      <Link href={`/messages/${other.id}`} className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-full")}>
        <MessageCircle data-icon="inline-start" />
        Message {first}
      </Link>
    </div>
  );
}

function SessionRoom() {
  const { id } = useParams();
  const { persona } = usePersona();
  const draftParam = useSearchParams().get("draft");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [text, setText] = useState(draftParam ?? "");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const endRef = useRef(null);
  const wanted = useRef(null);
  const meId = persona.id;

  async function load(who = meId) {
    wanted.current = who;
    try {
      const res = await fetch(`/api/session-chat?profile_id=${encodeURIComponent(who)}&id=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (wanted.current !== who) return;
      if (!res.ok) setError(json.error ?? "Could not load this session.");
      else {
        setError(null);
        setData({ ...json, meId: who });
      }
    } catch {
      if (wanted.current === who) setError("Could not reach the server.");
    }
  }

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (alive) await load(meId);
    };
    tick().then(refreshInbox);
    const timer = setInterval(tick, POLL_MS);
    // A realtime ping (components/realtime-listener.jsx): reload right away.
    window.addEventListener("sodu:changed", tick);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("sodu:changed", tick);
    };
    // load reads meId and id; re-run when either changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meId, id]);

  const current = data?.meId === meId ? data : null;
  const count = current?.messages.length ?? 0;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [count]);

  async function send(event) {
    event?.preventDefault();
    const clean = text.trim();
    if (!clean || sending) return;
    setSending(true);
    setSendError(null);
    const result = await post("/api/session-chat", "POST", { profile_id: meId, session_id: id, text: clean });
    setSending(false);
    if (!result.ok) return setSendError(result.error);
    setText("");
    setData((prev) => (prev ? { ...prev, messages: [...prev.messages, result.json.message] } : prev));
    refreshInbox();
  }

  async function remove(message) {
    if (!window.confirm("Delete this message for everyone? Moderators can still see it if this session is reported.")) return;
    const result = await post("/api/session-chat", "POST", { profile_id: meId, message_id: message.id, action: "delete" });
    if (!result.ok) return setSendError(result.error);
    setData((prev) =>
      prev ? { ...prev, messages: prev.messages.map((m) => (m.id === message.id ? { ...m, text: null, deleted: true } : m)) } : prev
    );
  }

  if (error && !current) {
    return (
      <div className="space-y-3 px-4 py-8 text-sm">
        <p className="text-destructive">{error}</p>
        <Link href="/messages?tab=sessions" className="text-primary hover:underline">
          Back to your sessions
        </Link>
      </div>
    );
  }

  const session = current?.session;
  const other = current?.other;
  const iAmMentor = session?.mentor_id === meId;
  const state = session ? sessionState(session) : null;
  // The mentee's request opens the thread, as their first message.
  const items = current
    ? [
        {
          id: "request",
          sender_id: session.mentee_id,
          text: session.message,
          created_at: session.created_at,
          label: "Session request",
        },
        ...sessionEvents(session, meId, other.name),
        ...current.messages,
      ]
    : [];

  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col pb-16 md:min-h-svh md:pb-0">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background md:bg-background/95 px-4 py-2.5 md:backdrop-blur">
        <Link href="/messages?tab=sessions" aria-label="Back to sessions" className="rounded-full p-1.5 transition-colors hover:bg-muted">
          <ArrowLeft className="size-4" />
        </Link>
        {current ? (
          <Link href={`/profile/${other.id}`} className="flex min-w-0 flex-1 items-center gap-2">
            <UserAvatar profile={other} className="size-8" textClassName="text-xs" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{other.name}</span>
              <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <CalendarCheck className="size-3.5 text-primary" />
                <span className="font-mono">{session.unit_code}</span> session ·{" "}
                <span className={cn(state === "active" || state === "ending" ? "text-primary" : "")}>{STATE_LABEL[state]}</span>
              </span>
            </span>
          </Link>
        ) : (
          <Skeleton className="h-8 flex-1 rounded-lg" />
        )}
        {current && (
          <ReportButton
            targetType="chat"
            targetId={`session:${session.id}`}
            formClassName="absolute right-4 top-12 z-20 w-72 bg-popover shadow-lg"
          />
        )}
      </div>

      {current && (isDemo(session.mentor_id) || isDemo(session.mentee_id)) && (
        <p className="flex items-start gap-1.5 border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          <ShieldAlert className="mt-px size-3.5 shrink-0" />
          This session involves a demo account that anyone can open, so others may read it. Don&apos;t share personal
          details.
        </p>
      )}

      {current && (
        <SessionActions
          session={session}
          me={persona}
          other={other}
          iAmMentor={iAmMentor}
          onChanged={() => load(meId)}
          onAccepted={() =>
            setText(firstMessage({ fromName: persona.name, toName: other.name, unitCode: session.unit_code, fromMentor: true }))
          }
        />
      )}

      <div className="flex-1 space-y-2 px-4 py-4">
        {!current && <Skeleton className="h-24 w-full rounded-xl" />}
        {current && <ChatItems items={items} meId={meId} onDelete={current.can_send ? remove : null} />}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-16 border-t bg-background md:bg-background/95 px-4 py-3 md:backdrop-blur md:bottom-0">
        {current &&
          (current.can_send ? (
            <Composer
              value={text}
              onChange={setText}
              onSend={send}
              sending={sending}
              placeholder={`Message ${other.name.split(" ")[0]} about this session...`}
            />
          ) : (
            <Closed session={session} other={other} iAmMentor={iAmMentor} blocked={current.blocked} />
          ))}
        {sendError && <p className="mt-1 text-xs text-destructive">{sendError}</p>}
      </div>
    </div>
  );
}

// useSearchParams (the ?draft= opener) needs a Suspense boundary.
export default function SessionPage() {
  return (
    <Suspense fallback={null}>
      <SessionRoom />
    </Suspense>
  );
}
