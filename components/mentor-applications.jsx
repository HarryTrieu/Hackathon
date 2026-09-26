"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Check, ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { GRADE_LABELS, mergeLocalApplications, saveLocalApplication } from "@/lib/mentors";

// Pending mentor applications. A person checks grade + transcript and
// approves; only then does the AI mentor appear in search.
export function MentorApplications() {
  const [apps, setApps] = useState([]);
  const [note, setNote] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mentors?include=pending")
      .then((res) => (res.ok ? res.json() : { mentors: [] }))
      .then((data) => {
        if (cancelled) return;
        const all = mergeLocalApplications(data.mentors, { includePending: true });
        setApps(all.filter((m) => m.status === "pending"));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function decide(app, action) {
    try {
      const res = await fetch("/api/mentors/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: app.id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNote(data.error ?? "Action failed.");
        return;
      }
      if (!data.persisted) {
        const { profile: _p, reputation: _r, local: _l, ...raw } = app;
        saveLocalApplication({ ...raw, status: data.status });
      }
      setApps((prev) => prev.filter((a) => a.id !== app.id));
      setNote(
        `${app.profile.name} ${action === "approve" ? "approved: their AI mentor is now live" : "rejected"} for ${app.unit_code}.`
      );
    } catch {
      setNote("Action failed. Check your connection.");
    }
  }

  if (apps.length === 0 && !note) return null;

  return (
    <section className="border-b px-4 py-4">
      <h2 className="mb-1 text-sm font-semibold">Mentor applications</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Check the grade and transcript before approving. Approved mentors become searchable.
      </p>
      {note && <p className="mb-3 rounded-lg bg-muted/60 px-3 py-2 text-sm">{note}</p>}
      <div className="flex flex-col gap-3">
        {apps.map((app) => (
          <Card key={app.id} className="gap-3">
            <CardContent className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <UserAvatar profile={app.profile} className="size-8" textClassName="text-xs" />
                <span className="text-sm font-semibold">{app.profile.name}</span>
                <Badge variant="outline" className="font-mono">{app.unit_code}</Badge>
                <Badge>{GRADE_LABELS[app.grade]} (claimed)</Badge>
                {app.email_verified && (
                  <Badge variant="secondary">
                    <BadgeCheck data-icon="inline-start" />
                    Deakin email
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">${app.rate_per_hour}/h</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {app.style.tone} · {app.style.teaching} · {app.style.languages.join(", ")}
              </p>
              <p className="text-sm">&ldquo;{app.voice.about}&rdquo;</p>
              {app.transcript_url ? (
                <a
                  href={app.transcript_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="size-3.5" />
                  View transcript
                </a>
              ) : (
                <p className="text-xs text-muted-foreground">No transcript uploaded: ask for one before approving.</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => decide(app, "approve")}>
                  <Check data-icon="inline-start" />
                  Approve mentor
                </Button>
                <Button size="sm" variant="destructive" onClick={() => decide(app, "reject")}>
                  <X data-icon="inline-start" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
