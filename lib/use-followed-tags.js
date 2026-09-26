"use client";

import { useSyncExternalStore } from "react";
import { readFollowedTags, toggleFollowedTag } from "./followed-tags";

const listeners = new Set();

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit() {
  for (const cb of listeners) cb();
}

function getSnapshot() {
  return JSON.stringify(readFollowedTags());
}

function getServerSnapshot() {
  return "[]";
}

export function useFollowedTags() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const tags = JSON.parse(raw);

  function toggle(tag) {
    toggleFollowedTag(tag);
    emit();
  }

  return { tags, toggle, has: (t) => tags.includes(t) };
}
