"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { UserAvatar } from "@/components/user-avatar";
import { ReportButton } from "@/components/report-button";
import { MAX_CHATS_PER_DAY, introMessage, sampleQuestions } from "@/lib/mentors";
import { cn } from "@/lib/utils";

// Mount with key={persona.id + mentor.id} so switching persona resets it.
export function MentorChat({ mentor, persona, unitName }) {
  const first = mentor.profile.name.split(" ")[0];
  const [messages, setMessages] = useState(() => [
    { role: "mentor", text: introMessage(mentor, mentor.profile, unitName) },
  ]);
  const [remaining, setRemaining] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailed, setLastFailed] = useState(null);
  const [mocked, setMocked] = useState(false);
  const endRef = useRef(null);
  const isSelf = persona.id === mentor.profile_id;

  useEffect(() => {
    fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "preview_started", listing_id: mentor.id, mentee_id: persona.id }),
    }).catch(() => {});
  }, [mentor.id, persona.id]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/mentor-chat?listing_id=${mentor.id}&mentee_id=${persona.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setRemaining(data?.remaining ?? MAX_CHATS_PER_DAY);
      })
      .catch(() => !cancelled && setRemaining(MAX_CHATS_PER_DAY));
    return () => {
      cancelled = true;
    };
  }, [mentor.id, persona.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  async function send(text) {
    const clean = text.trim();
    if (!clean || sending || remaining === 0) return;
    const history = messages;
    setMessages((prev) => [...prev, { role: "mentee", text: clean }]);
    setDraft("");
    setSending(true);
    setError(null);
    setLastFailed(null);
    try {
      const res = await fetch("/api/mentor-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listing_id: mentor.id, mentee_id: persona.id, history, text: clean }),
      });
      const data = await res.json();
      if (typeof data.remaining === "number") setRemaining(data.remaining);
      if (!res.ok) {
        setError(data.error ?? "The AI is slow or unavailable.");
        setLastFailed(clean);
        return;
      }
      setMocked(Boolean(data.mocked));
      setMessages((prev) => [...prev, { role: "mentor", text: data.reply }]);
    } catch {
      setError("The AI is slow or unavailable.");
      setLastFailed(clean);
    } finally {
      setSending(false);
    }
  }

  const asked = new Set(messages.filter((m) => m.role === "mentee").map((m) => m.text));
  const samples = sampleQuestions(mentor).filter((q) => !asked.has(q));
  const outOfMessages = remaining === 0;

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Bot className="size-4 text-primary" />
          Chat with {first}&apos;s AI
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {remaining === null ? "..." : `${remaining} of ${MAX_CHATS_PER_DAY} messages left today`}
          </span>
          <ReportButton targetType="chat" targetId={mentor.id} />
        </div>
      </div>
      <p className="border-b bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground">
        AI preview trained on {first}&apos;s own answers, not {first} in person.
        {isSelf && " This is your AI: this is what mentees see."}
        {mocked && " Offline replies (AI unavailable)."}
      </p>

      <div className="max-h-[420px] space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2", m.role === "mentee" && "justify-end")}>
            {m.role === "mentor" && (
              <UserAvatar profile={mentor.profile} className="size-7" textClassName="text-[10px]" />
            )}
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
        {sending && (
          <p className="flex items-center gap-2 pl-9 text-sm text-muted-foreground">
            <Spinner /> {first}&apos;s AI is typing...
          </p>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 px-4 pb-2 text-sm text-destructive">
          <p>{error}</p>
          {lastFailed && (
            <Button size="sm" variant="outline" onClick={() => send(lastFailed)}>
              Try again
            </Button>
          )}
        </div>
      )}

      {outOfMessages ? (
        <div className="space-y-1 border-t bg-primary/[0.04] px-4 py-3 text-sm">
          <p className="font-medium">That&apos;s your {MAX_CHATS_PER_DAY} messages with {first} for today.</p>
          <p className="text-muted-foreground">
            Liked the vibe? Request a session below. Not a fit?{" "}
            <Link href={`/mentors/${mentor.unit_code}`} className="text-primary hover:underline">
              Try another mentor
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-2 border-t px-4 py-3">
          {samples.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {samples.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  disabled={sending}
                  className="rounded-full border px-2.5 py-1 text-xs transition-colors duration-300 hover:border-primary/40 hover:bg-primary/[0.05] disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Ask ${first}'s AI anything about ${mentor.unit_code}...`}
              maxLength={500}
              className="h-10 min-w-0 flex-1 rounded-full border bg-transparent px-4 text-sm outline-none transition-colors focus:border-primary/50"
            />
            <Button
              type="submit"
              size="icon-lg"
              className="rounded-full"
              disabled={!draft.trim() || sending || remaining === null}
              aria-label="Send"
            >
              <Send />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
