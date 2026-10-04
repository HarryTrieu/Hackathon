"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Ban, CalendarCheck, CalendarPlus, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportButton } from "@/components/report-button";
import { UserAvatar } from "@/components/user-avatar";
import { ChatItems, Composer } from "@/components/chat-thread";
import { SessionPrompt, useMentorListings, useSessionPromptHidden } from "@/components/session-prompt";
import { usePersona } from "@/lib/persona-context";
import { refreshInbox } from "@/lib/use-inbox";
import { isOpenSession, sessionState } from "@/lib/sessions";
import { roleLabel } from "@/lib/seed";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

const POLL_MS = 4000;
const isDemo = (id) => /^p\d+$/.test(id ?? "");

// Sessions between you two live in their own rooms; open ones are linked
// above the chat.
function SessionLinks({ sessions, meId }) {
  const open = sessions.filter(isOpenSession);
  if (open.length === 0) return null;
  return (
    <div className="space-y-1.5 border-b bg-primary/[0.04] px-4 py-2.5">
      {open.map((s) => {
        const state = sessionState(s);
        return (
          <Link
            key={s.id}
            href={`/sessions/${s.id}`}
            className="group flex items-center gap-2 rounded-lg text-sm transition-colors hover:text-primary"
          >
            <CalendarCheck className="size-4 text-primary" />
            <span className="font-semibold">
              {s.mentor_id === meId ? "Session you're mentoring" : "Your session"} ·{" "}
              <span className="font-mono">{s.unit_code}</span>
            </span>
            <span className="text-muted-foreground">
              · {state === "pending" ? (s.mentor_id === meId ? "needs your answer" : "waiting for an answer") : "in progress"}
            </span>
            <span className="ml-auto flex items-center gap-0.5 text-xs font-medium text-primary">
              Open session
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}

// A brand-new chat: who they are, and a few openers that fill the composer.
function EmptyChat({ me, other, onPick, canSend }) {
  const first = other.name.split(" ")[0];
  const mine = new Set((me.units ?? []).map((u) => u.code));
  const theirs = (other.units ?? []).map((u) => u.code);
  const shared = theirs.find((c) => mine.has(c));
  const openers = [
    shared ? `Hi ${first}! We both have ${shared}. How are you finding it?` : `Hi ${first}! Nice to meet you on Sodu.`,
    other.role === "mentor"
      ? `Hi ${first}, what helped you most when you did ${theirs[0] ?? "your units"}?`
      : `Hi ${first}, which units are you taking this trimester?`,
    `Hey ${first}, I saw your post and wanted to say hi.`,
  ];
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-2 py-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
      <UserAvatar profile={other} className="size-16" textClassName="text-lg" />
      <p className="font-semibold">{other.name}</p>
      <p className="text-xs text-muted-foreground">
        {roleLabel(other.role)} · {other.course}
        {theirs.length > 0 && <> · {theirs.slice(0, 3).join(", ")}</>}
      </p>
      {canSend && (
        <>
          <p className="mt-2 text-sm text-muted-foreground">Start the conversation:</p>
          <div className="flex flex-col items-center gap-1.5">
            {openers.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => onPick(o)}
                className="rounded-full border px-3 py-1.5 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
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
  const mentorListings = useMentorListings(otherId);
  const [promptHidden, setPromptHidden] = useSessionPromptHidden(otherId);

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
    // A realtime ping (components/realtime-listener.jsx): reload right away.
    window.addEventListener("sodu:changed", tick);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("sodu:changed", tick);
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
      toast("Message deleted");
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
    toast(block ? `Blocked ${data.other.name.split(" ")[0]}` : `Unblocked ${data.other.name.split(" ")[0]}`);
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
  // "<name> is a mentor": when they have a live listing and you have no open
  // session with them yet.
  const canBook =
    canSend && other?.role === "mentor" && mentorListings.length > 0 && !data.sessions.some(isOpenSession);

  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col pb-16 md:min-h-svh md:pb-0">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background md:bg-background/95 px-4 py-2.5 md:backdrop-blur">
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
            {canBook && promptHidden && (
              <Button
                size="icon-sm"
                variant="ghost"
                className="rounded-full text-primary"
                aria-label={`Book a session with ${other.name.split(" ")[0]}`}
                title="Book a session"
                onClick={() => setPromptHidden(false)}
              >
                <CalendarPlus />
              </Button>
            )}
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

      {data && <SessionLinks sessions={data.sessions} meId={meId} />}
      {canBook && !promptHidden && (
        <SessionPrompt me={persona} other={other} listings={mentorListings} onHide={() => setPromptHidden(true)} />
      )}

      <div className="flex-1 space-y-2 px-4 py-4">
        {!data && !error && <Skeleton className="h-24 w-full rounded-xl" />}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {data?.messages.length === 0 && (
          <EmptyChat me={persona} other={data.other} onPick={setText} canSend={canSend} />
        )}
        {data && <ChatItems items={data.messages} meId={meId} onDelete={remove} />}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-16 border-t bg-background md:bg-background/95 px-4 py-3 md:backdrop-blur md:bottom-0">
        {data?.blocked_me && <p className="text-sm text-muted-foreground">You can&apos;t message this person.</p>}
        {data?.blocked_by_me && (
          <p className="text-sm text-muted-foreground">You blocked {other.name.split(" ")[0]}. Unblock to send messages.</p>
        )}
        {canSend && (
          <Composer
            value={text}
            onChange={setText}
            onSend={send}
            sending={sending}
            placeholder={`Message ${other.name.split(" ")[0]}...`}
          />
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
