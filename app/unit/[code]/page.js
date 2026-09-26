"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Users, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PostCard } from "@/components/post-card";
import { UserAvatar } from "@/components/user-avatar";
import { usePersona } from "@/lib/persona-context";
import {
  getUnit,
  readLocalMemberships,
  writeLocalMembership,
} from "@/lib/communities";
import { getProfile, POSTS } from "@/lib/seed";
import { cn } from "@/lib/utils";

export default function UnitPage() {
  const { code: rawCode } = useParams();
  const code = String(rawCode).toUpperCase();
  const { persona } = usePersona();

  const [posts, setPosts] = useState(POSTS);
  // null | "member" | "mentor" for the current persona, from DB or localStorage.
  const [myRole, setMyRole] = useState(null);
  const [note, setNote] = useState(null);

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

  // Load the persona's membership: DB when available, localStorage otherwise.
  useEffect(() => {
    let cancelled = false;
    // Microtask so the setState runs as a callback, not in the effect body.
    Promise.resolve().then(() => {
      if (!cancelled) {
        setMyRole(readLocalMemberships()[persona.id]?.[code] ?? null);
      }
    });
    fetch(`/api/membership?profile_id=${encodeURIComponent(persona.id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.memberships) return;
        const row = data.memberships.find((m) => m.unit_code === code);
        if (row) setMyRole(row.role);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [persona.id, code]);

  const unit = useMemo(() => getUnit(code, posts), [code, posts]);
  const unitPosts = useMemo(
    () =>
      posts.filter(
        (p) => p.unit_codes?.includes(code) && p.status !== "removed"
      ),
    [posts, code]
  );

  async function setRole(next) {
    const action =
      next === null ? "leave" : next === "mentor" ? "mentor" : "join";
    setMyRole(next);
    writeLocalMembership(persona.id, code, next);
    try {
      const res = await fetch("/api/membership", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          profile_id: persona.id,
          unit_code: code,
          action,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNote("Could not sync to the database, saved on this device only.");
      } else if (data.mocked) {
        setNote("Saved on this device only: add Supabase keys to sync memberships.");
      } else {
        setNote(null);
      }
    } catch {
      setNote("Could not reach the server, saved on this device only.");
    }
  }

  if (!unit) {
    return (
      <Empty className="py-20">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users />
          </EmptyMedia>
          <EmptyTitle>No community for {code} yet</EmptyTitle>
          <EmptyDescription>
            A unit community appears once someone posts about it.{" "}
            <Link href="/communities" className="text-primary hover:underline">
              Browse communities
            </Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const isMember = myRole !== null;
  const isMentor = myRole === "mentor";
  // Baseline people from seed activity, plus the persona if joined here.
  const memberIds = [...new Set([...unit.memberIds, ...(isMember ? [persona.id] : [])])];
  const mentorIds = [...new Set([...unit.mentorIds, ...(isMentor ? [persona.id] : [])])];

  return (
    <div className="pb-16 md:pb-0">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/communities"
            aria-label="Back to communities"
            className="rounded-full p-1.5 transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-mono text-lg font-bold">{unit.code}</h1>
            <p className="truncate text-sm text-muted-foreground">
              {unit.name ?? "Unit community"}
              {unit.course ? ` · ${unit.course}` : ""}
            </p>
          </div>
          <Button
            size="sm"
            variant={isMember ? "outline" : "default"}
            className="rounded-full"
            onClick={() => setRole(isMember ? null : "member")}
          >
            {isMember ? "Joined" : "Join"}
          </Button>
          <Button
            size="sm"
            variant={isMentor ? "secondary" : "outline"}
            className={cn("rounded-full", isMentor && "text-primary")}
            onClick={() => setRole(isMentor ? "member" : "mentor")}
            title="Mentors offer help to students taking this unit"
          >
            <Star
              data-icon="inline-start"
              className={cn(isMentor && "fill-primary/30")}
            />
            {isMentor ? "Mentoring" : "Become a mentor"}
          </Button>
        </div>
        {note && <p className="mt-1.5 text-xs text-muted-foreground">{note}</p>}
      </div>

      <div className="border-b px-4 py-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          {memberIds.length} members · {mentorIds.length}{" "}
          {mentorIds.length === 1 ? "mentor" : "mentors"}
        </p>
        <div className="flex flex-wrap gap-2">
          {memberIds.map((id) => {
            const profile = getProfile(id);
            if (!profile) return null;
            const mentorHere = mentorIds.includes(id);
            return (
              <Link
                key={id}
                href={`/profile/${id}`}
                className="flex items-center gap-1.5 rounded-full border py-1 pr-2.5 pl-1 transition-colors duration-300 ease-out hover:bg-muted"
              >
                <UserAvatar
                  profile={profile}
                  className="size-6"
                  textClassName="text-[9px]"
                />
                <span className="text-xs font-medium">{profile.name}</span>
                {mentorHere && (
                  <Badge variant="secondary" className="px-1.5 text-[10px]">
                    <Star className="size-2.5 fill-primary/30 text-primary" />
                    Mentor
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {unitPosts.map((post) => {
        const author = getProfile(post.author_id);
        if (!author) return null;
        return <PostCard key={post.id} post={post} author={author} reason={null} />;
      })}
      {unitPosts.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          No posts mention {unit.code} yet.
        </p>
      )}
    </div>
  );
}
