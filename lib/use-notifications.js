"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

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

// Desktop and mobile nav both mount the hook; share one in-flight request.
const inflight = new Map();

function fetchNotifications(personaId, token) {
  const key = `${personaId}|${token}`;
  if (!inflight.has(key)) {
    const promise = fetch(`/api/notifications?profile_id=${personaId}`)
      .then((res) => (res.ok ? res.json() : null))
      .finally(() => setTimeout(() => inflight.delete(key), 1000));
    inflight.set(key, promise);
  }
  return inflight.get(key);
}

// reloadKey: anything that should trigger a refetch (e.g. the pathname, so
// the nav badge refreshes as you move around the app).
export function useNotifications(personaId, reloadKey) {
  const [state, setState] = useState({ personaId: null, data: null });
  const [version, setVersion] = useState(0);
  const seenRaw = useSyncExternalStore(
    subscribe,
    () => readSeenRaw(personaId),
    () => "[]"
  );

  useEffect(() => {
    let cancelled = false;
    fetchNotifications(personaId, `${reloadKey}|${version}`)
      .then((data) => {
        if (cancelled) return;
        // Snapshot what was unread at load, so the page can keep those rows
        // highlighted after it marks everything seen.
        const seenNow = parseSeen(readSeenRaw(personaId));
        const fresh = new Set(
          (data?.notifications ?? []).filter((n) => !seenNow.has(n.key)).map((n) => n.key)
        );
        setState({ personaId, data, fresh });
      })
      .catch(() => {
        if (!cancelled) setState({ personaId, data: null, fresh: new Set() });
      });
    return () => {
      cancelled = true;
    };
  }, [personaId, reloadKey, version]);

  const ready = state.personaId === personaId;
  const data = ready ? state.data : null;
  const notifications = data?.notifications ?? [];
  const seen = parseSeen(seenRaw);
  const unread = notifications.filter((n) => !seen.has(n.key));

  return {
    ready,
    notifications,
    requests: data?.requests ?? { sent: [], received: [] },
    unreadCount: unread.length,
    isFresh: (key) => Boolean(ready && state.fresh?.has(key)),
    markAllSeen: () => markSeen(personaId, notifications.map((n) => n.key)),
    reload: () => setVersion((v) => v + 1),
  };
}
