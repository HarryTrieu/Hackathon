"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/back-button";
import { Composer } from "@/components/composer";
import { PostCard } from "@/components/post-card";
import { IncrementalList } from "@/components/incremental-list";
import { authorOf, withAuthors } from "@/lib/authors";
import { getInterest, postsForInterest } from "@/lib/interests";
import { useMyNewPosts } from "@/lib/my-new-posts";
import { usePersona } from "@/lib/persona-context";
import { POSTS } from "@/lib/seed";
import { toast } from "@/lib/toast";

// One interest community: join, post into it, and its posts (newest first).
export default function InterestPage() {
  const { slug } = useParams();
  const interest = getInterest(String(slug));
  const { persona } = usePersona();
  const [dbPosts, setDbPosts] = useState(null);
  const [members, setMembers] = useState({ personaId: null, joined: [], counts: {} });
  const [hidden, setHidden] = useState([]);
  const { posts: myNewPosts } = useMyNewPosts();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/posts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => !cancelled && setDbPosts(data?.posts ?? []))
      .catch(() => !cancelled && setDbPosts([]));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/interests?profile_id=${encodeURIComponent(persona.id)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && !cancelled && setMembers({ personaId: persona.id, joined: data.joined, counts: data.counts }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [persona.id]);

  if (!interest) return <p className="px-4 py-8 text-sm text-muted-foreground">That community doesn&apos;t exist.</p>;

  // Database posts plus the sample interest posts it doesn't have yet.
  const ids = new Set((dbPosts ?? []).map((p) => p.id));
  const merged = [...myNewPosts, ...(dbPosts ?? []), ...POSTS.filter((p) => !ids.has(p.id))];
  const seen = new Set();
  const posts = postsForInterest(interest, withAuthors(merged))
    .filter((p) => !hidden.includes(p.id) && !seen.has(p.id) && seen.add(p.id))
    .sort((a, b) => (a.hours_ago ?? 0) - (b.hours_ago ?? 0));

  const joined = members.personaId === persona.id && members.joined.includes(interest.slug);
  const count = (members.counts[interest.slug] ?? 0);

  async function toggle() {
    const next = !joined;
    setMembers((m) => ({
      ...m,
      joined: next ? [...m.joined, interest.slug] : m.joined.filter((s) => s !== interest.slug),
      counts: { ...m.counts, [interest.slug]: Math.max(0, count + (next ? 1 : -1)) },
    }));
    const res = await fetch("/api/interests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profile_id: persona.id, slug: interest.slug, join: next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMembers((m) => ({
        ...m,
        joined: next ? m.joined.filter((s) => s !== interest.slug) : [...m.joined, interest.slug],
        counts: { ...m.counts, [interest.slug]: count },
      }));
      toast(data.error ?? "Could not update that.", { tone: "info" });
    } else toast(next ? `Joined ${interest.name}` : `Left ${interest.name}`);
  }

  return (
    <div className="pb-16 md:pb-0">
      <div className="sticky top-0 z-10 border-b bg-background md:bg-background/95 px-4 py-3 md:backdrop-blur">
        <BackButton fallback="/communities" className="-ml-2 mb-1" />
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl" aria-hidden>
            {interest.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold">{interest.name}</h1>
            <p className="truncate text-sm text-muted-foreground">{interest.blurb}</p>
          </div>
          {persona.role !== "admin" && (
            <Button size="sm" variant={joined ? "outline" : "default"} className="rounded-full" onClick={toggle}>
              {joined ? "Joined" : "Join"}
            </Button>
          )}
        </div>
        <p className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {count} {count === 1 ? "member" : "members"}
          </span>
          <span>
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
        </p>
      </div>

      {persona.role !== "admin" && (
        <div className="hidden md:block">
          <Composer interest={interest.slug} placeholder={`Share something with ${interest.name}...`} />
        </div>
      )}

      {dbPosts === null && (
        <div className="space-y-3 px-4 py-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}
      {dbPosts !== null && posts.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">No posts yet. Start the conversation.</p>
      )}
      {dbPosts !== null && (
        <IncrementalList
          items={posts}
          memoryKey={`interest:${interest.slug}`}
          render={(post) => (
            <PostCard
              key={post.id}
              post={post}
              author={authorOf(post)}
              reason={null}
              onDeleted={(id) => setHidden((prev) => [...prev, id])}
            />
          )}
        />
      )}
    </div>
  );
}
