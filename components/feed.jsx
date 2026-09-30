"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Composer } from "@/components/composer";
import { HomeHero } from "@/components/home-hero";
import { PostCard } from "@/components/post-card";
import { TagChip } from "@/components/tag-chip";
import { usePersona } from "@/lib/persona-context";
import { useFollowedTags } from "@/lib/use-followed-tags";
import { pinMyNewPosts, useMyNewPosts } from "@/lib/my-new-posts";
import { POSTS } from "@/lib/seed";
import { rankForYou, rankHot, rankNew } from "@/lib/rank";

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
  const myNewPosts = useMyNewPosts();
  const [hidden, setHidden] = useState([]);
  const [tab, setTab] = useState("for-you");
  // Window scroll offset per tab: a tab you have not opened starts at the
  // top, a tab you come back to returns to where you left it.
  const scrollByTab = useRef({});
  const restoreScroll = useRef(false);

  function changeTab(next) {
    scrollByTab.current[tab] = window.scrollY;
    restoreScroll.current = true;
    setTab(next);
  }

  // Layout effect so the jump happens before paint, after the new panel mounts.
  useLayoutEffect(() => {
    if (!restoreScroll.current) return;
    restoreScroll.current = false;
    window.scrollTo({ top: scrollByTab.current[tab] ?? 0, behavior: "instant" });
  }, [tab]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/posts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.posts) return;
        setDbPosts(data.posts);
        setSource(data.source);
      })
      .catch(() => {
        // Seed fallback already in place.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allPosts = useMemo(() => {
    const base = dbPosts ?? POSTS;
    // With a DB the published post comes back in the next fetch too, so only
    // prepend new posts that the base does not already contain.
    const baseIds = new Set(base.map((p) => p.id));
    const extra = myNewPosts.filter((p) => !baseIds.has(p.id));
    const hiddenIds = new Set(hidden);
    return [...extra, ...base].filter((p) => !hiddenIds.has(p.id) && p.status !== "removed");
  }, [dbPosts, myNewPosts, hidden]);

  // Your own new posts sit on top of every tab so you can check them.
  const forYou = useMemo(
    () => pinMyNewPosts(rankForYou(allPosts, persona, followed.tags), myNewPosts, persona.id),
    [allPosts, persona, followed.tags, myNewPosts]
  );
  const hot = useMemo(
    () => pinMyNewPosts(rankHot(allPosts), myNewPosts, persona.id),
    [allPosts, myNewPosts, persona.id]
  );
  const fresh = useMemo(
    () => pinMyNewPosts(rankNew(allPosts), myNewPosts, persona.id),
    [allPosts, myNewPosts, persona.id]
  );

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
            <TabsTrigger value="for-you" className="flex-none px-3 py-2">
              For you
            </TabsTrigger>
            <TabsTrigger value="hot" className="flex-none px-3 py-2">
              Hot
            </TabsTrigger>
            <TabsTrigger value="new" className="flex-none px-3 py-2">
              New
            </TabsTrigger>
          </TabsList>
        </div>

        <HomeHero />
        {followed.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b px-4 py-2">
            <span className="text-xs text-muted-foreground">Following</span>
            {followed.tags.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </div>
        )}
        {persona.role !== "admin" && <Composer />}

        <TabsContent value="for-you">
          {/* key on persona so switching re-mounts and fades the new order in */}
          <div key={persona.id} className="animate-in fade-in duration-500">
            {forYou.map(({ post, author, reason }) => (
              <PostCard
                key={`${persona.id}-${post.id}`}
                post={post}
                author={author}
                reason={reason}
                onDeleted={(id) => setHidden((prev) => [...prev, id])}
              />
            ))}
            <CaughtUp />
          </div>
        </TabsContent>

        <TabsContent value="hot">
          {hot.map(({ post, author, reason }) => (
            <PostCard
              key={`${persona.id}-${post.id}`}
              post={post}
              author={author}
              reason={reason}
              onDeleted={(id) => setHidden((prev) => [...prev, id])}
            />
          ))}
          <CaughtUp />
        </TabsContent>

        <TabsContent value="new">
          {fresh.map(({ post, author, reason }) => (
            <PostCard
              key={`${persona.id}-${post.id}`}
              post={post}
              author={author}
              reason={reason}
              onDeleted={(id) => setHidden((prev) => [...prev, id])}
            />
          ))}
          <CaughtUp />
        </TabsContent>
      </Tabs>
    </div>
  );
}
