"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, MessageSquareText, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UNIVERSITY, unitsByCourse } from "@/lib/communities";
import { POSTS } from "@/lib/seed";

export default function CommunitiesPage() {
  const [posts, setPosts] = useState(POSTS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/posts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.posts) setPosts(data.posts);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = unitsByCourse(posts);

  return (
    <div className="pb-16 md:pb-0">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold">Communities</h1>
        <p className="text-sm text-muted-foreground">
          {UNIVERSITY} · one community per unit. Join the ones you are taking,
          mentor the ones you have beaten.
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
                  <Card className="h-full py-4 transition-all duration-300 ease-out hover:border-primary/40 hover:shadow-sm">
                    <CardContent className="px-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-bold">
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
                          {unit.memberIds.length} members
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquareText className="size-3.5" />
                          {unit.postCount} posts
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
