"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function MessagesPage() {
  const { persona } = usePersona();
  const inbox = useInbox(persona.id);

  return (
    <div className="pb-16 md:pb-0">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Chat with mentors and students. No AI reads your messages.
        </p>
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

      <ul>
        {inbox.conversations.map((c) => (
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
