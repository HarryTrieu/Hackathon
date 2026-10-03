"use client";

import { useRouter } from "next/navigation";
import { UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePersona } from "@/lib/persona-context";
import { useFollowing } from "@/lib/use-following";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

// Follow / Following on someone's profile. Hidden on your own profile and
// for the moderator account.
export function FollowButton({ profile, className }) {
  const { persona } = usePersona();
  const router = useRouter();
  const following = useFollowing(persona.id);
  if (!profile || profile.id === persona.id || persona.role === "admin" || profile.role === "admin") return null;
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
