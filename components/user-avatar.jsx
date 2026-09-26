import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Muted tints only, so 40 avatars add colour without competing with the accent.
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

function tintFor(seed) {
  let sum = 0;
  for (const char of seed) sum += char.charCodeAt(0);
  return TINTS[sum % TINTS.length];
}

export function initials(name) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);
}

export function UserAvatar({ profile, className, textClassName }) {
  return (
    <Avatar className={cn("size-10", className)}>
      <AvatarFallback
        className={cn(
          "font-semibold",
          tintFor(profile.handle),
          textClassName
        )}
      >
        {initials(profile.name)}
      </AvatarFallback>
    </Avatar>
  );
}
