"use client";

import { createContext, useContext, useState } from "react";
import { getProfile, PERSONA_IDS } from "@/lib/seed";

const PersonaContext = createContext(null);

export function PersonaProvider({ children }) {
  const [personaId, setPersonaId] = useState(PERSONA_IDS[0]);
  const persona = getProfile(personaId);
  return (
    <PersonaContext.Provider value={{ persona, personaId, setPersonaId }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  return useContext(PersonaContext);
}
