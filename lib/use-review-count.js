"use client";

import { useEffect, useSyncExternalStore } from "react";

// Items waiting in /review for a moderator (nav badge, first tab). Refreshed
// every 30 s, on a realtime ping, and after a review action.
const cache = new Map(); // moderatorId -> counts
const listeners = new Set();
const EMPTY = null;

function emit() {
  for (const cb of listeners) cb();
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function refreshReviewCount(moderatorId) {
  if (!moderatorId) return;
  try {
    const res = await fetch(`/api/review/count?moderator_id=${encodeURIComponent(moderatorId)}`, { cache: "no-store" });
    if (!res.ok) return;
    cache.set(moderatorId, await res.json());
    emit();
  } catch {
    // Keep the last count.
  }
}

export function useReviewCount(moderatorId) {
  const counts = useSyncExternalStore(subscribe, () => cache.get(moderatorId) ?? EMPTY, () => EMPTY);
  useEffect(() => {
    if (!moderatorId) return;
    refreshReviewCount(moderatorId);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refreshReviewCount(moderatorId);
    }, 30_000);
    const onPing = () => refreshReviewCount(moderatorId);
    window.addEventListener("sodu:changed", onPing);
    return () => {
      clearInterval(timer);
      window.removeEventListener("sodu:changed", onPing);
    };
  }, [moderatorId]);
  return counts;
}
