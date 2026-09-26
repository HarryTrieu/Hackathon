"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { TagChip } from "@/components/tag-chip";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { POSTS, getProfile } from "@/lib/seed";
import { useFollowedTags } from "@/lib/use-followed-tags";

function TagResults() {
  const params = useSearchParams();
  const tag = (params.get("tag") ?? "").toLowerCase();
  const followed = useFollowedTags();
  const [dbPosts, setDbPosts] = useState(null);
  const [hidden, setHidden] = useState([]);

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

  const posts = useMemo(() => {
    const hide = new Set(hidden);
    return (dbPosts ?? POSTS).filter((p) => {
      if (hide.has(p.id) || p.status === "removed") return false;
      if (!tag) return followed.tags.some((t) => p.tags.includes(t));
      return p.tags.includes(tag) || p.unit_codes.map((c) => c.toLowerCase()).includes(tag);
    });
  }, [dbPosts, tag, followed.tags, hidden]);

  return (
    <div className="pb-16 md:pb-0">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <Search className="size-5 text-primary" />
          {tag ? `#${tag}` : "Followed tags"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {tag
            ? "Posts tagged with this topic. Follow it to raise it in your For you feed."
            : "Follow tags from the sidebar or a post, then they show up here and in For you."}
        </p>
        {tag && (
          <div className="mt-2">
            <TagChip tag={tag} />
          </div>
        )}
      </div>
      {posts.length === 0 ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyTitle>No posts for this tag yet</EmptyTitle>
            <EmptyDescription>Try another tag from the sidebar, or post one yourself.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        posts.map((post) => (
          <PostCard
            key={`${tag}-${post.id}`}
            post={post}
            author={getProfile(post.author_id)}
            reason={tag ? `Tagged ${tag}` : "A tag you follow"}
            onDeleted={(id) => setHidden((prev) => [...prev, id])}
          />
        ))
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <TagResults />
    </Suspense>
  );
}
