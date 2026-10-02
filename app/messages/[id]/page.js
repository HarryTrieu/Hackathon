"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Ban, CalendarCheck, Send, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportButton } from "@/components/report-button";
import { UserAvatar } from "@/components/user-avatar";
import { ConfirmHeld, RateSession, ReceivedRating } from "@/components/session-details";
import { usePersona } from "@/lib/persona-context";
import { refreshInbox } from "@/lib/use-inbox";
import { firstMessage } from "@/lib/sessions";
import { roleLabel } from "@/lib/seed";
import { cn } from "@/lib/utils";

const POLL_MS = 4000;
const isDemo = (id) => /^p\d+$/.test(id ?? "");

function timeOf(iso) {
  return new Date(iso).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
}

// Session requests between the two of you, shown above the chat.
function SessionPanel({ sessions, me, other, onChanged, onAccepted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const current = sessions.find((s) => s.status === "sent" || s.status === "accepted");
  if (!current) return null;
  const iAmMentor = current.mentor_id === me.id;

  async function decide(action) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/session-request", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, id: current.id, mentor_id: me.id }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not update the request.");
      return;
    }
    if (action === "accept") onAccepted(current);
    onChanged();
  }

  return (
    <div className="space-y-2 border-b bg-primary/[0.04] px-4 py-3 text-sm">
      <p className="flex items-center gap-2 font-semibold">
        <CalendarCheck className="size-4 text-primary" />
        {iAmMentor ? `${other.name.split(" ")[0]} asked you for a ` : "Your "}
        <span className="font-mono">{current.unit_code}</span> session
        <span className="font-normal text-muted-foreground">
          · {current.status === "sent" ? "waiting for an answer" : "accepted"}
        </span>
      </p>
      {current.status === "sent" && iAmMentor && (
        <div className="flex gap-2">
          <Button size="sm" className="rounded-full" disabled={busy} onClick={() => decide("accept")}>
            Accept and reply
          </Button>
          <Button size="sm" variant="outline" className="rounded-full" disabled={busy} onClick={() => decide("decline")}>
            Decline
          </Button>
        </div>
      )}
      {current.status === "sent" && !iAmMentor && (
        <p className="text-xs text-muted-foreground">
          Once {other.name.split(" ")[0]} accepts, they&apos;ll message you here to arrange a time and place.
        </p>
      )}
      {current.status === "accepted" &&
        (iAmMentor ? (
          <>
            <ReceivedRating request={current} />
            <ConfirmHeld request={current} mentorId={me.id} onSaved={onChanged} />
          </>
        ) : (
          <RateSession request={current} menteeId={me.id} onSaved={onChanged} />
        ))}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Conversation() {
  const { id: otherId } = useParams();
  const { persona } = usePersona();
  const draftParam = useSearchParams().get("draft");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [text, setText] = useState(draftParam ?? "");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const endRef = useRef(null);
  const meId = persona.id;

  async function load() {
    try {
      const res = await fetch(
        `/api/messages?profile_id=${encodeURIComponent(meId)}&with=${encodeURIComponent(otherId)}`,
        { cache: "no-store" }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error ?? "Could not load this conversation.");
      else {
        setError(null);
        setData(json);
      }
    } catch {
      setError("Could not reach the server.");
    }
  }

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (alive) await load();
    };
    tick().then(refreshInbox);
    const timer = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
    // load reads meId and otherId; re-run when either changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meId, otherId]);

  const count = data?.messages.length ?? 0;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [count]);

  async function send(event) {
    event?.preventDefault();
    const clean = text.trim();
    if (!clean || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile_id: meId, to_id: otherId, text: clean }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSendError(json.error ?? "Could not send.");
        return;
      }
      setText("");
      setData((prev) => (prev ? { ...prev, messages: [...prev.messages, json.message] } : prev));
      refreshInbox();
    } catch {
      setSendError("Could not reach the server.");
    } finally {
      setSending(false);
    }
  }

  // Delete for everyone: the bubble becomes "This message was deleted".
  async function remove(message) {
    if (!window.confirm("Delete this message for everyone? Moderators can still see it if this chat is reported.")) return;
    setSendError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile_id: meId, message_id: message.id, action: "delete" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSendError(json.error ?? "Could not delete the message.");
        return;
      }
      setData((prev) =>
        prev
          ? { ...prev, messages: prev.messages.map((m) => (m.id === message.id ? { ...m, text: null, deleted: true } : m)) }
          : prev
      );
      refreshInbox();
    } catch {
      setSendError("Could not reach the server.");
    }
  }

  async function setBlocked(block) {
    if (block && !window.confirm(`Block ${data.other.name}? They won't be able to message you.`)) return;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profile_id: meId, other_id: otherId, action: block ? "block" : "unblock" }),
    });
    load();
  }

  if (persona.role === "admin") {
    return <p className="px-4 py-8 text-sm text-muted-foreground">The demo Moderator account doesn&apos;t send messages.</p>;
  }
  if (meId === otherId) {
    return <p className="px-4 py-8 text-sm text-muted-foreground">You can&apos;t message yourself.</p>;
  }

  const other = data?.other;
  const demoChat = isDemo(meId) || isDemo(otherId);
  const canSend = data && !data.blocked_me && !data.blocked_by_me;

  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col pb-16 md:min-h-svh md:pb-0">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-4 py-2.5 backdrop-blur">
        <Link href="/messages" aria-label="Back to messages" className="rounded-full p-1.5 transition-colors hover:bg-muted">
          <ArrowLeft className="size-4" />
        </Link>
        {other ? (
          <Link href={`/profile/${other.id}`} className="flex min-w-0 flex-1 items-center gap-2">
            <UserAvatar profile={other} className="size-8" textClassName="text-xs" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{other.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {roleLabel(other.role)} · {other.course}
              </span>
            </span>
          </Link>
        ) : (
          <Skeleton className="h-8 flex-1 rounded-lg" />
        )}
        {other && (
          <>
            <ReportButton targetType="chat" targetId={`dm:${otherId}`} formClassName="absolute right-4 top-12 z-20 w-72 bg-popover shadow-lg" />
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground"
              onClick={() => setBlocked(!data.blocked_by_me)}
            >
              <Ban data-icon="inline-start" />
              {data.blocked_by_me ? "Unblock" : "Block"}
            </Button>
          </>
        )}
      </div>

      {demoChat && (
        <p className="flex items-start gap-1.5 border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          <ShieldAlert className="mt-px size-3.5 shrink-0" />
          This chat involves a demo account that anyone can open, so others may read it. Don&apos;t share personal details.
        </p>
      )}

      {data && (
        <SessionPanel
          sessions={data.sessions}
          me={persona}
          other={data.other}
          onChanged={load}
          onAccepted={(req) =>
            setText(
              firstMessage({ fromName: persona.name, toName: data.other.name, unitCode: req.unit_code, fromMentor: true })
            )
          }
        />
      )}

      <div className="flex-1 space-y-2 px-4 py-4">
        {!data && !error && <Skeleton className="h-24 w-full rounded-xl" />}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {data?.messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No messages yet. Say hi.</p>
        )}
        {data?.messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={cn("group flex items-center gap-1", mine ? "justify-end" : "justify-start")}>
              {mine && !m.deleted && (
                <button
                  type="button"
                  onClick={() => remove(m)}
                  aria-label="Delete message"
                  title="Delete message"
                  className="rounded-full p-1.5 text-muted-foreground opacity-60 transition hover:bg-muted hover:text-destructive hover:opacity-100 md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                  m.deleted
                    ? "border border-dashed bg-transparent text-muted-foreground"
                    : mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                )}
              >
                {m.deleted ? (
                  <p className="italic">{mine ? "You deleted this message" : "This message was deleted"}</p>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                )}
                <p
                  className={cn(
                    "mt-0.5 text-[10px]",
                    mine && !m.deleted ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {timeOf(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-16 border-t bg-background/95 px-4 py-3 backdrop-blur md:bottom-0">
        {data?.blocked_me && <p className="text-sm text-muted-foreground">You can&apos;t message this person.</p>}
        {data?.blocked_by_me && (
          <p className="text-sm text-muted-foreground">You blocked {other.name.split(" ")[0]}. Unblock to send messages.</p>
        )}
        {canSend && (
          <form onSubmit={send} className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) send(e);
              }}
              rows={text.includes("\n") || text.length > 80 ? 3 : 1}
              maxLength={2000}
              placeholder={`Message ${other.name.split(" ")[0]}...`}
              className="min-h-10 flex-1 resize-none rounded-2xl border bg-transparent px-4 py-2 text-base outline-none focus:border-primary/50 md:text-sm"
            />
            <Button type="submit" size="icon-lg" className="rounded-full" disabled={!text.trim() || sending} aria-label="Send">
              <Send />
            </Button>
          </form>
        )}
        {sendError && <p className="mt-1 text-xs text-destructive">{sendError}</p>}
      </div>
    </div>
  );
}

// useSearchParams (the ?draft= opener) needs a Suspense boundary.
export default function ConversationPage() {
  return (
    <Suspense fallback={null}>
      <Conversation />
    </Suspense>
  );
}
