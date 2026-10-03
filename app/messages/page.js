"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarCheck, MessageCircle, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { UserAvatar } from "@/components/user-avatar";
import { usePersona } from "@/lib/persona-context";
import { useInbox } from "@/lib/use-inbox";
import { cn } from "@/lib/utils";

function timeAgo(iso) {
  const minutes = Math.max(0, (Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 60 / 24)}d`;
}

const TAB_LABELS = { all: "All", unread: "Unread", sessions: "Sessions" };
const isOngoing = (s) => ["pending", "active", "ending"].includes(s.state);

const STATE_CHIP = {
  pending: { label: "Waiting", className: "bg-muted text-muted-foreground" },
  active: { label: "In progress", className: "bg-primary/15 text-primary" },
  ending: { label: "Wrapping up", className: "bg-primary/15 text-primary" },
  completed: { label: "Ended", className: "bg-muted text-muted-foreground" },
  declined: { label: "Declined", className: "bg-muted text-muted-foreground" },
};

// Session rooms (each session's own conversation), for the Sessions tab.
function useSessions(personaId) {
  const [state, setState] = useState({ personaId: null, sessions: [] });
  useEffect(() => {
    if (!personaId) return;
    let cancelled = false;
    const load = () =>
      fetch(`/api/session-chat?profile_id=${encodeURIComponent(personaId)}`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled && data) setState({ personaId, sessions: data.sessions ?? [] });
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [personaId]);
  return state.personaId === personaId ? state.sessions : [];
}

function Row({ href, other, time, text, unread, chip }) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/50",
          unread && "bg-primary/[0.05]"
        )}
      >
        <UserAvatar profile={other} className="size-10" textClassName="text-xs" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm">
            <span className={cn("truncate", unread ? "font-bold" : "font-semibold")}>{other.name}</span>
            {chip}
            <span className="ml-auto shrink-0 text-xs text-muted-foreground">{timeAgo(time)}</span>
          </p>
          <p className={cn("truncate text-sm", unread ? "text-foreground" : "text-muted-foreground")}>{text}</p>
        </div>
        {unread && <span className="size-2.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
      </Link>
    </li>
  );
}

function MessagesInbox() {
  const { persona } = usePersona();
  const inbox = useInbox(persona.id);
  const sessions = useSessions(persona.role === "admin" ? null : persona.id);
  const [tab, setTab] = useState(useSearchParams().get("tab") === "sessions" ? "sessions" : "all");
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const byName = (other) => !needle || other.name.toLowerCase().includes(needle) || other.handle?.toLowerCase().includes(needle);
  const chats = inbox.conversations.filter((c) => (tab === "unread" ? c.unread : true) && byName(c.other));
  const rooms = sessions.filter((s) => byName(s.other));
  const counts = {
    unread: inbox.conversations.filter((c) => c.unread).length + sessions.filter((s) => s.unread).length,
    sessions: sessions.filter(isOngoing).length,
  };
  // All: your chats plus sessions still running; finished sessions live
  // only under Sessions. Unread: anything unread. Newest first.
  const feed = [
    ...chats.map((c) => ({ kind: "chat", item: c, time: c.last_message_at })),
    ...rooms
      .filter((s) => (tab === "unread" ? s.unread : isOngoing(s)))
      .map((s) => ({ kind: "room", item: s, time: s.last_message_at })),
  ].sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
  const hasAnything = persona.role !== "admin" && inbox.ready && !inbox.error && (inbox.conversations.length > 0 || sessions.length > 0);

  const roomRow = (s) => (
    <Row
      key={s.id}
      href={`/sessions/${s.id}`}
      other={s.other}
      time={s.last_message_at}
      unread={s.unread}
      text={`${s.last_sender_id === persona.id ? "You: " : ""}${s.last_text ?? ""}`}
      chip={
        <span className="flex shrink-0 items-center gap-1 text-xs">
          <CalendarCheck className="size-3.5 text-primary" />
          <span className="font-mono">{s.unit_code}</span>
          <span className={cn("rounded-full px-1.5 py-px text-[10px] font-medium", STATE_CHIP[s.state]?.className)}>
            {STATE_CHIP[s.state]?.label}
          </span>
        </span>
      }
    />
  );

  return (
    <div className="pb-16 md:pb-0">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Chat with anyone. Each mentoring session gets its own chat under Sessions. No AI reads your messages.
        </p>
        {hasAnything && (
          <>
            <label className="relative mt-3 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people"
                aria-label="Search conversations by name"
                className="h-10 w-full rounded-full border bg-muted/40 pl-9 pr-9 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background md:text-sm [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </label>
            <Tabs value={tab} onValueChange={setTab} className="-mx-4 -mb-3 mt-2 gap-0">
              <TabsList variant="line" className="w-full justify-start px-2">
                {Object.entries(TAB_LABELS).map(([key, label]) => (
                  <TabsTrigger key={key} value={key} className="flex-none px-3 py-2">
                    {label}
                    {counts[key] > 0 && (
                      <Badge variant={key === "unread" ? "default" : "secondary"} className="ml-1.5">
                        {counts[key]}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </>
        )}
      </div>

      {persona.role === "admin" && (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          The demo Moderator account doesn&apos;t send messages. Reported messages show in Review.
        </p>
      )}

      {persona.role !== "admin" && !inbox.ready && (
        <div className="space-y-3 px-4 py-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      )}

      {inbox.error && <p className="px-4 py-4 text-sm text-destructive">{inbox.error}</p>}

      {persona.role !== "admin" && inbox.ready && !inbox.error && !hasAnything && (
        <Empty className="my-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageCircle />
            </EmptyMedia>
            <EmptyTitle>No messages yet</EmptyTitle>
            <EmptyDescription>
              Open someone&apos;s profile or a mentor page and tap Message. When a mentor accepts your session
              request, the session gets its own chat under Sessions.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {hasAnything && tab === "sessions" && (
        <>
          {rooms.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {needle ? `No sessions with "${query.trim()}".` : "No sessions yet. Request one from a mentor's page."}
            </p>
          )}
          {[
            ["Ongoing", rooms.filter(isOngoing)],
            ["Finished", rooms.filter((s) => !isOngoing(s))],
          ].map(
            ([title, list]) =>
              list.length > 0 && (
                <section key={title}>
                  <h2 className="border-b bg-muted/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {title} <span className="font-normal">· {list.length}</span>
                  </h2>
                  <ul>{list.map(roomRow)}</ul>
                </section>
              )
          )}
        </>
      )}

      {hasAnything && tab !== "sessions" && (
        <>
          {feed.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {needle ? `No one called "${query.trim()}".` : tab === "unread" ? "You're all caught up." : "No chats yet."}
            </p>
          )}
          <ul>
            {feed.map(({ kind, item }) =>
              kind === "room" ? (
                roomRow(item)
              ) : (
                <Row
                  key={item.id}
                  href={`/messages/${item.other.id}`}
                  other={item.other}
                  time={item.last_message_at}
                  unread={item.unread}
                  text={`${item.last_sender_id === persona.id ? "You: " : ""}${item.last_text}`}
                />
              )
            )}
          </ul>
        </>
      )}
    </div>
  );
}

// useSearchParams (?tab=sessions) needs a Suspense boundary.
export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesInbox />
    </Suspense>
  );
}
