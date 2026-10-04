"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, UserCheck, UserPlus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { usePersona } from "@/lib/persona-context";
import { useFollowing } from "@/lib/use-following";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

// Follow / Following on someone's profile (not for the moderator account);
// Edit profile on your own Google profile.
export function FollowButton({ profile, className }) {
  const { persona } = usePersona();
  const router = useRouter();
  const following = useFollowing(persona.id);
  if (!profile) return null;
  // Your own profile: Edit profile (name, course, units, delete account),
  // for Google accounts; demo profiles are shared, so they can't be edited.
  if (profile.id === persona.id) {
    if (!profile.id.startsWith("u-")) return null;
    return (
      <Link href="/welcome" className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-full", className)}>
        <Pencil data-icon="inline-start" />
        Edit profile
      </Link>
    );
  }
  if (persona.role === "admin" || profile.role === "admin") return null;
  const on = following.isFollowing(profile.id);
  const first = profile.name.split(" ")[0];

  async function toggle() {
    const error = await following.setFollow(profile.id, !on);
    if (error) toast(error, { tone: "info" });
    else {
      toast(on ? `Unfollowed ${first}` : `Following ${first}`);
      router.refresh();
    }
  }

  return (
    <Button
      size="sm"
      variant={on ? "outline" : "default"}
      className={cn("rounded-full", className)}
      disabled={!following.ready}
      onClick={toggle}
    >
      {on ? <UserCheck data-icon="inline-start" /> : <UserPlus data-icon="inline-start" />}
      {on ? "Following" : "Follow"}
    </Button>
  );
}
