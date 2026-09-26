import Link from "next/link";
import { BadgeCheck, Briefcase, Heart, Languages, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import { GRADE_LABELS } from "@/lib/mentors";
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
        "block rounded-xl border p-4 transition-all duration-300 ease-out hover:border-primary/40 hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <UserAvatar profile={profile} className="size-11" textClassName="text-sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {rank && <span className="text-xs font-semibold text-primary">#{rank}</span>}
            <span className="font-bold">{profile.name}</span>
            <Badge title={GRADE_LABELS[mentor.grade]}>{mentor.grade} in {mentor.unit_code}</Badge>
            {mentor.email_verified && (
              <Badge variant="secondary">
                <BadgeCheck data-icon="inline-start" />
                Deakin verified
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
            <p className="mt-2.5 flex gap-1.5 rounded-lg bg-primary/[0.05] p-2.5 text-sm">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>{reason}</span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
