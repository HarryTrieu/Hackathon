"use client";

import { useEffect, useSyncExternalStore } from "react";

// Your conversation list and unread count, shared by the nav badge and the
// Messages page: one request per persona, refreshed every 15 seconds while
// any of them is on screen.
const REFRESH_MS = 15_000;
const EMPTY = { personaId: null, ready: false, conversations: [], unread: 0, error: null };

let state = EMPTY;
const listeners = new Set();
let timer = null;
let current = null;

function emit() {
  for (const cb of listeners) cb();
}

async function load(personaId) {
  try {
    const res = await fetch(`/api/messages?profile_id=${encodeURIComponent(personaId)}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (current !== personaId) return;
    state = res.ok
      ? { personaId, ready: true, conversations: data.conversations ?? [], unread: data.unread ?? 0, error: null }
      : { personaId, ready: true, conversations: [], unread: 0, error: data.error ?? "Could not load messages." };
  } catch {
    if (current !== personaId) return;
    state = { ...state, personaId, ready: true, error: "Could not reach the server." };
  }
  emit();
}

function start(personaId) {
  if (current === personaId && timer) return;
  current = personaId;
  clearInterval(timer);
  load(personaId);
  timer = setInterval(() => load(personaId), REFRESH_MS);
}

function subscribe(cb) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = null;
    }
  };
}

// Reload now, e.g. after sending or opening a conversation.
export function refreshInbox() {
  if (current) load(current);
}

export function useInbox(personaId) {
  const snap = useSyncExternalStore(subscribe, () => state, () => EMPTY);
  useEffect(() => {
    if (personaId) start(personaId);
  }, [personaId]);
  return snap.personaId === personaId ? snap : { ...EMPTY, personaId };
}
