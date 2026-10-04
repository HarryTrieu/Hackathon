"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, MessageSquareText, GraduationCap, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HoverGlow } from "@/components/hover-glow";
import { UNIVERSITY, unitsByCourse } from "@/lib/communities";
import { POSTS } from "@/lib/seed";
import { INTERESTS, postsForInterest } from "@/lib/interests";

export default function CommunitiesPage() {
  const [posts, setPosts] = useState(POSTS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/posts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        // Database posts plus sample interest posts it doesn't have yet.
        if (!cancelled && data?.posts) {
          const ids = new Set(data.posts.map((p) => p.id));
          setPosts([...data.posts, ...POSTS.filter((p) => p.id.startsWith("in") && !ids.has(p.id))]);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = unitsByCourse(posts);

  return (
    <div className="pb-16 md:pb-0">
      <div className="sticky top-0 z-10 border-b bg-background md:bg-background/95 px-4 py-3 md:backdrop-blur">
        <h1 className="text-lg font-bold max-md:sr-only">Communities</h1>
        <p className="text-sm text-muted-foreground">
          {UNIVERSITY} · one community per unit: join the ones you are taking, mentor the ones you
          have beaten. Interests for life outside class are at the bottom.
        </p>
      </div>

      <div className="space-y-6 px-4 py-4">
        {groups.map(([course, units]) => (
          <section key={course}>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <GraduationCap className="size-4 text-primary" />
              {course}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {units.map((unit) => (
                <Link key={unit.code} href={`/unit/${unit.code}`}>
                  <Card className="relative h-full py-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/40">
                    <HoverGlow />
                    <CardContent className="relative px-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-bold text-primary">
                          {unit.code}
                        </span>
                        {unit.mentorIds.length > 0 && (
                          <Badge variant="secondary">
                            {unit.mentorIds.length}{" "}
                            {unit.mentorIds.length === 1 ? "mentor" : "mentors"}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-sm">
                        {unit.name ?? "Unit community"}
                      </p>
                      <p className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="size-3.5" />
                          {unit.memberIds.length} {unit.memberIds.length === 1 ? "member" : "members"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquareText className="size-3.5" />
                          {unit.postCount} {unit.postCount === 1 ? "post" : "posts"}
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            Interests: life outside your units
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {INTERESTS.map((interest) => {
              const count = postsForInterest(interest, posts).length;
              return (
                <Link key={interest.slug} href={`/interest/${interest.slug}`}>
                  <Card className="group/card relative h-full py-3 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/40">
                    <HoverGlow />
                    <CardContent className="relative flex items-center gap-2.5 px-3">
                      <span className="text-2xl" aria-hidden>
                        {interest.emoji}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{interest.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {count} {count === 1 ? "post" : "posts"}
                        </span>
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
