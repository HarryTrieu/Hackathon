"use client";

import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from "react";
import { getProfile } from "@/lib/seed";
import { parseSaved, readSaved, save, subscribe } from "@/lib/persona-store";
import { useAccount } from "@/lib/use-account";

const PersonaContext = createContext(null);

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
  // Not after signing in from this tab (signingIn): that tab is meant to land
  // on your own account, and the marker is cleared once you're back.
  const lastStatus = useRef(account.status);
  const signingIn = saved.signingIn;
  useEffect(() => {
    if (userId && signingIn) save({ demoId, actingAsDemo: false, accountId: userId });
    else if (lastStatus.current === "demo" && userId) save({ demoId, actingAsDemo: true, accountId: userId }, { tabOnly: true });
    lastStatus.current = account.status;
  }, [account.status, userId, demoId, signingIn]);

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
