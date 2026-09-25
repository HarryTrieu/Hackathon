"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Composer } from "@/components/composer";
import { PostCard } from "@/components/post-card";
import { usePersona } from "@/lib/persona-context";
import { POSTS } from "@/lib/seed";
import { rankForYou, rankPopular } from "@/lib/rank";

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 py-4">
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
      <p className="font-semibold">You're all caught up</p>
      <p className="text-sm text-muted-foreground">
        That's everything for now. Go study — the feed will be here later.
      </p>
    </div>
  );
}

export function Feed() {
  const { persona } = usePersona();
  const [ranking, setRanking] = useState(false);

  // Brief skeleton on persona switch so the re-rank is visible.
  useEffect(() => {
    setRanking(true);
    const t = setTimeout(() => setRanking(false), 350);
    return () => clearTimeout(t);
  }, [persona.id]);

  const forYou = useMemo(() => rankForYou(POSTS, persona), [persona]);
  const popular = useMemo(() => rankPopular(POSTS), []);

  return (
    <div className="pb-16 md:pb-0">
      <Tabs defaultValue="for-you" className="gap-0">
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 pt-3">
            <h1 className="text-lg font-bold">Home</h1>
            <Badge variant="outline" className="text-muted-foreground">
              Demo data
            </Badge>
          </div>
          <TabsList variant="line" className="w-full justify-start px-2">
            <TabsTrigger value="for-you" className="flex-none px-3 py-2">
              For you
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex-none px-3 py-2">
              Popular
            </TabsTrigger>
          </TabsList>
        </div>

          <TabsContent value="for-you">
            <Composer />
            {ranking ? (
              <FeedSkeleton />
            ) : (
              <div key={persona.id} className="animate-in fade-in duration-300">
                {forYou.map(({ post, author, reason }) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    author={author}
                    reason={reason}
                  />
                ))}
                <CaughtUp />
              </div>
            )}
          </TabsContent>

          <TabsContent value="popular">
            <Composer />
            {popular.map(({ post, author }) => (
              <PostCard key={post.id} post={post} author={author} reason={null} />
            ))}
            <CaughtUp />
          </TabsContent>
      </Tabs>
    </div>
  );
}
