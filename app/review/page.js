"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck, EyeOff, HeartHandshake, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { MentorApplications } from "@/components/mentor-applications";
import { SponsoredStats } from "@/components/sponsored-stats";
import { usePersona } from "@/lib/persona-context";
import { canModerate } from "@/lib/roles";
import { authorOf } from "@/lib/authors";
import { getProfile, POSTS } from "@/lib/seed";
import { flagText, isSupportFlag } from "@/lib/moderation";

// A reported post in full, with the two decisions.
function ReportedPost({ post, onKeep, onRemove }) {
  const author = post && authorOf(post);
  if (!post || !author) return <p className="text-xs text-muted-foreground">This post was deleted or can&apos;t be found.</p>;
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <UserAvatar profile={author} className="size-7" textClassName="text-[10px]" />
        <span className="text-sm font-semibold">{author.name}</span>
        <span className="text-xs text-muted-foreground">@{author.handle}</span>
        {post.status === "removed" && <Badge variant="destructive">Already removed</Badge>}
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.text}</p>
      {post.flag_reason && <p className="text-xs text-destructive">AI flag: {flagText(post.flag_reason)}</p>}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onKeep}>
          <ShieldCheck data-icon="inline-start" />
          Keep post
        </Button>
        {post.status !== "removed" && (
          <Button size="sm" variant="destructive" onClick={onRemove}>
            <EyeOff data-icon="inline-start" />
            Remove from feed
          </Button>
        )}
      </div>
    </div>
  );
}

// Only the admin persona moderates. The nav hides the link for everyone else;
// this covers someone opening /review directly. UI gate only: the review
// APIs check the moderator on the server too (lib/actor.js).
export default function ReviewPage() {
  const { persona } = usePersona();
  if (canModerate(persona)) return <ReviewQueue moderatorId={persona.id} />;
  return (
    <Empty className="my-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Lock />
        </EmptyMedia>
        <EmptyTitle>Moderators only</EmptyTitle>
        <EmptyDescription>
          Mentor applications, reports and AI-flagged posts are reviewed by the Sodu team. Switch to
          the Sodu Moderator persona to see the queue.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function ReviewQueue({ moderatorId }) {
  const [flagged, setFlagged] = useState(null);
  // Every post, so a reported post can be shown in full.
  const [posts, setPosts] = useState(POSTS);
  const [reports, setReports] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [source, setSource] = useState("seed");
  const [note, setNote] = useState(null);
  // Follows the demo order: approve a mentor, resolve a report, remove a post.
  const [tab, setTab] = useState("mentors");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/posts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const base = data?.posts ?? POSTS;
        setPosts(base);
        setSource(data?.source ?? "seed");
        setFlagged(base.filter((p) => p.flag_reason && p.status !== "removed"));
      })
      .catch(() => {
        if (!cancelled) {
          setFlagged(POSTS.filter((p) => p.flag_reason));
        }
      });
    fetch("/api/events")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setFunnel(data);
      })
      .catch(() => {});
    fetch(`/api/reports?moderator_id=${encodeURIComponent(moderatorId)}`)
      .then((res) => (res.ok ? res.json() : { reports: [] }))
      .then((data) => {
        if (!cancelled) setReports(data.reports ?? []);
      })
      .catch(() => !cancelled && setReports([]));
    return () => {
      cancelled = true;
    };
  }, [moderatorId]);

  async function resolveReport(id, message) {
    await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, action: "resolve", moderator_id: moderatorId }),
    });
    setReports((prev) => prev.filter((x) => x.id !== id));
    setNote(message);
  }

  async function act(postId, action) {
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ post_id: postId, action, moderator_id: moderatorId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNote(data.error ?? "Action failed.");
        return;
      }
      setFlagged((prev) => prev.filter((p) => p.id !== postId));
      setNote(
        data.mocked
          ? `Post ${action === "approve" ? "approved" : "removed"} for this session only (no database configured).`
          : `Post ${action === "approve" ? "approved" : "removed"}.`
      );
    } catch {
      setNote("Action failed. Check your connection.");
    }
  }

  return (
    <div className="pb-16 md:pb-0">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Human review</h1>
          <Badge variant="outline" className="text-muted-foreground">
            {source === "supabase" ? "Live data" : "Demo data"}
          </Badge>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          AI only flags. People report on profiles, chats and posts. A person decides here.
        </p>
      </div>

      {funnel && (
        <p className="border-b px-4 py-2 text-sm text-muted-foreground">
          Demo funnel: {funnel.previews} preview chats started, {funnel.contacts} contact requests
          {funnel.previews ? ` (${funnel.conversion}% conversion)` : ""}.
        </p>
      )}

      {note && (
        <p className="border-b bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          {note}
        </p>
      )}

      {/* One tab per queue instead of one long scroll; counts show what's waiting. */}
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto overflow-y-hidden border-b px-2 [scrollbar-width:none]">
          <TabsTrigger value="mentors" className="flex-none px-3 py-2">
            Mentor applications
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex-none px-3 py-2">
            Reports
            {reports?.length > 0 && <Badge className="ml-1.5">{reports.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="flagged" className="flex-none px-3 py-2">
            Flagged posts
            {flagged?.length > 0 && <Badge className="ml-1.5">{flagged.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sponsored" className="flex-none px-3 py-2">
            Sponsored
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mentors">
          <MentorApplications />
        </TabsContent>

        <TabsContent value="reports">
          <section className="border-b px-4 py-4">
            <h2 className="text-sm font-semibold">User reports</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              From the Report button on a mentor profile, AI chat, or community post.
            </p>
            {reports === null && <Skeleton className="h-20 w-full rounded-xl" />}
            {reports?.length === 0 && (
              <p className="text-sm text-muted-foreground">No open reports.</p>
            )}
            <div className="space-y-3">
              {reports?.map((r) => (
                <Card key={r.id} className="gap-2">
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{r.target_type}</Badge>
                      <span className="font-mono text-xs">{r.target_id}</span>
                      <span className="text-xs text-muted-foreground">
                        by {getProfile(r.reporter_id)?.name ?? r.reporter_id}
                      </span>
                    </div>
                    <p className="text-sm">{r.reason}</p>
                    {r.target_type === "post" && (
                      <ReportedPost
                        post={posts.find((p) => p.id === r.target_id)}
                        onKeep={() => resolveReport(r.id, "Post kept, report resolved.")}
                        onRemove={async () => {
                          await act(r.target_id, "remove");
                          await resolveReport(r.id, "Post removed, report resolved.");
                        }}
                      />
                    )}
                {r.conversation && (
                  <div className="space-y-1 rounded-lg border bg-muted/30 p-2 text-xs">
                    <p className="font-medium text-muted-foreground">
                      Reported chat with {getProfile(r.reported_id)?.name ?? r.reported_id} (last {r.conversation.length} messages)
                    </p>
                    {r.conversation.length === 0 && <p className="text-muted-foreground">No messages.</p>}
                    {r.conversation.map((m, i) => (
                      <p key={i} className={m.sender_id === r.reported_id ? "font-medium" : "text-muted-foreground"}>
                        {getProfile(m.sender_id)?.name ?? (m.sender_id === r.reporter_id ? "Reporter" : "Reported person")}: {m.text}
                        {m.deleted_at && <span className="ml-1 italic text-destructive">(deleted by sender)</span>}
                      </p>
                    ))}
                  </div>
                )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        await fetch("/api/reports", {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({ id: r.id, action: "resolve", moderator_id: moderatorId }),
                        });
                        setReports((prev) => prev.filter((x) => x.id !== r.id));
                        setNote("Report marked resolved.");
                      }}
                    >
                      <ShieldCheck data-icon="inline-start" />
                      Mark resolved
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="flagged">
          {flagged === null && (
            <div className="flex flex-col gap-4 px-4 py-4">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          )}

          {flagged?.length === 0 && (
            <Empty className="my-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldCheck />
                </EmptyMedia>
                <EmptyTitle>No AI-flagged posts</EmptyTitle>
                <EmptyDescription>
                  AI only flags. It never hides a post. A person decides here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          <div className="flex flex-col gap-4 px-4 py-4">
            {flagged?.map((post) => {
              const author = authorOf(post);
              if (!author) return null;
              return (
                <Card key={post.id} className="gap-3">
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar profile={author} className="size-8" textClassName="text-xs" />
                      <span className="text-sm font-semibold">{author.name}</span>
                      <span className="text-xs text-muted-foreground">
                        @{author.handle}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{post.text}</p>
                    {isSupportFlag(post.flag_reason) ? (
                      <p className="flex items-start gap-1.5 rounded-lg bg-primary/5 p-2 text-sm text-primary">
                        <HeartHandshake className="mt-0.5 size-4 shrink-0" />
                        {flagText(post.flag_reason).replace(/\.$/, "")}. The post stays visible with support contacts; consider
                        checking in with the author.
                      </p>
                    ) : (
                      <p className="flex items-start gap-1.5 rounded-lg bg-destructive/5 p-2 text-sm text-destructive">
                        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                        {post.flag_reason.replace(/\.$/, "")}. Hidden in the feed until you decide.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => act(post.id, "approve")}>
                        <ShieldCheck data-icon="inline-start" />
                        Approve, clear flag
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => act(post.id, "remove")}
                      >
                        <EyeOff data-icon="inline-start" />
                        Remove from feed
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="sponsored">
          <SponsoredStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
