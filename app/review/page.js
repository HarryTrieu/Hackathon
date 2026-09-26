"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { UserAvatar } from "@/components/user-avatar";
import { MentorApplications } from "@/components/mentor-applications";
import { getProfile, POSTS } from "@/lib/seed";

export default function ReviewPage() {
  const [flagged, setFlagged] = useState(null);
  const [reports, setReports] = useState(null);
  const [source, setSource] = useState("seed");
  const [note, setNote] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/posts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const base = data?.posts ?? POSTS;
        setSource(data?.source ?? "seed");
        setFlagged(base.filter((p) => p.flag_reason && p.status !== "removed"));
      })
      .catch(() => {
        if (!cancelled) {
          setFlagged(POSTS.filter((p) => p.flag_reason));
        }
      });
    fetch("/api/reports")
      .then((res) => (res.ok ? res.json() : { reports: [] }))
      .then((data) => {
        if (!cancelled) setReports(data.reports ?? []);
      })
      .catch(() => !cancelled && setReports([]));
    return () => {
      cancelled = true;
    };
  }, []);

  async function act(postId, action) {
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ post_id: postId, action }),
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

      <MentorApplications />

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
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    await fetch("/api/reports", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ id: r.id, action: "resolve" }),
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

      {note && (
        <p className="border-b bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          {note}
        </p>
      )}

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
          const author = getProfile(post.author_id);
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
                <p className="flex items-start gap-1.5 rounded-lg bg-destructive/5 p-2 text-sm text-destructive">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                  {post.flag_reason}
                </p>
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
    </div>
  );
}
