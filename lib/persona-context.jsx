"use client";

import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from "react";
import { getProfile, PERSONA_IDS } from "@/lib/seed";
import { useAccount } from "@/lib/use-account";

const PersonaContext = createContext(null);

// The account choice survives a refresh: saved as
// { demoId, actingAsDemo, accountId } per tab (sessionStorage), so two tabs
// can stay two different people, and browser-wide (localStorage) so a new tab
// opens as the last choice. accountId is the Google user the choice was made
// under: signing in as someone else (or for the first time) starts on your
// own account instead of an old demo pick.
// The server render uses the defaults, then the saved choice takes over once
// the page is running.
const KEY = "sodu.persona";
const listeners = new Set();

function readSaved() {
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

function save(next, { tabOnly = false } = {}) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
    if (!tabOnly) window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode or storage blocked: the choice just won't survive a refresh.
  }
  for (const cb of listeners) cb();
}

function subscribe(cb) {
  listeners.add(cb);
  // No "storage" listener on purpose: switching in another tab doesn't
  // change this one.
  return () => listeners.delete(cb);
}

function parseSaved(raw) {
  try {
    const value = JSON.parse(raw);
    if (PERSONA_IDS.includes(value?.demoId)) {
      return { demoId: value.demoId, actingAsDemo: value.actingAsDemo === true, accountId: value.accountId ?? null };
    }
  } catch {
    // Missing or unreadable: fall back to the defaults.
  }
  return { demoId: PERSONA_IDS[0], actingAsDemo: false, accountId: null };
}

// "persona" is whoever you are in the app right now. Signed in with Google
// and set up, that's your own profile, unless you switched to a demo account;
// your Google account stays signed in and one click switches back to it.
// Signed out, it's the picked demo persona (Lan by default).
export function PersonaProvider({ children }) {
  const raw = useSyncExternalStore(subscribe, readSaved, () => null);
  const saved = parseSaved(raw);
  const { demoId } = saved;
  const account = useAccount();
  const userId = account.user?.id ?? null;
  // true while a signed-in user is acting as a demo account. A pick made
  // signed out, or under another Google account, doesn't count.
  const actingAsDemo = saved.actingAsDemo && saved.accountId === userId;
  const realActive = account.status === "ready" && !actingAsDemo;
  const persona = realActive ? account.profile : getProfile(demoId);

  // Signing in in another tab signs this tab in too (Supabase shares the
  // session). Keep this tab on the demo account it was showing; signing in
  // in this tab is a full page load, so it never goes through "demo" here.
  const lastStatus = useRef(account.status);
  useEffect(() => {
    if (lastStatus.current === "demo" && userId) save({ demoId, actingAsDemo: true, accountId: userId }, { tabOnly: true });
    lastStatus.current = account.status;
  }, [account.status, userId, demoId]);

  function pickDemo(id) {
    save({ demoId: id, actingAsDemo: true, accountId: userId });
  }

  return (
    <PersonaContext.Provider
      value={{
        persona,
        personaId: persona.id,
        setPersonaId: pickDemo,
        pickGoogle: () => save({ demoId, actingAsDemo: false, accountId: userId }),
        demoId,
        account,
        realActive,
        actingAsDemo,
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  return useContext(PersonaContext);
}
