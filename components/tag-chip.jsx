"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useFollowedTags } from "@/lib/use-followed-tags";
import { cn } from "@/lib/utils";

export function TagChip({ tag, count = null, className }) {
  const { has, toggle } = useFollowedTags();
  const following = has(tag);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      <Link href={`/search?tag=${encodeURIComponent(tag)}`}>
        <Badge
          variant={following ? "default" : "secondary"}
          className="cursor-pointer transition-colors hover:border-primary/40"
        >
          {tag}
          {count != null && <span className="opacity-70">{count}</span>}
        </Badge>
      </Link>
      <button
        type="button"
        onClick={() => toggle(tag)}
        aria-pressed={following}
        className="rounded-full px-1.5 text-[10px] text-muted-foreground hover:text-primary"
        title={following ? `Unfollow ${tag}` : `Follow ${tag} to see more of it in For you`}
      >
        {following ? "Following" : "Follow"}
      </button>
    </span>
  );
}
