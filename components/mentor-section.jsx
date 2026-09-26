"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, HeartHandshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MentorCard } from "@/components/mentor-card";
import { UserAvatar } from "@/components/user-avatar";
import { mergeLocalApplications } from "@/lib/mentors";
import { usePersona } from "@/lib/persona-context";
import { getProfile } from "@/lib/seed";

// Mentor listings for a profile, plus incoming session requests when the
// current persona is looking at their own profile.
export function MentorSection({ profileId }) {
  const { persona } = usePersona();
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState(null);
  const isSelf = persona.id === profileId;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mentors?include=pending")
      .then((res) => (res.ok ? res.json() : { mentors: [] }))
      .then((data) => {
        if (cancelled) return;
        const all = mergeLocalApplications(data.mentors, { includePending: true });
        setListings(all.filter((m) => m.profile_id === profileId && m.status !== "rejected"));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  useEffect(() => {
    if (!isSelf) return;
    let cancelled = false;
    fetch(`/api/session-request?mentor_id=${profileId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setRequests(data?.requests ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isSelf, profileId]);

  if (listings.length === 0) return null;

  return (
    <section className="space-y-3 border-b px-4 py-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <HeartHandshake className="size-4 text-primary" />
        Mentoring
      </h2>
      {listings.map((m) =>
        m.status === "approved" ? (
          <MentorCard key={m.id} mentor={m} />
        ) : (
          <p key={m.id} className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">{m.unit_code}</span> application is
            waiting for human review.
          </p>
        )
      )}

      {isSelf && requests && (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <CalendarCheck className="size-4 text-primary" />
            Session requests
            <Badge variant="secondary">{requests.length}</Badge>
          </p>
          {requests.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No requests yet. Posting helpful answers in{" "}
              <Link href="/communities" className="text-primary hover:underline">
                your unit communities
              </Link>{" "}
              raises your profile in mentor search.
            </p>
          )}
          {requests.map((r) => {
            const mentee = getProfile(r.mentee_id);
            if (!mentee) return null;
            return (
              <div key={r.id} className="flex gap-2.5 rounded-xl border p-3">
                <UserAvatar profile={mentee} className="size-8" textClassName="text-xs" />
                <div className="min-w-0 text-sm">
                  <p>
                    <span className="font-semibold">{mentee.name}</span>{" "}
                    <span className="text-muted-foreground">
                      · {r.unit_code} · ${r.rate_per_hour}/h
                    </span>
                  </p>
                  <p className="mt-0.5">{r.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
