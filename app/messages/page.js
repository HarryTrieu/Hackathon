"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Search, X } from "lucide-react";
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

const TABS = {
  all: { label: "All", match: () => true },
  unread: { label: "Unread", match: (c) => c.unread },
  // Chats with someone you've sent or received a session request with.
  sessions: { label: "Sessions", match: (c) => Boolean(c.session) },
};

const EMPTY_TAB = {
  unread: "You're all caught up.",
  sessions: "No chats about a mentoring session yet. Request one from a mentor's page.",
};

export default function MessagesPage() {
  const { persona } = usePersona();
  const inbox = useInbox(persona.id);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const shown = inbox.conversations.filter(
    (c) =>
      TABS[tab].match(c) &&
      (!needle || c.other.name.toLowerCase().includes(needle) || c.other.handle?.toLowerCase().includes(needle))
  );
  const counts = {
    unread: inbox.conversations.filter(TABS.unread.match).length,
    sessions: inbox.conversations.filter(TABS.sessions.match).length,
  };
  const hasChats = persona.role !== "admin" && inbox.ready && !inbox.error && inbox.conversations.length > 0;

  return (
    <div className="pb-16 md:pb-0">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Chat with mentors and students. No AI reads your messages.
        </p>
        {hasChats && (
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
                {Object.entries(TABS).map(([key, { label }]) => (
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

      {persona.role !== "admin" && inbox.ready && !inbox.error && inbox.conversations.length === 0 && (
        <Empty className="my-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageCircle />
            </EmptyMedia>
            <EmptyTitle>No messages yet</EmptyTitle>
            <EmptyDescription>
              Open someone&apos;s profile or a mentor page and tap Message. When a mentor accepts your session
              request, they&apos;ll message you here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {hasChats && shown.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          {needle ? `No one called "${query.trim()}"${tab === "all" ? "" : ` in ${TABS[tab].label}`}.` : EMPTY_TAB[tab]}
        </p>
      )}

      <ul>
        {shown.map((c) => (
          <li key={c.id}>
            <Link
              href={`/messages/${c.other.id}`}
              className={cn(
                "flex items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/50",
                c.unread && "bg-primary/[0.05]"
              )}
            >
              <UserAvatar profile={c.other} className="size-10" textClassName="text-xs" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm">
                  <span className={cn("truncate", c.unread ? "font-bold" : "font-semibold")}>{c.other.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(c.last_message_at)}</span>
                </p>
                <p className={cn("truncate text-sm", c.unread ? "text-foreground" : "text-muted-foreground")}>
                  {c.last_sender_id === persona.id ? "You: " : ""}
                  {c.last_text}
                </p>
              </div>
              {c.unread && <span className="size-2.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
