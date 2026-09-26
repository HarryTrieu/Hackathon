import Link from "next/link";
import { BadgeCheck, Briefcase, Heart, Languages, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import { gradeBand } from "@/lib/mentors";
import { cn } from "@/lib/utils";

export function MentorCard({ mentor, reason = null, rank = null, className }) {
  const { profile, style } = mentor;
  const current = mentor.show_experience
    ? mentor.experience?.find((e) => e.current) ?? mentor.experience?.[0]
    : null;

  return (
    <Link
      href={`/mentors/${mentor.unit_code}/${mentor.profile_id}`}
      className={cn(
        "relative block overflow-hidden rounded-xl border p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/50 hover:shadow-md",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-5 -right-5 size-16 rounded-full bg-gradient-to-br from-primary/40 via-sky-400/20 to-transparent blur-2xl dark:-top-8 dark:-right-8 dark:size-28"
      />
      <div className="relative flex items-start gap-3">
        <UserAvatar profile={profile} className="size-11" textClassName="text-sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {rank && <span className="text-xs font-semibold text-primary">#{rank}</span>}
            <span className="font-bold">{profile.name}</span>
            <Badge>{gradeBand(mentor.grade)} · {mentor.unit_code}</Badge>
            {mentor.email_verified && (
              <Badge variant="secondary">
                <BadgeCheck data-icon="inline-start" />
                Deakin verified
              </Badge>
            )}
            {mentor.is_demo && (
              <Badge variant="outline" className="text-muted-foreground">
                Sample data
              </Badge>
            )}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">${mentor.rate_per_hour}/h</span>
            <span className="flex items-center gap-1">
              <Heart className="size-3.5" />
              {mentor.reputation} helpful
            </span>
            <span className="flex items-center gap-1">
              <Languages className="size-3.5" />
              {style.languages.join(", ")}
            </span>
            {mentor.availability && <span>{mentor.availability}</span>}
            {current && (
              <span className="flex items-center gap-1">
                <Briefcase className="size-3.5" />
                {current.role}, {current.company}
              </span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[style.tone, style.teaching, style.pace].map((v) => (
              <Badge key={v} variant="outline" className="font-normal">
                {v}
              </Badge>
            ))}
          </div>
          {reason && (
            <p className="mt-2.5 flex gap-1.5 rounded-lg bg-primary/5 p-2.5 text-sm">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>
                <span className="font-semibold">Why this match: </span>
                {reason}
              </span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
