"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { usePersona } from "@/lib/persona-context";
import { cn } from "@/lib/utils";

// "Message <name>": opens the conversation with this person. Hidden on your
// own profile and for the demo Moderator, who doesn't chat.
export function MessageButton({ profile, className }) {
  const { persona } = usePersona();
  if (!profile || profile.id === persona.id || persona.role === "admin" || profile.role === "admin") return null;
  return (
    <Link
      href={`/messages/${profile.id}`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full", className)}
    >
      <MessageCircle data-icon="inline-start" />
      Message
    </Link>
  );
}
