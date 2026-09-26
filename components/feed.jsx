"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Composer } from "@/components/composer";
import { POST_PUBLISHED_EVENT } from "@/components/post-dialog";
import { HomeHero } from "@/components/home-hero";
import { PostCard } from "@/components/post-card";
import { TagChip } from "@/components/tag-chip";
import { usePersona } from "@/lib/persona-context";
import { useFollowedTags } from "@/lib/use-followed-tags";
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
  // Posts published this session while no DB is configured.
  const [sessionPosts, setSessionPosts] = useState([]);
  const [hidden, setHidden] = useState([]);

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
    // prepend session posts that the base does not already contain.
    const baseIds = new Set(base.map((p) => p.id));
    const extra = sessionPosts.filter((p) => !baseIds.has(p.id));
    const hiddenIds = new Set(hidden);
    return [...extra, ...base].filter((p) => !hiddenIds.has(p.id) && p.status !== "removed");
  }, [dbPosts, sessionPosts, hidden]);

  const forYou = useMemo(
    () => rankForYou(allPosts, persona, followed.tags),
    [allPosts, persona, followed.tags]
  );
  const hot = useMemo(() => rankHot(allPosts), [allPosts]);
  const fresh = useMemo(() => rankNew(allPosts), [allPosts]);

  function handlePublished(post) {
    setSessionPosts((prev) => [post, ...prev]);
  }

  // Posts published from the left-nav popup while this feed is on screen.
  useEffect(() => {
    const onPublished = (e) => setSessionPosts((prev) => [e.detail, ...prev]);
    window.addEventListener(POST_PUBLISHED_EVENT, onPublished);
    return () => window.removeEventListener(POST_PUBLISHED_EVENT, onPublished);
  }, []);

  return (
    <div className="pb-16 md:pb-0">
      <Tabs defaultValue="for-you" className="gap-0">
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
        <Composer onPublished={handlePublished} />

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
          {hot.map(({ post, author }) => (
            <PostCard
              key={`${persona.id}-${post.id}`}
              post={post}
              author={author}
              reason={null}
              onDeleted={(id) => setHidden((prev) => [...prev, id])}
            />
          ))}
          <CaughtUp />
        </TabsContent>

        <TabsContent value="new">
          {fresh.map(({ post, author }) => (
            <PostCard
              key={`${persona.id}-${post.id}`}
              post={post}
              author={author}
              reason={null}
              onDeleted={(id) => setHidden((prev) => [...prev, id])}
            />
          ))}
          <CaughtUp />
        </TabsContent>
      </Tabs>
    </div>
  );
}
