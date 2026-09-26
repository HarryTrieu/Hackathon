"use client";

import { useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Composer } from "@/components/composer";
import { PostCard } from "@/components/post-card";
import { usePersona } from "@/lib/persona-context";
import { POSTS } from "@/lib/seed";
import { rankForYou, rankPopular } from "@/lib/rank";

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
            {/* key on persona so switching re-mounts and fades the new order in */}
            <div key={persona.id} className="animate-in fade-in duration-500">
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
