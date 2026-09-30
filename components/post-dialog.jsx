"use client";

import { useState } from "react";
import { PenLine, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Composer } from "@/components/composer";

// The home feed listens for this so a post made from the popup shows up
// without a refetch.
export const POST_PUBLISHED_EVENT = "sodu:post-published";

// Left-nav "Post" button: opens the composer in a popup on whatever page
// you are on, closes it once the post is published. compact: the round
// floating "+" used on mobile (see floating-post-button.jsx).
export function PostDialogButton({ compact = false }) {
  const [open, setOpen] = useState(false);

  function handlePublished(post) {
    window.dispatchEvent(new CustomEvent(POST_PUBLISHED_EVENT, { detail: post }));
    setOpen(false);
  }

  return (
    <>
      {compact ? (
        <Button
          aria-label="Create post"
          className="size-14 rounded-full shadow-lg"
          onClick={() => setOpen(true)}
        >
          <Plus className="size-6" />
        </Button>
      ) : (
        <Button
          size="lg"
          className="mt-3 w-full rounded-full text-base font-semibold shadow-sm transition-all hover:shadow-md"
          onClick={() => setOpen(true)}
        >
          <PenLine data-icon="inline-start" />
          Post
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-lg">
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="text-center text-lg font-bold">
              Create post
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 py-4">
            {/* Mounted only while open, so each open starts with an empty draft. */}
            {open && <Composer inDialog onPublished={handlePublished} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
