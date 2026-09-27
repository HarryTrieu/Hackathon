"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// Served from cache, refetched in the background once older than this.
const FRESH_MS = 15_000;

// Read state is per persona in localStorage: the set of notification keys
// already seen. Keys change when a request's status changes, so updates
// show as unread again without a DB column.
const seenKey = (personaId) => `sodu-notif-seen:${personaId}`;
const MAX_SEEN = 500;

const listeners = new Set();

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function readSeenRaw(personaId) {
  try {
    return window.localStorage.getItem(seenKey(personaId)) ?? "[]";
  } catch {
    return "[]";
  }
}

function parseSeen(raw) {
  try {
    const list = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

export function markSeen(personaId, keys) {
  const seen = parseSeen(readSeenRaw(personaId));
  for (const key of keys) seen.add(key);
  try {
    window.localStorage.setItem(seenKey(personaId), JSON.stringify([...seen].slice(-MAX_SEEN)));
  } catch {
    // Storage blocked: the badge just stays until next time.
  }
  for (const cb of listeners) cb();
}

// One shared cache for every hook instance (desktop nav, mobile nav, page):
// personaId -> { data, at }. At most one request per persona is in flight,
// except a forced reload, and an older response never overwrites a newer one.
const cache = new Map();
const inflight = new Map();
const applied = new Map();
let requestSeq = 0;

function emit() {
  for (const cb of listeners) cb();
}

function load(personaId) {
  const seq = ++requestSeq;
  const promise = fetch(`/api/notifications?profile_id=${personaId}`)
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null)
    .then((data) => {
      if (seq < (applied.get(personaId) ?? 0)) return;
      // A failed refresh keeps the old data; with nothing cached, show empty.
      if (!data && cache.has(personaId)) return;
      applied.set(personaId, seq);
      cache.set(personaId, { data, at: Date.now() });
      emit();
    })
    .finally(() => {
      if (inflight.get(personaId) === promise) inflight.delete(personaId);
    });
  inflight.set(personaId, promise);
}

function revalidate(personaId, force = false) {
  if (!force) {
    if (inflight.has(personaId)) return;
    const entry = cache.get(personaId);
    if (entry && Date.now() - entry.at < FRESH_MS) return;
  }
  load(personaId);
}

// reloadKey: anything that should trigger a revalidate (e.g. the pathname, so
// the nav badge refreshes as you move around the app, at most every FRESH_MS).
export function useNotifications(personaId, reloadKey) {
  const entry = useSyncExternalStore(
    subscribe,
    () => cache.get(personaId) ?? null,
    () => null
  );
  const seenRaw = useSyncExternalStore(
    subscribe,
    () => readSeenRaw(personaId),
    () => "[]"
  );
  // What was already seen when this view opened, so the page can keep new
  // rows highlighted after it marks everything seen.
  const [opened, setOpened] = useState(() => ({
    personaId,
    seen: parseSeen(readSeenRaw(personaId)),
  }));
  if (opened.personaId !== personaId) {
    setOpened({ personaId, seen: parseSeen(readSeenRaw(personaId)) });
  }

  useEffect(() => {
    revalidate(personaId);
  }, [personaId, reloadKey]);

  const ready = entry !== null;
  const notifications = entry?.data?.notifications ?? [];
  const seen = parseSeen(seenRaw);
  const unread = notifications.filter((n) => !seen.has(n.key));

  return {
    ready,
    notifications,
    requests: entry?.data?.requests ?? { sent: [], received: [] },
    unreadCount: unread.length,
    isFresh: (key) => ready && !opened.seen.has(key),
    markAllSeen: () => markSeen(personaId, notifications.map((n) => n.key)),
    reload: () => revalidate(personaId, true),
  };
}
