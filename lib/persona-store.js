"use client";

import { PERSONA_IDS } from "./seed.js";

// The account choice survives a refresh: saved as
// { demoId, actingAsDemo, accountId, signingIn } per tab (sessionStorage), so
// two tabs can stay two different people, and browser-wide (localStorage) so
// a new tab opens as the last choice. accountId is the Google user the choice
// was made under: signing in as someone else (or for the first time) starts
// on your own account instead of an old demo pick. signingIn is set just
// before the Google redirect, so the tab comes back on your own account.
// The server render uses the defaults, then the saved choice takes over once
// the page is running.
const KEY = "sodu.persona";
const listeners = new Set();

export function readSaved() {
  try {
    return window.sessionStorage.getItem(KEY) ?? window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

// A new tab copies the browser-wide choice once, when it opens. After that
// it only follows its own picks, never another tab's.
if (typeof window !== "undefined") {
  try {
    const shared = window.localStorage.getItem(KEY);
    if (shared && !window.sessionStorage.getItem(KEY)) window.sessionStorage.setItem(KEY, shared);
  } catch {
    // Storage blocked: nothing to copy.
  }
}

export function save(next, { tabOnly = false } = {}) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
    if (!tabOnly) window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode or storage blocked: the choice just won't survive a refresh.
  }
  for (const cb of listeners) cb();
}

export function subscribe(cb) {
  listeners.add(cb);
  // No "storage" listener on purpose: switching in another tab doesn't
  // change this one.
  return () => listeners.delete(cb);
}

export function parseSaved(raw) {
  try {
    const value = JSON.parse(raw);
    if (PERSONA_IDS.includes(value?.demoId)) {
      return {
        demoId: value.demoId,
        actingAsDemo: value.actingAsDemo === true,
        accountId: value.accountId ?? null,
        signingIn: value.signingIn === true,
      };
    }
  } catch {
    // Missing or unreadable: fall back to the defaults.
  }
  return { demoId: PERSONA_IDS[0], actingAsDemo: false, accountId: null, signingIn: false };
}

// Called right before the Google redirect: whatever demo account this tab
// showed, you come back as yourself.
export function markSigningIn() {
  const { demoId } = parseSaved(readSaved());
  save({ demoId, actingAsDemo: false, accountId: null, signingIn: true });
}
