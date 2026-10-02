"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { getProfile, PERSONA_IDS } from "@/lib/seed";
import { useAccount } from "@/lib/use-account";

const PersonaContext = createContext(null);

// The account choice survives a refresh: saved as { demoId, actingAsDemo }
// per tab (sessionStorage), so two tabs can stay two different people, and
// also browser-wide (localStorage) so a new tab opens as the last choice.
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

function save(next) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
    window.localStorage.setItem(KEY, JSON.stringify(next));
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
    if (PERSONA_IDS.includes(value?.demoId)) return { demoId: value.demoId, actingAsDemo: value.actingAsDemo === true };
  } catch {
    // Missing or unreadable: fall back to the defaults.
  }
  return { demoId: PERSONA_IDS[0], actingAsDemo: false };
}

// "persona" is whoever you are in the app right now. Signed in with Google
// and set up, that's your own profile, unless you switched to a demo account;
// your Google account stays signed in and one click switches back to it.
// Signed out, it's the picked demo persona (Lan by default).
export function PersonaProvider({ children }) {
  const raw = useSyncExternalStore(subscribe, readSaved, () => null);
  // actingAsDemo: true while a signed-in user is acting as a demo account.
  const { demoId, actingAsDemo } = parseSaved(raw);
  const account = useAccount();
  const realActive = account.status === "ready" && !actingAsDemo;
  const persona = realActive ? account.profile : getProfile(demoId);

  function pickDemo(id) {
    save({ demoId: id, actingAsDemo: true });
  }

  return (
    <PersonaContext.Provider
      value={{
        persona,
        personaId: persona.id,
        setPersonaId: pickDemo,
        pickGoogle: () => save({ demoId, actingAsDemo: false }),
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
