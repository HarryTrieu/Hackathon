"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Search, Sparkles, TrendingUp, Users, X } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { PostCard } from "@/components/post-card";
import { TagChip } from "@/components/tag-chip";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { POSTS } from "@/lib/seed";
import { useFollowedTags } from "@/lib/use-followed-tags";
import { usePersona } from "@/lib/persona-context";
import { unitDirectory } from "@/lib/communities";
import { trendingTags } from "@/lib/rank";
import { authorOf, withAuthors } from "@/lib/authors";

// Posts you've already been shown under "Your topics", so the page can say
// when you've seen everything. Per browser; losing it just shows all as new.
const SEEN_KEY = "sodu.topics.seen";
function readSeen() {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(SEEN_KEY)) ?? []);
  } catch {
    return new Set();
  }
}
function markSeen(ids) {
  try {
    const seen = readSeen();
    for (const id of ids) seen.add(id);
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-500)));
  } catch {
    // Storage blocked: nothing to remember.
  }
}

function usePosts() {
  const [dbPosts, setDbPosts] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/posts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.posts) setDbPosts(data.posts);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return useMemo(() => withAuthors(dbPosts ?? POSTS).filter((p) => p.status !== "removed"), [dbPosts]);
}

// How many of the typed words appear in the post, its tags, units or
// author ("loops" also finds "loop"). Posts matching more words rank higher.
function score(post, words) {
  const author = authorOf(post);
  const haystack = [post.text, post.tldr, ...post.tags, ...post.unit_codes, author?.name, author?.handle]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return words.filter((w) => haystack.includes(w) || (w.length > 3 && w.endsWith("s") && haystack.includes(w.slice(0, -1))))
    .length;
}

function search(posts, query) {
  const words = query.toLowerCase().replace(/#/g, "").split(/\s+/).filter(Boolean);
  return posts
    .map((post) => ({ post, hits: score(post, words) }))
    .filter((r) => r.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map((r) => r.post);
}

// Shown when you follow nothing, you're caught up, or a search finds nothing.
function Suggestions({ posts, title }) {
  const { persona } = usePersona();
  const followed = useFollowedTags();
  const tags = trendingTags(posts, 14)
    .filter(({ tag }) => !followed.has(tag) && !/^[A-Z]{3}\d{3}$/.test(tag))
    .slice(0, 8);
  const units = unitDirectory(posts)
    .filter((u) => u.course === persona.course && u.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 4);

  return (
    <section className="space-y-4 border-b px-4 py-5">
      {title && <p className="font-semibold">{title}</p>}
      {tags.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <TrendingUp className="size-4 text-primary" />
            Trending topics to follow
          </p>
          <div className="flex flex-wrap gap-x-2 gap-y-1.5">
            {tags.map(({ tag, count }) => (
              <TagChip key={tag} tag={tag} count={count} />
            ))}
          </div>
        </div>
      )}
      {units.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Users className="size-4 text-primary" />
            Popular in {persona.course}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {units.map((u) => (
              <Link
                key={u.code}
                href={`/unit/${u.code}`}
                className="rounded-xl border px-3 py-2 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
              >
                <span className="font-mono font-bold text-primary">{u.code}</span>
                <span className="block truncate text-muted-foreground">
                  {u.name ?? "Unit community"} · {u.postCount} post{u.postCount === 1 ? "" : "s"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function PostList({ posts, reason, onDeleted }) {
  return posts.map((post) => (
    <PostCard key={post.id} post={post} author={authorOf(post)} reason={reason} onDeleted={onDeleted} />
  ));
}

function TagResults({ tag, posts, onDeleted }) {
  const shown = posts.filter((p) => p.tags.includes(tag) || p.unit_codes.map((c) => c.toLowerCase()).includes(tag));
  return (
    <>
      <div className="border-b px-4 py-3">
        <TagChip tag={tag} />
      </div>
      {shown.length === 0 ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyTitle>No posts for this tag yet</EmptyTitle>
            <EmptyDescription>Try another tag, or post one yourself.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <PostList posts={shown} reason={`Tagged ${tag}`} onDeleted={onDeleted} />
      )}
    </>
  );
}

function YourTopics({ posts, onDeleted }) {
  const followed = useFollowedTags();
  // What you'd seen before opening the page; this visit's posts are marked
  // seen after a moment, but the split stays put until you come back.
  const [seenBefore, setSeenBefore] = useState(null);
  const mine = posts.filter((p) => followed.tags.some((t) => p.tags.includes(t)));

  useEffect(() => {
    const run = async () => setSeenBefore(readSeen());
    run();
  }, []);
  // A string, so the timer only restarts when the list really changes.
  const mineIds = mine.map((p) => p.id).join(",");
  useEffect(() => {
    if (!mineIds) return;
    const timer = setTimeout(() => markSeen(mineIds.split(",")), 2000);
    return () => clearTimeout(timer);
  }, [mineIds]);

  if (followed.tags.length === 0) {
    return (
      <>
        <div className="flex items-start gap-3 border-b px-4 py-4 text-sm">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            You don&apos;t follow any topics yet. Follow a few and their posts gather here and rise in your For you
            feed.
          </p>
        </div>
        <Suggestions posts={posts} />
      </>
    );
  }
  if (!seenBefore) return null;

  const fresh = mine.filter((p) => !seenBefore.has(p.id));
  const earlier = mine.filter((p) => seenBefore.has(p.id));

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b px-4 py-3">
        <span className="text-sm text-muted-foreground">Following</span>
        {followed.tags.map((t) => (
          <TagChip key={t} tag={t} />
        ))}
      </div>
      {fresh.length > 0 ? (
        <>
          <p className="px-4 pt-4 text-sm font-semibold">
            New in your topics <span className="font-normal text-muted-foreground">· {fresh.length}</span>
          </p>
          <PostList posts={fresh} reason="A tag you follow" onDeleted={onDeleted} />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 px-4 pt-5 text-sm">
            <CheckCircle2 className="size-5 text-primary" />
            <span className="font-semibold">You&apos;re all caught up on your topics.</span>
          </div>
          <Suggestions posts={posts} title="Find something new" />
        </>
      )}
      {earlier.length > 0 && (
        <>
          <p className="px-4 pt-5 text-sm font-semibold text-muted-foreground">Seen before</p>
          <PostList posts={earlier} reason="A tag you follow" onDeleted={onDeleted} />
        </>
      )}
    </>
  );
}

function Topics() {
  const params = useSearchParams();
  const router = useRouter();
  const tag = (params.get("tag") ?? "").toLowerCase();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [hidden, setHidden] = useState([]);
  const all = usePosts();
  const posts = all.filter((p) => !hidden.includes(p.id));
  const onDeleted = (id) => setHidden((prev) => [...prev, id]);

  // Keep ?q= in the address so Back and refresh keep your search.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search";
      if (!tag) router.replace(next, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, tag, router]);

  const searching = !tag && query.trim().length > 0;
  const results = searching ? search(posts, query.trim()) : [];

  return (
    <div className="pb-16 md:pb-0">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        {tag && <BackButton className="-ml-2 mb-1" />}
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <Search className="size-5 text-primary" />
          {tag ? `#${tag}` : "Topics"}
        </h1>
        {tag ? (
          <p className="text-sm text-muted-foreground">
            Posts tagged with this topic. Follow it to raise it in your For you feed.
          </p>
        ) : (
          <label className="relative mt-2 block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts, topics, units or people"
              aria-label="Search posts"
              className="h-10 w-full rounded-full border bg-muted/40 pr-9 pl-9 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background md:text-sm [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </label>
        )}
      </div>

      {tag && <TagResults tag={tag} posts={posts} onDeleted={onDeleted} />}

      {searching && (
        <>
          <p className="px-4 pt-4 text-sm text-muted-foreground">
            {results.length} post{results.length === 1 ? "" : "s"} for &ldquo;{query.trim()}&rdquo;
          </p>
          {results.length === 0 ? (
            <Suggestions posts={posts} title="Nothing matched. Try one of these:" />
          ) : (
            <PostList posts={results} reason={null} onDeleted={onDeleted} />
          )}
        </>
      )}

      {!tag && !searching && <YourTopics posts={posts} onDeleted={onDeleted} />}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <Topics />
    </Suspense>
  );
}
