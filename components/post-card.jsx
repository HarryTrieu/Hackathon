"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Languages,
  ThumbsUp,
  Bookmark,
  MessageCircle,
  MessageCircleQuestion,
  Pencil,
  ShieldAlert,
  BadgeCheck,
  Trash2,
  EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { ImageLightbox } from "@/components/image-lightbox";
import { LinkPreview } from "@/components/link-preview";
import { RepliesPanel } from "@/components/replies";
import { SEED_MENTORS } from "@/lib/mentors";
import { usePersona } from "@/lib/persona-context";
import { getSeedReplies } from "@/lib/seed";
import { rememberVote, useLikedPosts } from "@/lib/use-liked";
import { useSavedPosts } from "@/lib/use-saved-posts";
import { ReportButton } from "@/components/report-button";
import { cn } from "@/lib/utils";
import styles from "./post-card.module.css";

function relativeTime(hoursAgo) {
  if (hoursAgo < 1) return "now";
  if (hoursAgo < 24) return `${Math.round(hoursAgo)}h`;
  return `${Math.round(hoursAgo / 24)}d`;
}

const CLAMP_THRESHOLD = 240;

// Chips share one calm transition: dim tint, short delay so passing the cursor
// over a card does not flash every chip in it.
const CHIP_HOVER =
  "cursor-default transition-colors duration-300 delay-150 ease-out hover:bg-primary/[0.07] hover:text-primary/90";

// The preview card already shows the destination, so drop a trailing bare URL.
function displayText(post) {
  const url = post.link_preview?.url;
  if (!url) return post.text;
  return post.text.endsWith(url)
    ? post.text.slice(0, -url.length).trimEnd()
    : post.text;
}

export function PostCard({ post, author, reason, onDeleted }) {
  const { persona } = usePersona();
  const { set: likedSet, ready: likesReady } = useLikedPosts(persona.id);
  const [expanded, setExpanded] = useState(false);
  const [vote, setVote] = useState(null);
  // Saved state loads from localStorage after hydration, so only pop the
  // bookmark after a real tap, not when an already-saved post appears.
  const [saveTapped, setSaveTapped] = useState(false);
  const savedPosts = useSavedPosts(persona.id);
  const saved = savedPosts.has(post.id);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [tags, setTags] = useState(post.tags);
  const [editingTags, setEditingTags] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [tagError, setTagError] = useState(null);
  const [gone, setGone] = useState(false);
  const seedReplyCount = getSeedReplies(post.id).length;
  const wasLiked = likesReady && likedSet.has(post.id);
  const helpful = vote === null ? wasLiked : vote;
  const helpfulCount = Math.max(0, post.helpful_count + (helpful ? 1 : 0) - (wasLiked ? 1 : 0));
  const isAuthor = persona.id === post.author_id;
  const isModerator = persona.role === "admin";
  // Prefer the mentor listing for a unit this post is about.
  const authorListings = SEED_MENTORS.filter((m) => m.profile_id === post.author_id);
  const authorListing =
    authorListings.find((m) => post.unit_codes.includes(m.unit_code)) ?? authorListings[0];

  function toggleHelpful() {
    const next = !helpful;
    setVote(next);
    rememberVote(persona.id, post.id, next);
    fetch("/api/helpful", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ post_id: post.id, profile_id: persona.id, action: next ? "like" : "unlike" }),
    }).catch(() => {});
  }

  async function saveTags(e) {
    e.preventDefault();
    const next = tagDraft
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
      .filter(Boolean);
    setTagError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: post.id, author_id: persona.id, tags: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTagError(data.error ?? "Could not save tags.");
        return;
      }
      setTags(data.tags);
      setEditingTags(false);
    } catch {
      setTagError("Could not save tags.");
    }
  }

  async function deletePost() {
    try {
      const res = await fetch("/api/posts", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: post.id, author_id: persona.id }),
      });
      if (!res.ok) return;
      setGone(true);
      onDeleted?.(post.id);
    } catch {
      /* keep the card */
    }
  }

  // Moderator "Remove from feed": the same soft removal as the /review queue
  // (status "removed", the row is kept), confirmed first because it changes
  // the shared feed for everyone.
  async function removeAsModerator() {
    const restore = post.is_demo
      ? "Reset demo brings sample posts back."
      : "Only someone with database access can bring it back.";
    if (!window.confirm(`Remove this post from the feed for everyone?

It is hidden, not deleted. ${restore}`)) return;
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ post_id: post.id, action: "remove" }),
      });
      if (!res.ok) return;
      setGone(true);
      onDeleted?.(post.id);
    } catch {
      /* keep the card */
    }
  }

  const text = displayText(post);
  const clampable = text.length > CLAMP_THRESHOLD;

  if (gone) return null;

  return (
    <article className="group relative overflow-hidden border-b px-4 py-4 transition-colors duration-300 ease-out hover:bg-foreground/[0.015]">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-5 -right-5 size-16 rounded-full bg-gradient-to-br from-primary/40 via-sky-400/20 to-transparent opacity-0 blur-2xl transition-opacity duration-300 ease-out group-hover:opacity-100 dark:-top-8 dark:-right-8 dark:size-28"
      />
      {reason && <p className="mb-2 pl-13 text-xs text-primary">{reason}</p>}

      <div className="flex gap-3">
        <Link href={`/profile/${author.id}`} className="shrink-0">
          <UserAvatar
            profile={author}
            className="transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            textClassName="text-sm"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <Link
              href={`/profile/${author.id}`}
              className="text-sm font-bold hover:underline"
            >
              {author.name}
            </Link>
            {author.verified && (
              <span title="Uni email verified" className="-ml-0.5 inline-flex text-primary">
                <BadgeCheck aria-hidden="true" className="size-4" />
                <span className="sr-only">Uni email verified</span>
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              @{author.handle} · {relativeTime(post.hours_ago)}
            </span>
            {author.role === "mentor" && <Badge>Mentor</Badge>}
            <Badge variant="outline">
              {author.course}
              {author.year ? ` · Year ${author.year}` : " · Alumni"}
            </Badge>
            {post.flag_reason && (
              <Badge variant="destructive" title={post.flag_reason}>
                <ShieldAlert data-icon="inline-start" />
                Flagged for review
              </Badge>
            )}
            {post.mocked && (
              <Badge variant="outline" className="text-muted-foreground">
                Mock AI
              </Badge>
            )}
          </div>

          <p
            className={cn(
              "mt-1.5 text-[15px] leading-relaxed whitespace-pre-wrap",
              clampable && !expanded && "line-clamp-4"
            )}
            lang={post.lang}
          >
            {text}
          </p>
          {clampable && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-0.5 text-sm font-medium text-primary hover:underline"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}

          {post.image_url && (
            <ImageLightbox
              src={post.image_url}
              alt={`Shared by ${author.name}`}
              className="mt-2.5 rounded-2xl border"
              imgClassName="aspect-[16/10] w-full object-cover"
            />
          )}

          {post.link_preview && (
            <LinkPreview preview={post.link_preview} className="mt-2.5" />
          )}

          {post.tldr && (
            <div className="mt-2.5 rounded-xl border bg-muted/40 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                AI summary · AI-generated
              </p>
              <p className="text-sm">{post.tldr}</p>
            </div>
          )}

          {post.lang !== "en" && post.summary_en && (
            <div className="mt-2.5 rounded-xl border bg-muted/40 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Languages className="size-3.5 text-primary" />
                English summary · AI-generated
              </p>
              <p className="text-sm">{post.summary_en}</p>
            </div>
          )}

          {editingTags ? (
            <form onSubmit={saveTags} className="mt-2.5 flex flex-wrap items-center gap-2">
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                placeholder="comma, separated, tags"
                autoFocus
                className="h-8 min-w-0 flex-1 rounded-full border bg-transparent px-3 text-sm outline-none focus:border-primary/50"
              />
              <Button type="submit" size="sm" className="rounded-full">
                Save tags
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditingTags(false)}>
                Cancel
              </Button>
              {tagError && <p className="w-full text-xs text-destructive">{tagError}</p>}
            </form>
          ) : (
            (post.unit_codes.length > 0 || tags.length > 0 || isAuthor) && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {post.unit_codes.map((code) => (
                  <Link key={code} href={`/unit/${code}`}>
                    <Badge
                      variant="outline"
                      className={cn("font-mono", CHIP_HOVER, "cursor-pointer")}
                    >
                      {code}
                    </Badge>
                  </Link>
                ))}
                {tags.map((tag) => (
                  <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`}>
                    <Badge variant="secondary" className={cn(CHIP_HOVER, "cursor-pointer")}>
                      {tag}
                    </Badge>
                  </Link>
                ))}
                {isAuthor && (
                  <button
                    type="button"
                    onClick={() => {
                      setTagDraft(tags.join(", "));
                      setEditingTags(true);
                    }}
                    className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-primary"
                    title="AI picked these tags. Fix them if they're wrong."
                  >
                    <Pencil className="size-3" />
                    Edit tags
                  </button>
                )}
              </div>
            )
          )}

          {/* On phones the labels are screen-reader only, so the row fits at 390px. */}
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleHelpful}
              className={cn(
                "text-muted-foreground transition-colors duration-300 ease-out",
                helpful && "text-primary"
              )}
            >
              {/* key remounts the icon on each toggle so the pop replays */}
              <ThumbsUp
                key={helpful ? "helpful" : "not-helpful"}
                data-icon="inline-start"
                className={cn(helpful && "fill-primary", vote === true && styles.pop)}
              />
              <span className="max-sm:sr-only">Helpful · </span>
              {helpfulCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRepliesOpen((v) => !v)}
              className={cn(
                "text-muted-foreground transition-colors duration-300 ease-out",
                repliesOpen && "text-primary"
              )}
            >
              <MessageCircle data-icon="inline-start" />
              {seedReplyCount > 0 ? (
                <>
                  <span className="max-sm:sr-only">Replies · </span>
                  {seedReplyCount}
                </>
              ) : (
                <span className="max-sm:sr-only">Reply</span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSaveTapped(true);
                savedPosts.toggle({ ...post, tags });
              }}
              className={cn(
                "text-muted-foreground transition-colors duration-300 ease-out",
                saved && "text-primary"
              )}
            >
              {/* key remounts the icon on each toggle so the pop replays */}
              <Bookmark
                key={saved ? "saved" : "not-saved"}
                data-icon="inline-start"
                className={cn(saved && "fill-primary", saved && saveTapped && styles.pop)}
              />
              <span className="max-sm:sr-only">{saved ? "Saved" : "Save"}</span>
            </Button>
            {/* The moderator can't chat with mentor AIs (the chat API only accepts
                student and mentor profiles), and the row needs the room for Remove. */}
            {authorListing && !isAuthor && !isModerator && (
              <Link
                href={`/mentors/${authorListing.unit_code}/${author.id}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-muted-foreground transition-colors duration-300 ease-out hover:text-primary"
                )}
              >
                <MessageCircleQuestion data-icon="inline-start" />
                Ask <span className="max-sm:hidden">{author.name.split(" ")[0]}&apos;s</span> AI
              </Link>
            )}
            {isAuthor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={deletePost}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 data-icon="inline-start" />
                <span className="max-sm:sr-only">Delete</span>
              </Button>
            )}
            {isModerator && (
              <Button
                variant="ghost"
                size="sm"
                onClick={removeAsModerator}
                title="Remove from feed (moderator)"
                className="text-muted-foreground hover:text-destructive"
              >
                <EyeOff data-icon="inline-start" />
                <span className="max-sm:sr-only">Remove</span>
                <span className="sr-only"> from feed (moderator)</span>
              </Button>
            )}
            <ReportButton
              targetType="post"
              targetId={post.id}
              className="ml-auto px-2 py-1 max-sm:p-2"
              labelClassName="max-sm:sr-only"
              formClassName="basis-full"
            />
          </div>

          {repliesOpen && <RepliesPanel postId={post.id} />}
        </div>
      </div>
    </article>
  );
}
