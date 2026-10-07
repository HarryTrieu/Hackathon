"use client";

import { IncrementalList } from "@/components/incremental-list";
import { PostCard } from "@/components/post-card";

// A profile's posts, ten at a time like the Home feed, so long profiles stay
// quick on phones. Remembers how far you scrolled for Back.
export function ProfilePosts({ posts, author }) {
  return (
    <IncrementalList
      items={posts}
      memoryKey={`profile:${author.id}`}
      render={(post) => <PostCard key={post.id} post={post} author={author} reason={null} />}
    />
  );
}
