"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Sparkles, Star, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UNIVERSITY, unitsByCourse } from "@/lib/communities";
import { cn } from "@/lib/utils";

export default function MentorsPage() {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mentors")
      .then((res) => (res.ok ? res.json() : { mentors: [] }))
      .then(({ mentors }) => {
        if (cancelled) return;
        const byUnit = {};
        for (const m of mentors) byUnit[m.unit_code] = (byUnit[m.unit_code] ?? 0) + 1;
        setCounts(byUnit);
      })
      .catch(() => !cancelled && setCounts({}));
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = unitsByCourse();

  return (
    <div className="pb-16 md:pb-0">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold">Find a mentor</h1>
        <p className="text-sm text-muted-foreground">
          Peer mentors who scored Distinction or above. Chat with their AI first, then book the real person.
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <label className="flex items-center gap-1.5">
            University
            <select disabled className="h-8 rounded-md border bg-transparent px-2 text-sm" value="deakin">
              <option value="deakin">{UNIVERSITY}</option>
            </select>
          </label>
          <span className="text-xs text-muted-foreground self-center">Then pick a unit below.</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <p className="flex items-center gap-2 text-sm">
          <Sparkles className="size-4 text-primary" />
          Got a D or HD in a unit? Earn by mentoring it.
        </p>
        <Link
          href="/mentor/apply"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
        >
          <UserPlus data-icon="inline-start" />
          Become a mentor
        </Link>
      </div>

      <div className="space-y-6 px-4 py-4">
        {groups.map(([course, units]) => (
          <section key={course}>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <GraduationCap className="size-4 text-primary" />
              {course}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {units.map((unit) => {
                const n = counts?.[unit.code] ?? 0;
                return (
                  <Link key={unit.code} href={`/mentors/${unit.code}`}>
                    <Card className="h-full py-4 transition-all duration-300 ease-out hover:border-primary/40 hover:shadow-sm">
                      <CardContent className="px-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-bold">{unit.code}</span>
                          {counts === null ? (
                            <Skeleton className="h-5 w-16" />
                          ) : (
                            <Badge variant={n > 0 ? "default" : "outline"}>
                              <Star data-icon="inline-start" />
                              {n} {n === 1 ? "mentor" : "mentors"}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-sm">
                          {unit.name ?? "Unit"}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
