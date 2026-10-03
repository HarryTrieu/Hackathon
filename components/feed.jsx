"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Composer } from "@/components/composer";
import { HomeHero } from "@/components/home-hero";
import { MentorStrip } from "@/components/mentor-strip";
import { PostCard } from "@/components/post-card";
import { SponsoredCard } from "@/components/sponsored-card";
import { TagChip } from "@/components/tag-chip";
import { usePersona } from "@/lib/persona-context";
import { sponsoredFor, withSponsored } from "@/lib/sponsored";
import { useFollowedTags } from "@/lib/use-followed-tags";
import { useHiddenAds } from "@/lib/use-hidden-ads";
import { pinMyNewPosts, unpinMyNewPosts, useMyNewPosts } from "@/lib/my-new-posts";
import { POSTS } from "@/lib/seed";
import { rankForYou, rankHot, rankNew } from "@/lib/rank";

// Feed data from the API, or null when it is unavailable (seed fallback).
async function fetchPosts() {
  try {
    const res = await fetch("/api/posts");
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 py-6" aria-label="Loading posts">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CaughtUp() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <CheckCircle2 className="size-8 text-primary" />
      <p className="font-semibold">You&apos;re all caught up</p>
      <p className="text-sm text-muted-foreground">
        That&apos;s everything for now. Go study, the feed will be here later.
      </p>
    </div>
  );
}

export function Feed() {
  const { persona } = usePersona();
  const followed = useFollowedTags();
  // null = still loading or unavailable, then the seed is the source of truth.
  const [dbPosts, setDbPosts] = useState(null);
  const [source, setSource] = useState("seed");
  // Posts published in this tab, from the feed composer or the left-nav popup.
  const { posts: myNewPosts, pinned } = useMyNewPosts();
  const [hidden, setHidden] = useState([]);
  const [tab, setTab] = useState("for-you");
  const [reloading, setReloading] = useState(false);
  // Only the newest request may update the feed, so quick tab clicks
  // cannot let an older response overwrite a newer one.
  const requestSeq = useRef(0);
  // Posts that arrived while you were reading: shown as "N new posts"
  // instead of reshuffling the feed under you.
  const [waiting, setWaiting] = useState(null);
  const [scrolledFar, setScrolledFar] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const seq = ++requestSeq.current;
    fetchPosts().then((data) => {
      if (cancelled || seq !== requestSeq.current || !data?.posts) return;
      setDbPosts(data.posts);
      setSource(data.source);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Check for new posts every minute while the page is visible.
  const knownIds = (dbPosts ?? []).map((p) => p.id).join(",");
  useEffect(() => {
    if (!knownIds) return;
    const known = new Set(knownIds.split(","));
    const timer = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      const data = await fetchPosts();
      const fresh = (data?.posts ?? []).filter((p) => !known.has(p.id) && p.author_id !== persona.id);
      if (fresh.length > 0) setWaiting({ data, count: fresh.length });
    }, 60_000);
    return () => clearInterval(timer);
  }, [knownIds, persona.id]);

  useEffect(() => {
    const onScroll = () => setScrolledFar(window.scrollY > 1200);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function showWaiting() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setDbPosts(waiting.data.posts);
    setSource(waiting.data.source);
    setWaiting(null);
  }

  // Every tab click refreshes: back to the top, latest posts from the API.
  async function reload() {
    setWaiting(null);
    window.scrollTo({ top: 0, behavior: "instant" });
    // A just-published post is pinned for one look; after a refresh it
    // ranks like any other post.
    unpinMyNewPosts();
    const seq = ++requestSeq.current;
    setReloading(true);
    const data = await fetchPosts();
    if (seq !== requestSeq.current) return;
    setReloading(false);
    if (data?.posts) {
      setDbPosts(data.posts);
      setSource(data.source);
    }
  }

  function changeTab(next) {
    setTab(next);
    reload();
  }

  // Clicking the tab you are already on does not change the value, so it
  // refreshes here instead.
  function refreshIfActive(value) {
    if (value === tab) reload();
  }

  const allPosts = useMemo(() => {
    const base = dbPosts ?? POSTS;
    // With a DB the published post comes back in the next fetch too, so only
    // prepend new posts that the base does not already contain.
    const baseIds = new Set(base.map((p) => p.id));
    const extra = myNewPosts.filter((p) => !baseIds.has(p.id));
    const hiddenIds = new Set(hidden);
    return [...extra, ...base].filter((p) => !hiddenIds.has(p.id) && p.status !== "removed");
  }, [dbPosts, myNewPosts, hidden]);

  // Right after publishing, your post sits on top of every tab so you can
  // check it, until the next tab click.
  const pinnedPosts = useMemo(
    () => myNewPosts.filter((p) => pinned.includes(p.id)),
    [myNewPosts, pinned]
  );
  const forYou = useMemo(
    () => pinMyNewPosts(rankForYou(allPosts, persona, followed.tags), pinnedPosts, persona.id),
    [allPosts, persona, followed.tags, pinnedPosts]
  );
  const hot = useMemo(
    () => pinMyNewPosts(rankHot(allPosts), pinnedPosts, persona.id),
    [allPosts, pinnedPosts, persona.id]
  );
  const fresh = useMemo(
    () => pinMyNewPosts(rankNew(allPosts), pinnedPosts, persona.id),
    [allPosts, pinnedPosts, persona.id]
  );

  const hiddenAds = useHiddenAds(persona.id);
  const ads = useMemo(() => sponsoredFor(persona, hiddenAds.ids), [persona, hiddenAds.ids]);

  function renderItem(item) {
    if (item.sponsored) {
      return (
        <SponsoredCard
          key={`${persona.id}-${item.sponsored.ad.id}`}
          entry={item.sponsored}
          viewerId={persona.id}
          onHide={hiddenAds.hide}
        />
      );
    }
    const { post, author, reason } = item;
    return (
      <PostCard
        key={`${persona.id}-${post.id}`}
        post={post}
        author={author}
        reason={reason}
        onDeleted={(id) => setHidden((prev) => [...prev, id])}
      />
    );
  }

  // Scroll up to a post you just published (e.g. from the popup while
  // scrolled down the feed).
  const newestId = myNewPosts[0]?.id;
  useEffect(() => {
    if (newestId) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [newestId]);

  return (
    <div className="pb-16 md:pb-0">
      <Tabs value={tab} onValueChange={changeTab} className="gap-0">
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 pt-3">
            <h1 className="text-lg font-bold">Home</h1>
            <Badge variant="outline" className="text-muted-foreground">
              {source === "supabase" ? "Live data" : "Demo data"}
            </Badge>
          </div>
          <TabsList variant="line" className="w-full justify-start px-2">
            <TabsTrigger value="for-you" onClick={() => refreshIfActive("for-you")} className="flex-none px-3 py-2">
              For you
            </TabsTrigger>
            <TabsTrigger value="hot" onClick={() => refreshIfActive("hot")} className="flex-none px-3 py-2">
              Hot
            </TabsTrigger>
            <TabsTrigger value="new" onClick={() => refreshIfActive("new")} className="flex-none px-3 py-2">
              New
            </TabsTrigger>
          </TabsList>
          {(waiting || scrolledFar) && (
            <div className="pointer-events-none absolute inset-x-0 top-full flex justify-center pt-2">
              <button
                type="button"
                onClick={waiting ? showWaiting : () => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105 animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <ArrowUp className="size-4" />
                {waiting ? `${waiting.count} new post${waiting.count === 1 ? "" : "s"}` : "Back to top"}
              </button>
            </div>
          )}
        </div>

        <MentorStrip />
        <HomeHero />
        {followed.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b px-4 py-2">
            <span className="text-xs text-muted-foreground">Following</span>
            {followed.tags.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </div>
        )}
        {/* Phones post from the floating + in the bottom nav instead. */}
        <div className="hidden md:block">
          <Composer />
        </div>

        {reloading && <FeedSkeleton />}
        <TabsContent value="for-you" className={reloading ? "hidden" : undefined}>
          {/* key on persona so switching re-mounts and fades the new order in */}
          <div key={persona.id} className="animate-in fade-in duration-500">
            {withSponsored(forYou, ads).map(renderItem)}
            <CaughtUp />
          </div>
        </TabsContent>

        <TabsContent value="hot" className={reloading ? "hidden" : undefined}>
          {withSponsored(hot, ads).map(renderItem)}
          <CaughtUp />
        </TabsContent>

        <TabsContent value="new" className={reloading ? "hidden" : undefined}>
          {withSponsored(fresh, ads).map(renderItem)}
          <CaughtUp />
        </TabsContent>
      </Tabs>
    </div>
  );
}
