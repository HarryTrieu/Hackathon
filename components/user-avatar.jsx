"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const TINTS = [
  "bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-100",
  "bg-teal-100 text-teal-800 dark:bg-teal-900/70 dark:text-teal-100",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-100",
  "bg-rose-100 text-rose-800 dark:bg-rose-900/70 dark:text-rose-100",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-100",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-100",
  "bg-orange-100 text-orange-800 dark:bg-orange-900/70 dark:text-orange-100",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/70 dark:text-cyan-100",
];

const STYLES = ["bottts", "fun-emoji", "shapes", "identicon", "lorelei", "adventurer", "notionists", "thumbs"];

function hashSeed(seed) {
  let sum = 0;
  for (const char of seed) sum += char.charCodeAt(0);
  return sum;
}

function tintFor(seed) {
  return TINTS[hashSeed(seed) % TINTS.length];
}

export function avatarUrl(profile) {
  if (profile.avatar) return profile.avatar;
  const style = STYLES[hashSeed(profile.handle) % STYLES.length];
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(profile.handle)}`;
}

export function initials(name) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);
}

// Google profile photos (lh3.googleusercontent.com) sometimes refuse a
// request, e.g. when many load at once. Load them without a referrer and
// retry once before falling back to initials.
export function UserAvatar({ profile, className, textClassName }) {
  const [attempt, setAttempt] = useState(0); // 0 first try, 1 retry, 2 gave up
  const src = avatarUrl(profile);
  return (
    <Avatar className={cn("size-10", className)}>
      {attempt < 2 && (
        <AvatarImage
          key={attempt}
          src={attempt === 1 ? `${src}${src.includes("?") ? "&" : "?"}retry=1` : src}
          alt={`${profile.name} profile picture`}
          referrerPolicy="no-referrer"
          onError={() => (attempt === 0 ? setTimeout(() => setAttempt(1), 1500) : setAttempt(2))}
        />
      )}
      <AvatarFallback className={cn("font-semibold", tintFor(profile.handle), textClassName)}>
        {initials(profile.name)}
      </AvatarFallback>
    </Avatar>
  );
}
