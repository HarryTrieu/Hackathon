"use client";

import { useSyncExternalStore } from "react";

// Posts published in this tab, newest first, and which of them are still
// pinned for review. Module state, so it survives moving between pages (a
// post made from the left-nav popup on another page is still there when you
// open Home) and clears on a full reload. A post is pinned once, right after
// publishing; the next feed refresh unpins it and it ranks like any other.
let state = { posts: [], pinned: [] };
const listeners = new Set();
const EMPTY = { posts: [], pinned: [] };

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit() {
  for (const cb of listeners) cb();
}

export function rememberMyPost(post) {
  state = {
    posts: [post, ...state.posts.filter((p) => p.id !== post.id)],
    pinned: [post.id, ...state.pinned.filter((id) => id !== post.id)],
  };
  emit();
}

export function unpinMyNewPosts() {
  if (state.pinned.length === 0) return;
  state = { ...state, pinned: [] };
  emit();
}

// { posts, pinned }: every post you published this session, and the ids
// still pinned to the top.
export function useMyNewPosts() {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
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
