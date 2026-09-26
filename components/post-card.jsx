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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { LinkPreview } from "@/components/link-preview";
import { RepliesPanel } from "@/components/replies";
import { SEED_MENTORS } from "@/lib/mentors";
import { usePersona } from "@/lib/persona-context";
import { getSeedReplies } from "@/lib/seed";
import { rememberVote, useLikedPosts } from "@/lib/use-liked";
import { useSavedPosts } from "@/lib/use-saved-posts";
import { ReportButton } from "@/components/report-button";
import { cn } from "@/lib/utils";

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

  const text = displayText(post);
  const clampable = text.length > CLAMP_THRESHOLD;

  if (gone) return null;

  return (
    <article className="group border-b px-4 py-4 transition-colors duration-300 ease-out hover:bg-foreground/[0.015]">
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
            <span className="text-sm text-muted-foreground">
              @{author.handle} · {relativeTime(post.hours_ago)}
            </span>
            {author.role === "mentor" && <Badge>Mentor</Badge>}
            <Badge variant="outline">
              {author.course}
              {author.year ? ` · Year ${author.year}` : " · Alumni"}
            </Badge>
            {author.verified && (
              <Badge variant="secondary">
                <BadgeCheck data-icon="inline-start" />
                Uni email verified
              </Badge>
            )}
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
            <div className="mt-2.5 overflow-hidden rounded-xl border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.image_url}
                alt={`Shared by ${author.name}`}
                loading="lazy"
                className="aspect-video w-full object-cover"
              />
            </div>
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

          <div className="mt-2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleHelpful}
              className={cn(
                "text-muted-foreground transition-colors duration-300 ease-out",
                helpful && "text-primary"
              )}
            >
              <ThumbsUp
                data-icon="inline-start"
                className={cn(helpful && "fill-primary/20")}
              />
              Helpful · {helpfulCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => savedPosts.toggle({ ...post, tags })}
              className={cn(
                "text-muted-foreground transition-colors duration-300 ease-out",
                saved && "text-primary"
              )}
            >
              <Bookmark
                data-icon="inline-start"
                className={cn(saved && "fill-primary/20")}
              />
              {saved ? "Saved" : "Save"}
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
              {seedReplyCount > 0 ? `Replies · ${seedReplyCount}` : "Reply"}
            </Button>
            {authorListing && !isAuthor && (
              <Link
                href={`/mentors/${authorListing.unit_code}/${author.id}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-muted-foreground transition-colors duration-300 ease-out hover:text-primary"
                )}
              >
                <MessageCircleQuestion data-icon="inline-start" />
                Ask {author.name.split(" ")[0]}&apos;s AI
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
                Delete
              </Button>
            )}
            <ReportButton targetType="post" targetId={post.id} className="ml-auto px-2 py-1" />
          </div>

          {repliesOpen && <RepliesPanel postId={post.id} />}
        </div>
      </div>
    </article>
  );
}
