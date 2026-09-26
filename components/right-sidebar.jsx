"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagChip } from "@/components/tag-chip";
import { UserAvatar } from "@/components/user-avatar";
import { usePersona } from "@/lib/persona-context";
import { POSTS, PROFILES } from "@/lib/seed";
import { trendingTags, suggestedMentors } from "@/lib/rank";

export function RightSidebar() {
  const { persona } = usePersona();
  const tags = trendingTags(POSTS);
  const mentors = suggestedMentors(PROFILES, persona);

  return (
    <aside className="sticky top-0 hidden h-svh w-72 shrink-0 flex-col gap-4 overflow-y-auto px-4 py-4 lg:flex">
      <Card className="gap-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-primary" />
            Trending tags this week
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {tags.map(({ tag, count }) => (
            <TagChip key={tag} tag={tag} count={count} />
          ))}
        </CardContent>
      </Card>

      <Card className="gap-3">
        <CardHeader>
          <CardTitle className="text-base">Suggested mentors</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {mentors.map((m) => (
            <Link
              key={m.id}
              href={`/profile/${m.id}`}
              className="flex items-center gap-3 rounded-lg p-2 transition-all duration-300 ease-out hover:translate-x-0.5 hover:bg-muted/60"
            >
              <UserAvatar profile={m} className="size-9" textClassName="text-xs" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{m.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.course === persona.course
                    ? `${m.course} · matches your course`
                    : m.outcome ?? m.course}
                </p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <p className="px-2 text-xs text-muted-foreground">
        Sodu demo · seeded data, no live accounts
      </p>
    </aside>
  );
}
