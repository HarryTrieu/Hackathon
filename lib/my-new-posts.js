"use client";

import { useSyncExternalStore } from "react";

// Posts published in this tab, newest first. Module state, so it survives
// moving between pages (a post made from the left-nav popup on another page
// is still there when you open Home) and clears on a full reload.
let posts = [];
const listeners = new Set();
const EMPTY = [];

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function rememberMyPost(post) {
  posts = [post, ...posts.filter((p) => p.id !== post.id)];
  for (const cb of listeners) cb();
}

export function useMyNewPosts() {
  return useSyncExternalStore(subscribe, () => posts, () => EMPTY);
}

// Moves the persona's own new posts to the top of a ranked list
// ([{ post, author, reason }]), newest first, with a reason saying why.
export function pinMyNewPosts(rows, myNewPosts, personaId) {
  const mine = myNewPosts.filter((p) => p.author_id === personaId).map((p) => p.id);
  if (mine.length === 0) return rows;
  const pinned = mine
    .map((id) => rows.find((row) => row.post.id === id))
    .filter(Boolean)
    .map((row) => ({ ...row, reason: "Your new post" }));
  return [...pinned, ...rows.filter((row) => !mine.includes(row.post.id))];
}
