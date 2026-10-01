"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function count(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

// The same totals an advertiser would get: per ad, never per student.
export function SponsoredStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sponsored")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="border-b px-4 py-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <Megaphone className="size-4 text-primary" />
        Sponsored posts
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Views and clicks per ad. These totals are all an advertiser sees; Sodu never records
        which student viewed or clicked.
        {stats && !stats.persisted && " Not saved yet: counts reset when the server restarts."}
      </p>
      {stats === null && <Skeleton className="h-20 w-full rounded-xl" />}
      {stats && (
        <>
          <p className="mb-2 text-sm">
            {count(stats.totals.impressions, "view")} · {count(stats.totals.clicks, "click")} ·{" "}
            {stats.totals.ctr}% click rate
          </p>
          <ul className="flex flex-col divide-y rounded-xl border text-sm">
            {stats.ads.map((ad) => (
              <li key={ad.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3 py-2">
                <span className="min-w-0">
                  <span className="font-medium">{ad.advertiser}</span>
                  <span className="text-muted-foreground"> · {ad.headline}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {count(ad.impressions, "view")} · {count(ad.clicks, "click")} · {ad.ctr}% ·{" "}
                  {ad.hides} hidden
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
