import { notFound } from "next/navigation";
import {
  BadgeCheck,
  BookOpen,
  Briefcase,
  ExternalLink,
  Link2,
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
import { PostCard } from "@/components/post-card";
import { UserAvatar } from "@/components/user-avatar";
import { getPostsByAuthor, getProfile } from "@/lib/seed";

export default async function ProfilePage({ params }) {
  const { id } = await params;
  const profile = getProfile(id);
  if (!profile) notFound();

  const posts = getPostsByAuthor(id).sort((a, b) => a.hours_ago - b.hours_ago);

  return (
    <div className="pb-16 md:pb-0">
      <div className="border-b bg-gradient-to-b from-primary/[0.06] to-transparent px-4 py-6">
        <div className="flex items-start gap-4">
          <UserAvatar
            profile={profile}
            className="size-16 ring-4 ring-background"
            textClassName="text-xl"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">@{profile.handle}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge>{profile.role === "mentor" ? "Mentor" : "Mentee"}</Badge>
              <Badge variant="outline">
                {profile.course}
                {profile.year ? ` · Year ${profile.year}` : " · Alumni"}
              </Badge>
              {profile.verified && (
                <Badge variant="secondary">
                  <BadgeCheck data-icon="inline-start" />
                  Deakin email verified
                </Badge>
              )}
            </div>
            {profile.outcome && (
              <p className="mt-3 flex items-center gap-1.5 text-sm">
                <Briefcase className="size-4 text-primary" />
                {profile.outcome}
              </p>
            )}
          </div>
        </div>
      </div>

      <MentorSection profileId={profile.id} />

      <Tabs defaultValue="posts" className="gap-0">
        <div className="border-b">
          <TabsList variant="line" className="w-full justify-start px-2">
            <TabsTrigger value="posts" className="flex-none px-3 py-2">
              Posts
            </TabsTrigger>
            <TabsTrigger value="path" className="flex-none px-3 py-2">
              Path
            </TabsTrigger>
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
            posts.map((post) => (
              <PostCard key={post.id} post={post} author={profile} reason={null} />
            ))
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
                {profile.resources.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No resources listed yet.
                  </p>
                )}
                {profile.resources.map((res) => (
                  <a
                    key={res.label}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border p-3 text-sm transition-all hover:border-primary/40 hover:bg-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="font-medium">{res.label}</span>
                      <Badge variant="secondary" className="ml-2">
                        {res.type}
                      </Badge>
                    </span>
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                  </a>
                ))}
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
      </Tabs>
    </div>
  );
}
