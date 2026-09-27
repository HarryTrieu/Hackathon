"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  BellOff,
  CalendarPlus,
  CheckCircle2,
  MessageCircle,
  ThumbsUp,
  Undo2,
  X,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { UserAvatar } from "@/components/user-avatar";
import { usePersona } from "@/lib/persona-context";
import { getProfile } from "@/lib/seed";
import {
  canClearRequest,
  clearNotifications,
  markSeen,
  requestKey,
  restoreNotifications,
  useNotifications,
} from "@/lib/use-notifications";
import { cn } from "@/lib/utils";

function timeAgo(iso) {
  const minutes = Math.max(0, (Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 60 / 24)}d`;
}

const STATUS_BADGE = {
  sent: { label: "Pending", variant: "outline" },
  accepted: { label: "Accepted", variant: "default" },
  declined: { label: "Declined", variant: "secondary" },
};

function StatusBadge({ status }) {
  const s = STATUS_BADGE[status] ?? STATUS_BADGE.sent;
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

// Count + "Clear all", or "Cleared N" + Undo right after a clear.
function ClearBar({ count, noun, undoKeys, onClear, onUndo }) {
  if (count === 0 && !undoKeys) return null;
  const plural = (n) => `${n} ${noun}${n === 1 ? "" : "s"}`;
  return (
    <div className="flex items-center justify-between gap-2 border-b px-4 py-2 text-sm">
      <span className="text-muted-foreground">
        {undoKeys ? `Cleared ${plural(undoKeys.length)}.` : plural(count)}
      </span>
      <div className="flex gap-1">
        {undoKeys && (
          <Button size="sm" variant="ghost" className="rounded-full" onClick={onUndo}>
            <Undo2 data-icon="inline-start" />
            Undo
          </Button>
        )}
        {count > 0 && (
          <Button size="sm" variant="ghost" className="rounded-full text-muted-foreground" onClick={onClear}>
            <BellOff data-icon="inline-start" />
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}

// ✕ on a card or row: always visible on touch screens, on hover for mouse.
function ClearButton({ label, onClick }) {
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      aria-label={label}
      onClick={onClick}
      className="absolute top-2.5 right-2 rounded-full text-muted-foreground transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
    >
      <X />
    </Button>
  );
}

// One row in the All tab: icon, who did what, and a short quote.
function describe(n, meId) {
  const actor = n.actor_id ? getProfile(n.actor_id) : null;
  const name = <span className="font-semibold">{actor?.name ?? "Someone"}</span>;
  switch (n.type) {
    case "like":
      return {
        icon: ThumbsUp,
        href: `/profile/${meId}`,
        body: <>{name} found your post helpful</>,
        quote: n.post_excerpt,
      };
    case "reply":
      return {
        icon: MessageCircle,
        href: `/profile/${meId}`,
        body: <>{name} replied to your post: &ldquo;{n.text}&rdquo;</>,
        quote: n.post_excerpt,
      };
    case "request_received":
      return {
        icon: CalendarPlus,
        tab: "requests",
        body: (
          <>
            {name} requested a session · <span className="font-mono">{n.unit_code}</span>
          </>
        ),
        quote: n.text,
      };
    case "request_update":
      return {
        icon: n.status === "accepted" ? CheckCircle2 : XCircle,
        tab: "requests",
        body: (
          <>
            {name} {n.status === "accepted" ? "accepted" : "declined"} your session request ·{" "}
            <span className="font-mono">{n.unit_code}</span>
          </>
        ),
      };
    case "application":
      return {
        icon: BadgeCheck,
        href: "/mentors",
        body: (
          <>
            Your <span className="font-mono">{n.unit_code}</span> mentor application was{" "}
            {n.status === "approved" ? "approved. Your AI mentor is live." : "not approved this time."}
          </>
        ),
      };
    default:
      return null;
  }
}

export default function NotificationsPage() {
  const { persona } = usePersona();
  const [tab, setTab] = useState("all");
  const [note, setNote] = useState(null);
  const notif = useNotifications(persona.id);
  const { ready, notifications, requests } = notif;
  // Last clear, so it can be undone. Tied to the persona and tab it came from.
  const [lastClear, setLastClear] = useState(null);
  const undoKeysFor = (where) =>
    lastClear?.personaId === persona.id && lastClear.where === where ? lastClear.keys : null;

  function clear(where, keys) {
    clearNotifications(persona.id, keys);
    setLastClear({ personaId: persona.id, where, keys });
  }

  function undoClear() {
    restoreNotifications(persona.id, lastClear.keys);
    setLastClear(null);
  }

  const clearableRequestKeys = [
    ...requests.received.filter((r) => canClearRequest(r, "received")).map((r) => requestKey(r, "received")),
    ...requests.sent.map((r) => requestKey(r, "sent")),
  ];

  // Opening the page reads everything; rows stay highlighted via isFresh.
  const keys = notifications.map((n) => n.key).join("|");
  useEffect(() => {
    if (ready && keys) markSeen(persona.id, keys.split("|"));
  }, [ready, keys, persona.id]);

  if (persona.role === "admin") {
    return (
      <Empty className="my-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Bell />
          </EmptyMedia>
          <EmptyTitle>No notifications for moderators</EmptyTitle>
          <EmptyDescription>The review queue is where moderator work shows up.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  async function decide(req, action) {
    setNote(null);
    try {
      const res = await fetch("/api/session-request", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: req.id, mentor_id: persona.id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNote(data.error ?? "Could not update the request.");
        return;
      }
      const mentee = getProfile(req.mentee_id)?.name ?? "The student";
      setNote(
        action === "accept"
          ? `Accepted. ${mentee} will see it in their notifications.`
          : `Declined. ${mentee} will see it in their notifications.`
      );
      notif.reload();
    } catch {
      setNote("Could not reach the server. Try again.");
    }
  }

  const pendingIn = requests.received.filter((r) => r.status === "sent").length;

  return (
    <div className="pb-16 md:pb-0">
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
          <h1 className="px-4 pt-3 text-lg font-bold">Notifications</h1>
          <TabsList variant="line" className="w-full justify-start px-2">
            <TabsTrigger value="all" className="flex-none px-3 py-2">
              All
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-none px-3 py-2">
              Requests
              {pendingIn > 0 && <Badge className="ml-1.5">{pendingIn}</Badge>}
            </TabsTrigger>
          </TabsList>
        </div>

        {note && (
          <p className="border-b bg-muted/40 px-4 py-2 text-sm text-muted-foreground">{note}</p>
        )}

        <TabsContent value="all">
          {!ready && (
            <div className="flex flex-col gap-3 px-4 py-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          )}
          {ready && (
            <ClearBar
              count={notifications.length}
              noun="notification"
              undoKeys={undoKeysFor("all")}
              onClear={() => clear("all", notifications.map((n) => n.key))}
              onUndo={undoClear}
            />
          )}
          {ready && notifications.length === 0 && (
            <Empty className="my-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Bell />
                </EmptyMedia>
                <EmptyTitle>{undoKeysFor("all") ? "All clear" : "No notifications yet"}</EmptyTitle>
                <EmptyDescription>
                  When someone finds your post helpful, replies to you, or answers a session request,
                  it shows up here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {notifications.map((n) => {
            const d = describe(n, persona.id);
            if (!d) return null;
            const actor = n.actor_id ? getProfile(n.actor_id) : null;
            const Icon = d.icon;
            const content = (
              <>
                <div className="relative shrink-0">
                  {actor ? (
                    <UserAvatar profile={actor} className="size-10" textClassName="text-xs" />
                  ) : (
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                  )}
                  {actor && (
                    <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
                      <Icon className="size-3" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p>
                    {d.body} <span className="text-muted-foreground">· {timeAgo(n.created_at)}</span>
                  </p>
                  {d.quote && (
                    <p className="mt-0.5 line-clamp-2 text-muted-foreground">{d.quote}</p>
                  )}
                </div>
                {notif.isFresh(n.key) && (
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="New" />
                )}
              </>
            );
            const rowClass = cn(
              "flex w-full items-start gap-3 border-b py-3 pr-12 pl-4 text-left transition-colors hover:bg-muted/50",
              notif.isFresh(n.key) && "bg-primary/[0.05]"
            );
            return (
              <div key={n.key} className="group relative">
                {d.href ? (
                  <Link href={d.href} className={rowClass}>
                    {content}
                  </Link>
                ) : (
                  <button type="button" onClick={() => setTab(d.tab)} className={rowClass}>
                    {content}
                  </button>
                )}
                <ClearButton label="Clear notification" onClick={() => clear("all", [n.key])} />
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="requests">
          {ready && (
            <ClearBar
              count={clearableRequestKeys.length}
              noun="request"
              undoKeys={undoKeysFor("requests")}
              onClear={() => clear("requests", clearableRequestKeys)}
              onUndo={undoClear}
            />
          )}
          {(persona.role === "mentor" || requests.received.length > 0) && (
            <section className="border-b px-4 py-4">
              <h2 className="mb-3 text-sm font-semibold">Requests to you</h2>
              {pendingIn > 0 && (
                <p className="-mt-2 mb-3 text-xs text-muted-foreground">
                  Pending requests stay here until you accept or decline them.
                </p>
              )}
              {ready && requests.received.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No session requests yet. Helpful answers in your unit communities raise you in mentor search.
                </p>
              )}
              <div className="space-y-3">
                {requests.received.map((r) => {
                  const mentee = getProfile(r.mentee_id);
                  if (!mentee) return null;
                  const clearable = canClearRequest(r, "received");
                  return (
                    <div
                      key={r.id}
                      className={cn("group relative flex gap-3 rounded-xl border p-3", clearable && "pr-12")}
                    >
                      {clearable && (
                        <ClearButton
                          label="Clear request"
                          onClick={() => clear("requests", [requestKey(r, "received")])}
                        />
                      )}
                      <UserAvatar profile={mentee} className="size-9" textClassName="text-xs" />
                      <div className="min-w-0 flex-1 space-y-2 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{mentee.name}</span>
                          <span className="text-muted-foreground">
                            <span className="font-mono">{r.unit_code}</span>
                            {r.rate_per_hour ? ` · $${r.rate_per_hour}/h` : ""} · {timeAgo(r.created_at)}
                          </span>
                          <StatusBadge status={r.status} />
                        </div>
                        <p>{r.message}</p>
                        {r.status === "sent" && (
                          <div className="flex gap-2">
                            <Button size="sm" className="rounded-full" onClick={() => decide(r, "accept")}>
                              <CheckCircle2 data-icon="inline-start" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => decide(r, "decline")}
                            >
                              <XCircle data-icon="inline-start" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold">Requests you sent</h2>
            {ready && requests.sent.length === 0 && (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>No session requests to show.</p>
                <Link href="/mentors" className={cn(buttonVariants({ size: "sm" }), "rounded-full")}>
                  Find a mentor
                </Link>
              </div>
            )}
            <div className="space-y-3">
              {requests.sent.map((r) => {
                const mentor = getProfile(r.mentor_id);
                if (!mentor) return null;
                return (
                  <div key={r.id} className="group relative flex gap-3 rounded-xl border p-3 pr-12">
                    <ClearButton
                      label="Clear request"
                      onClick={() => clear("requests", [requestKey(r, "sent")])}
                    />
                    <UserAvatar profile={mentor} className="size-9" textClassName="text-xs" />
                    <div className="min-w-0 flex-1 space-y-1 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{mentor.name}</span>
                        <span className="text-muted-foreground">
                          <span className="font-mono">{r.unit_code}</span>
                          {r.rate_per_hour ? ` · $${r.rate_per_hour}/h` : ""} · {timeAgo(r.created_at)}
                        </span>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-muted-foreground">{r.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
