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

// Cleared ("Clear all" / swipe-away) keys, also per persona. Notifications
// are derived from real likes, replies and requests, so clearing only hides
// them for this persona; a request whose status changes gets a new key and
// comes back.
const clearedKey = (personaId) => `sodu-notif-cleared:${personaId}`;

function readRaw(storageKey) {
  try {
    return window.localStorage.getItem(storageKey) ?? "[]";
  } catch {
    return "[]";
  }
}

function readSeenRaw(personaId) {
  return readRaw(seenKey(personaId));
}

function writeKeys(storageKey, set) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify([...set].slice(-MAX_SEEN)));
  } catch {
    // Storage blocked: the change just does not stick.
  }
}

// Keys for request cards in the Requests tab, sharing the cleared store.
// A request you sent reappears when its status changes; a request to you
// can only be cleared once answered, so a pending one never disappears.
export function requestKey(req, direction) {
  return direction === "sent" ? `req-sent:${req.id}:${req.status}` : `req-in:${req.id}`;
}

export function canClearRequest(req, direction) {
  return direction === "sent" || req.status !== "sent";
}

export function clearNotifications(personaId, keys) {
  const cleared = parseSeen(readRaw(clearedKey(personaId)));
  const seen = parseSeen(readSeenRaw(personaId));
  for (const key of keys) {
    cleared.add(key);
    seen.add(key);
  }
  writeKeys(clearedKey(personaId), cleared);
  writeKeys(seenKey(personaId), seen);
  for (const cb of listeners) cb();
}

export function restoreNotifications(personaId, keys) {
  const cleared = parseSeen(readRaw(clearedKey(personaId)));
  for (const key of keys) cleared.delete(key);
  writeKeys(clearedKey(personaId), cleared);
  for (const cb of listeners) cb();
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

  // Keep checking while the app is open, so an accepted request or a new
  // reply shows up without a page refresh (at most every FRESH_MS).
  useEffect(() => {
    if (!personaId) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") revalidate(personaId);
    }, FRESH_MS);
    return () => clearInterval(timer);
  }, [personaId]);

  const clearedRaw = useSyncExternalStore(
    subscribe,
    () => readRaw(clearedKey(personaId)),
    () => "[]"
  );

  const ready = entry !== null;
  const cleared = parseSeen(clearedRaw);
  const notifications = (entry?.data?.notifications ?? []).filter((n) => !cleared.has(n.key));
  const seen = parseSeen(seenRaw);
  const unread = notifications.filter((n) => !seen.has(n.key));
  const rawRequests = entry?.data?.requests ?? { sent: [], received: [] };
  const visible = (direction) => (r) =>
    !(canClearRequest(r, direction) && cleared.has(requestKey(r, direction)));

  return {
    ready,
    notifications,
    requests: {
      sent: rawRequests.sent.filter(visible("sent")),
      received: rawRequests.received.filter(visible("received")),
    },
    unreadCount: unread.length,
    isFresh: (key) => ready && !opened.seen.has(key),
    markAllSeen: () => markSeen(personaId, notifications.map((n) => n.key)),
    reload: () => revalidate(personaId, true),
  };
}
