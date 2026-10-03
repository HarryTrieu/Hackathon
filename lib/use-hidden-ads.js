"use client";

import { useSyncExternalStore } from "react";

// Ads you hid, per persona, kept in memory only: they stay hidden while you
// move around the app and come back when the page is refreshed (user's call:
// hiding an ad shouldn't remove it for good).
const hidden = new Map(); // personaId -> adId[]
const listeners = new Set();
const NONE = [];

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useHiddenAds(personaId) {
  const ids = useSyncExternalStore(
    subscribe,
    () => hidden.get(personaId) ?? NONE,
    () => NONE
  );

  function hide(adId) {
    hidden.set(personaId, [...new Set([...(hidden.get(personaId) ?? []), adId])]);
    for (const cb of listeners) cb();
  }

  return { ids, hide };
}
