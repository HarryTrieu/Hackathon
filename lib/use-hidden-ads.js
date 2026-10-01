"use client";

import { useMemo, useSyncExternalStore } from "react";

// { [personaId]: [adId, ...] } so each demo persona hides ads separately.
export const HIDDEN_ADS_KEY = "sodu-hidden-ads";

const listeners = new Set();

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function readAll() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(HIDDEN_ADS_KEY)) ?? {};
  } catch {
    return {};
  }
}

function getSnapshot() {
  return window.localStorage.getItem(HIDDEN_ADS_KEY) ?? "{}";
}

function getServerSnapshot() {
  return "{}";
}

export function useHiddenAds(personaId) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ids = useMemo(() => {
    try {
      return JSON.parse(raw)[personaId] ?? [];
    } catch {
      return [];
    }
  }, [raw, personaId]);

  function hide(adId) {
    const all = readAll();
    all[personaId] = [...new Set([...(all[personaId] ?? []), adId])];
    window.localStorage.setItem(HIDDEN_ADS_KEY, JSON.stringify(all));
    for (const cb of listeners) cb();
  }

  return { ids, hide };
}
