"use client";

import { useEffect, useSyncExternalStore } from "react";

// Who the current persona follows, shared by Follow buttons and the Home
// strip: one request per persona per page load, updated on follow/unfollow.
const lists = new Map(); // personaId -> ids
const profiles = new Map(); // profile id -> profile (for the Home strip)
const loading = new Set();
const listeners = new Set();
const NONE = [];

function emit() {
  for (const cb of listeners) cb();
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

async function load(personaId) {
  if (loading.has(personaId) || lists.has(personaId)) return;
  loading.add(personaId);
  try {
    const res = await fetch(`/api/follows?viewer=${encodeURIComponent(personaId)}`, { cache: "no-store" });
    const data = res.ok ? await res.json() : null;
    for (const p of data?.profiles ?? []) profiles.set(p.id, p);
    lists.set(personaId, data?.ids ?? []);
    emit();
  } catch {
    // Try again on the next mount.
  } finally {
    loading.delete(personaId);
  }
}

export function useFollowing(personaId) {
  const ids = useSyncExternalStore(subscribe, () => lists.get(personaId) ?? NONE, () => NONE);
  useEffect(() => {
    if (personaId && personaId !== "admin") load(personaId);
  }, [personaId]);

  // Optimistic; rolls back if the server says no. Returns an error or null.
  async function setFollow(otherId, follow) {
    const before = lists.get(personaId) ?? [];
    lists.set(personaId, follow ? [otherId, ...before.filter((x) => x !== otherId)] : before.filter((x) => x !== otherId));
    emit();
    try {
      const res = await fetch("/api/follows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ follower_id: personaId, followee_id: otherId, follow }),
      });
      if (res.ok) return null;
      const data = await res.json().catch(() => ({}));
      lists.set(personaId, before);
      emit();
      return data.error ?? "Could not update that.";
    } catch {
      lists.set(personaId, before);
      emit();
      return "Could not reach the server.";
    }
  }

  return {
    ids,
    ready: lists.has(personaId),
    isFollowing: (id) => ids.includes(id),
    profileOf: (id) => profiles.get(id) ?? null,
    setFollow,
  };
}
