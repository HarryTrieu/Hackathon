import { notFound } from "next/navigation";
import {
  BadgeCheck,
  BookOpen,
  Briefcase,
  Link2,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { MentorSection } from "@/components/mentor-section";
import { ProfilePosts } from "@/components/profile-posts";
import { SavedTabContent, SavedTabTrigger } from "@/components/saved-posts";
import { StatRow } from "@/components/stat-row";
import { MessageButton } from "@/components/message-button";
import { UserAvatar } from "@/components/user-avatar";
import { reputationFor } from "@/lib/mentors";
import { getPostsByAuthor, getProfile, roleLabel } from "@/lib/seed";
import { supabaseAdmin } from "@/lib/supabase";
import { toProfile } from "@/lib/account";
import { BackButton } from "@/components/back-button";
import { ProfileLinks } from "@/components/profile-links";
import { ProfileResources } from "@/components/profile-resources";
import { FollowButton } from "@/components/follow-button";
import { followCounts } from "@/lib/follows";

// Helpful votes on the person's posts: live counts from the database, like
// the mentor page, so both pages agree. Seed counts when there is no DB.
async function helpfulVotes(profileId, seedPosts) {
  const db = supabaseAdmin();
  if (db) {
    const { data, error } = await db
      .from("posts")
      .select("author_id, helpful_count, status")
      .eq("author_id", profileId);
    if (!error && data) return reputationFor(profileId, data);
  }
  return reputationFor(profileId, seedPosts);
}

// Real (Google) accounts live only in the database, under ids like "u-<id>".
async function realProfile(id) {
  const db = supabaseAdmin();
  if (!db || !id.startsWith("u-")) return null;
  const { data } = await db.from("profiles").select("*").eq("id", id).maybeSingle();
  return data ? toProfile(data) : null;
}

// The person's posts (newest first), from the database. Demo personas too:
// their new posts and edited tags live there, not in the seed.
async function realPosts(profile) {
  const db = supabaseAdmin();
  if (!db) return [];
  const { data } = await db
    .from("posts")
    .select("*")
    .eq("author_id", profile.id)
    .neq("status", "removed")
    .order("created_at", { ascending: false })
    .limit(50);
  const now = Date.now();
  return (data ?? []).map((row) => ({
    ...row,
    hours_ago: Math.max(0, (now - new Date(row.created_at).getTime()) / 3600_000),
  }));
}

const plural = (n, word) => `${word}${n === 1 ? "" : "s"}`;

export default async function ProfilePage({ params, searchParams }) {
  const { id } = await params;
  // ?tab=saved opens your Saved tab (the phone menu links there).
  const { tab } = (await searchParams) ?? {};
  const profile = getProfile(id) ?? (await realProfile(id));
  if (!profile) notFound();

  // Database posts first; seed posts the database doesn't have (offline or
  // before seeding) fill in for demo personas.
  const dbPosts = await realPosts(profile);
  const dbIds = new Set(dbPosts.map((p) => p.id));
  const seedPosts = id.startsWith("u-") ? [] : getPostsByAuthor(id).filter((p) => !dbIds.has(p.id));
  const posts = [...dbPosts, ...seedPosts].sort((a, b) => a.hours_ago - b.hours_ago);
  const helpful = profile.role === "admin" ? 0 : await helpfulVotes(id, posts);
  const follows = await followCounts(id);

  return (
    <div className="pb-16 md:pb-0">
      <div className="relative overflow-hidden border-b px-4 pt-3 pb-6">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-primary/15 blur-3xl dark:bg-primary/10"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 size-48 rounded-full bg-primary/10 blur-3xl dark:bg-primary/[0.07]"
        />
        <BackButton className="relative -ml-2 mb-2" />
        {/* One centred column, like the mentor page. */}
        <div className="relative flex flex-col items-center gap-3 text-center">
          <UserAvatar
            profile={profile}
            className="size-20 ring-4 ring-background"
            textClassName="text-xl"
          />
          <div className="min-w-0">
            <h1 className="text-xl leading-tight font-bold">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">@{profile.handle}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              <Badge>{roleLabel(profile.role)}</Badge>
              {/* Moderator is a permission, separate from mentee / mentor. */}
              {profile.moderator && (
                <Badge variant="secondary">
                  <ShieldCheck data-icon="inline-start" />
                  Moderator
                </Badge>
              )}
              <Badge variant="outline">
                {profile.course}
                {profile.year ? ` · Year ${profile.year}` : profile.role === "admin" ? "" : " · Alumni"}
              </Badge>
              {profile.verified && (
                <Badge variant="secondary">
                  <BadgeCheck data-icon="inline-start" />
                  Deakin email verified
                </Badge>
              )}
            </div>
            {profile.outcome && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-sm">
                <Briefcase className="size-4 shrink-0 text-primary" />
                {profile.outcome}
              </p>
            )}
            <ProfileLinks profileId={profile.id} links={profile.links ?? []} />
          </div>
          <div className="flex flex-wrap justify-center gap-2 empty:hidden">
            <FollowButton profile={profile} />
            <MessageButton profile={profile} />
          </div>
        </div>
        {profile.role !== "admin" && (
          <StatRow
            className="relative mt-4"
            items={[
              [posts.length, plural(posts.length, "post")],
              [follows.followers, plural(follows.followers, "follower")],
              [helpful, plural(helpful, "helpful vote")],
              [profile.units.length, plural(profile.units.length, "unit")],
            ]}
          />
        )}
      </div>

      <MentorSection profileId={profile.id} />

      <Tabs defaultValue={tab === "saved" || tab === "path" ? tab : "posts"} className="gap-0">
        <div className="border-b">
          <TabsList variant="line" className="w-full justify-start px-2">
            <TabsTrigger value="posts" className="flex-none px-3 py-2">
              Posts
            </TabsTrigger>
            <TabsTrigger value="path" className="flex-none px-3 py-2">
              Path
            </TabsTrigger>
            <SavedTabTrigger profileId={profile.id} />
          </TabsList>
        </div>

        <TabsContent value="posts">
          {posts.length === 0 ? (
            <Empty className="my-8">
              <EmptyHeader>
                <EmptyTitle>No posts yet</EmptyTitle>
                <EmptyDescription>
                  {profile.name} hasn&apos;t shared anything so far.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ProfilePosts posts={posts} author={profile} />
          )}
        </TabsContent>

        <TabsContent value="path">
          <div className="flex flex-col gap-4 px-4 py-4">
            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="size-4 text-primary" />
                  Units taken
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {profile.units.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No units listed yet.
                  </p>
                )}
                {profile.units.map((unit) => (
                  <div
                    key={unit.code}
                    className="rounded-lg border p-3 transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <p className="text-sm font-semibold">
                      <span className="font-mono text-primary">{unit.code}</span>{" "}
                      · {unit.name}
                    </p>
                    {unit.tip && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        &ldquo;{unit.tip}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="size-4 text-primary" />
                  Resources used
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <ProfileResources profileId={profile.id} resources={profile.resources} />
              </CardContent>
            </Card>

            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="size-4 text-primary" />
                  Outcome
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {profile.outcome ??
                    `Currently studying ${profile.course}${profile.year ? `, year ${profile.year}` : ""}.`}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <SavedTabContent profileId={profile.id} />
      </Tabs>
    </div>
  );
}
