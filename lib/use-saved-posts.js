"use client";

import { useSyncExternalStore } from "react";

// Saved posts live in localStorage per persona (no auth in the demo). We keep
// a snapshot of each post, newest first, so session-only posts that are not
// in the seed or the DB still show up on the profile.
const keyFor = (personaId) => `sodu-saved-posts:${personaId}`;

const listeners = new Set();

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

function parse(raw) {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function useSavedPosts(personaId) {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(personaId),
    () => "[]"
  );
  const posts = parse(raw);

  function toggle(post) {
    const current = parse(readRaw(personaId));
    const next = current.some((p) => p.id === post.id)
      ? current.filter((p) => p.id !== post.id)
      : [post, ...current];
    try {
      window.localStorage.setItem(keyFor(personaId), JSON.stringify(next));
    } catch {
      // Storage full or blocked: the toggle just does not stick.
    }
    for (const cb of listeners) cb();
  }

  return { posts, toggle, has: (id) => posts.some((p) => p.id === id) };
}
