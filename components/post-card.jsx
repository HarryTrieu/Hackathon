"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Languages,
  ThumbsUp,
  Bookmark,
  MessageCircleQuestion,
  ShieldAlert,
  BadgeCheck,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
}

function relativeTime(hoursAgo) {
  if (hoursAgo < 1) return "now";
  if (hoursAgo < 24) return `${Math.round(hoursAgo)}h`;
  return `${Math.round(hoursAgo / 24)}d`;
}

const CLAMP_THRESHOLD = 240;

export function PostCard({ post, author, reason }) {
  const [expanded, setExpanded] = useState(false);
  const [helpful, setHelpful] = useState(false);
  const [saved, setSaved] = useState(false);

  const clampable = post.text.length > CLAMP_THRESHOLD;

  return (
    <article className="group border-b px-4 py-4 transition-colors hover:bg-muted/40">
      {reason && (
        <p className="mb-2 pl-13 text-xs text-primary">{reason}</p>
      )}

      <div className="flex gap-3">
        <Link href={`/profile/${author.id}`} className="shrink-0">
          <Avatar className="size-10 transition-transform group-hover:scale-105">
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {initials(author.name)}
            </AvatarFallback>
          </Avatar>
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
          </div>

          <p
            className={cn(
              "mt-1.5 text-[15px] leading-relaxed whitespace-pre-wrap",
              clampable && !expanded && "line-clamp-4"
            )}
            lang={post.lang}
          >
            {post.text}
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

          {post.tldr && (
            <div className="mt-2.5 rounded-xl border bg-muted/50 p-3 transition-colors group-hover:bg-muted/70">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                AI summary · AI-generated
              </p>
              <p className="text-sm">{post.tldr}</p>
            </div>
          )}

          {post.lang === "vi" && post.summary_en && (
            <div className="mt-2.5 rounded-xl border bg-muted/50 p-3 transition-colors group-hover:bg-muted/70">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Languages className="size-3.5 text-primary" />
                English summary · AI-generated
              </p>
              <p className="text-sm">{post.summary_en}</p>
            </div>
          )}

          {(post.unit_codes.length > 0 || post.tags.length > 0) && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {post.unit_codes.map((code) => (
                <Badge
                  key={code}
                  variant="outline"
                  className="cursor-default font-mono transition-all hover:border-primary/50 hover:text-primary"
                >
                  {code}
                </Badge>
              ))}
              {post.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-default transition-all hover:bg-primary/10 hover:text-primary"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHelpful((v) => !v)}
              className={cn(
                "text-muted-foreground",
                helpful && "text-primary"
              )}
            >
              <ThumbsUp
                data-icon="inline-start"
                className={cn(helpful && "fill-primary/20")}
              />
              Helpful · {post.helpful_count + (helpful ? 1 : 0)}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSaved((v) => !v)}
              className={cn(
                "text-muted-foreground",
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
              disabled
              title="Wired in build step 4"
              className="text-muted-foreground"
            >
              <MessageCircleQuestion data-icon="inline-start" />
              Ask the author
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
