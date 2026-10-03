"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { Spinner } from "@/components/ui/spinner";
import { UserAvatar } from "@/components/user-avatar";
import { usePersona } from "@/lib/persona-context";
import { getSeedReplies } from "@/lib/seed";
import { authorOf } from "@/lib/authors";

function relativeTime(iso, now) {
  const hours = (now - new Date(iso).getTime()) / 3600_000;
  if (hours < 1) return "now";
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

// Flat reply thread under a post. Fetches on mount (the panel only mounts
// when opened). Falls back to seed replies when there is no database, and
// keeps replies posted this session in local state either way.
export function RepliesPanel({ postId }) {
  const { persona } = usePersona();
  const [dbReplies, setDbReplies] = useState(null);
  const [sessionReplies, setSessionReplies] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState(null);
  // Snapshot the clock once so render stays pure (react-hooks/purity).
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/replies?post_id=${encodeURIComponent(postId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.replies) setDbReplies(data.replies);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const base = dbReplies ?? getSeedReplies(postId).map((r) => ({
    ...r,
    created_at: new Date(now - r.hours_ago * 3600_000).toISOString(),
  }));
  const baseIds = new Set(base.map((r) => r.id));
  const replies = [...base, ...sessionReplies.filter((r) => !baseIds.has(r.id))].filter((r) => !removed.includes(r.id));

  async function remove(reply) {
    if (!window.confirm("Delete your reply?")) return;
    try {
      const res = await fetch("/api/replies", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: reply.id, author_id: persona.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setNote(data.error ?? "Could not delete the reply.");
      setRemoved((prev) => [...prev, reply.id]);
      toast("Reply deleted");
    } catch {
      setNote("Could not reach the server.");
    }
  }

  async function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setNote(null);
    try {
      const res = await fetch("/api/replies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ post_id: postId, author_id: persona.id, text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNote(data.error ?? "Could not send the reply.");
        return;
      }
      setSessionReplies((prev) => [...prev, data.reply]);
      setDraft("");
      if (!data.persisted) setNote("Session only: add Supabase keys to save replies.");
    } catch {
      setNote("Could not send the reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-2 space-y-3 border-l-2 border-muted pl-4">
      {replies.map((reply) => {
        const author = authorOf(reply);
        if (!author) return null;
        return (
          <div key={reply.id} className="group flex gap-2.5">
            <Link href={`/profile/${author.id}`} className="shrink-0">
              <UserAvatar profile={author} className="size-7" textClassName="text-[10px]" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-sm">
                <Link href={`/profile/${author.id}`} className="font-bold hover:underline">
                  {author.name}
                </Link>{" "}
                <span className="text-muted-foreground">
                  · {relativeTime(reply.created_at, now)}
                </span>
                {reply.author_id === persona.id && (
                  <button
                    type="button"
                    onClick={() => remove(reply)}
                    aria-label="Delete your reply"
                    title="Delete your reply"
                    className="ml-auto rounded-full p-1 text-muted-foreground opacity-60 transition hover:bg-muted hover:text-destructive hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{reply.text}</p>
            </div>
          </div>
        );
      })}
      {replies.length === 0 && (
        <p className="text-sm text-muted-foreground">No replies yet. Start the thread.</p>
      )}

      <form onSubmit={send} className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Reply as ${persona.name.split(" ")[0]}...`}
          maxLength={1000}
          className="h-9 min-w-0 flex-1 rounded-full border bg-transparent px-3.5 text-sm outline-none transition-colors focus:border-primary/50"
        />
        <Button type="submit" size="sm" disabled={!draft.trim() || sending} className="rounded-full">
          {sending ? <Spinner /> : "Reply"}
        </Button>
      </form>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
