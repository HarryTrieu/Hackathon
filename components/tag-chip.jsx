"use client";

import Link from "next/link";
import { Check, Plus } from "lucide-react";
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
      {/* A clear pill: outlined "+ Follow", solid "✓ Following". */}
      <button
        type="button"
        onClick={() => toggle(tag)}
        aria-pressed={following}
        className={cn(
          "relative ml-0.5 inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors max-md:after:absolute max-md:after:inset-x-0 max-md:after:-inset-y-2",
          following
            ? "border-primary bg-primary text-primary-foreground hover:bg-primary/85"
            : "border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
        )}
        title={following ? `Unfollow ${tag}` : `Follow ${tag} to see more of it in For you`}
      >
        {following ? <Check className="size-3" /> : <Plus className="size-3" />}
        {following ? "Following" : "Follow"}
      </button>
    </span>
  );
}
