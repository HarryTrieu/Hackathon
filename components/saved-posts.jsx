"use client";

import { TabsContent, TabsTrigger } from "@/components/ui/tabs";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { PostCard } from "@/components/post-card";
import { usePersona } from "@/lib/persona-context";
import { getProfile } from "@/lib/seed";
import { useSavedPosts } from "@/lib/use-saved-posts";

// Saved posts are private to the active persona, so the tab only shows on
// your own profile.
export function SavedTabTrigger({ profileId }) {
  const { persona } = usePersona();
  if (persona.id !== profileId) return null;
  return (
    <TabsTrigger value="saved" className="flex-none px-3 py-2">
      Saved
    </TabsTrigger>
  );
}

export function SavedTabContent({ profileId }) {
  const { persona } = usePersona();
  const { posts } = useSavedPosts(persona.id);
  if (persona.id !== profileId) return null;

  const items = posts
    .map((post) => ({ post, author: getProfile(post.author_id) }))
    .filter(({ author }) => author);

  return (
    <TabsContent value="saved">
      {items.length === 0 ? (
        <Empty className="my-8">
          <EmptyHeader>
            <EmptyTitle>Nothing saved yet</EmptyTitle>
            <EmptyDescription>
              Tap Save on any post and it will show up here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        items.map(({ post, author }) => (
          <PostCard key={post.id} post={post} author={author} reason={null} />
        ))
      )}
    </TabsContent>
  );
}
