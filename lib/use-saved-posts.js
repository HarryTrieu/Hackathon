"use client";

import { useEffect, useSyncExternalStore } from "react";

// Saved posts per persona. The database (/api/saved) is the source of truth,
// so the same account sees the same list on every device. The list is also
// kept in localStorage so the page shows it instantly, and so saving still
// works on this device before the live-fixes migration (server answers 503).
const keyFor = (personaId) => `sodu-saved-posts:${personaId}`;

const listeners = new Set();
const synced = new Set(); // personas loaded from the server this page load
const serverOff = new Set(); // personas whose server list isn't available

function emit() {
  for (const cb of listeners) cb();
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function readRaw(personaId) {
  try {
    return window.localStorage.getItem(keyFor(personaId)) ?? "[]";
  } catch {
    return "[]";
  }
}

function write(personaId, posts) {
  try {
    window.localStorage.setItem(keyFor(personaId), JSON.stringify(posts));
  } catch {
    // Storage full or blocked: the server copy still counts.
  }
  emit();
}

function parse(raw) {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function syncFromServer(personaId) {
  if (synced.has(personaId)) return;
  synced.add(personaId);
  try {
    const res = await fetch(`/api/saved?profile_id=${encodeURIComponent(personaId)}`, { cache: "no-store" });
    if (res.status === 503) {
      serverOff.add(personaId);
      return;
    }
    if (!res.ok) return;
    const { posts } = await res.json();
    write(personaId, posts ?? []);
  } catch {
    synced.delete(personaId);
  }
}

export function useSavedPosts(personaId) {
  const raw = useSyncExternalStore(subscribe, () => readRaw(personaId), () => "[]");
  const posts = parse(raw);

  useEffect(() => {
    if (personaId) syncFromServer(personaId);
  }, [personaId]);

  async function toggle(post) {
    const current = parse(readRaw(personaId));
    const saving = !current.some((p) => p.id === post.id);
    write(personaId, saving ? [post, ...current] : current.filter((p) => p.id !== post.id));
    if (serverOff.has(personaId)) return;
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile_id: personaId, post_id: post.id, saved: saving }),
      });
      if (res.status === 503) serverOff.add(personaId);
      // Not in the database (a post only on this device): keep it local.
      else if (!res.ok && res.status !== 404) write(personaId, current);
    } catch {
      write(personaId, current);
    }
  }

  return { posts, toggle, has: (id) => posts.some((p) => p.id === id) };
}
