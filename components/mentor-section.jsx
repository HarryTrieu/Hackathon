"use client";

import { useEffect, useState } from "react";
import { HeartHandshake } from "lucide-react";
import { MentorCard } from "@/components/mentor-card";
import { mergeLocalApplications } from "@/lib/mentors";

// Mentor listings for a profile. Session requests live in Messages >
// Sessions and the Mentor hub, not on the profile.
export function MentorSection({ profileId }) {
  const [listings, setListings] = useState([]);

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

    </section>
  );
}
