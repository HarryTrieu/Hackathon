"use client";

import { createContext, useContext, useState } from "react";
import { getProfile, PERSONA_IDS } from "@/lib/seed";
import { useAccount } from "@/lib/use-account";

const PersonaContext = createContext(null);

// "persona" is whoever you are in the app right now: your own profile when
// you're signed in with Google and set up, otherwise the demo persona picked
// in the account switcher (Lan by default). setPersonaId picks a demo persona.
export function PersonaProvider({ children }) {
  const [demoId, setDemoId] = useState(PERSONA_IDS[0]);
  const account = useAccount();
  const persona = account.status === "ready" ? account.profile : getProfile(demoId);
  return (
    <PersonaContext.Provider
      value={{ persona, personaId: persona.id, setPersonaId: setDemoId, demoId, account }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  return useContext(PersonaContext);
}
