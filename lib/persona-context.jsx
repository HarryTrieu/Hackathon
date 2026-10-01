"use client";

import { createContext, useContext, useState } from "react";
import { getProfile, PERSONA_IDS } from "@/lib/seed";
import { useAccount } from "@/lib/use-account";

const PersonaContext = createContext(null);

// "persona" is whoever you are in the app right now. Signed in with Google
// and set up, that's your own profile, unless you switched to a demo account;
// your Google account stays signed in and one click switches back to it.
// Signed out, it's the picked demo persona (Lan by default).
export function PersonaProvider({ children }) {
  const [demoId, setDemoId] = useState(PERSONA_IDS[0]);
  // true while a signed-in user is acting as a demo account.
  const [actingAsDemo, setActingAsDemo] = useState(false);
  const account = useAccount();
  const realActive = account.status === "ready" && !actingAsDemo;
  const persona = realActive ? account.profile : getProfile(demoId);

  function pickDemo(id) {
    setDemoId(id);
    setActingAsDemo(true);
  }

  return (
    <PersonaContext.Provider
      value={{
        persona,
        personaId: persona.id,
        setPersonaId: pickDemo,
        pickGoogle: () => setActingAsDemo(false),
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
