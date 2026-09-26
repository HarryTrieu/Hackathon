"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePersona } from "@/lib/persona-context";
import { getProfile, PERSONA_IDS } from "@/lib/seed";
import { UserAvatar } from "@/components/user-avatar";

const STORAGE_KEYS = ["sodu-mentor-apps", "sodu-followed-tags"];

export function PersonaSwitcher() {
  const { persona, personaId, setPersonaId } = usePersona();
  const [resetting, setResetting] = useState(false);
  const otherRole = persona.role === "mentor" ? "mentee" : "mentor";
  const otherId = PERSONA_IDS.find((id) => getProfile(id).role === otherRole) ?? PERSONA_IDS[0];

  async function resetDemo() {
    setResetting(true);
    for (const key of STORAGE_KEYS) window.localStorage.removeItem(key);
    try {
      await fetch("/api/demo/reset", { method: "POST" });
    } catch {
      /* still reload so the UI snaps back */
    }
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 transition-colors duration-300 ease-out hover:border-primary/30">
      <div className="flex items-center gap-2">
        <UserAvatar profile={persona} className="size-8" textClassName="text-xs" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{persona.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {persona.role === "mentor" ? "Mentor" : "Mentee"} · {persona.course}
            {persona.year ? ` · Year ${persona.year}` : ""}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-full rounded-full"
        onClick={() => setPersonaId(otherId)}
      >
        Switch to {otherRole} view
      </Button>
      <select
        aria-label="Switch demo persona"
        value={personaId}
        onChange={(e) => setPersonaId(e.target.value)}
        className="h-8 w-full cursor-pointer rounded-lg border bg-background px-2 text-xs outline-none transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
      >
        {PERSONA_IDS.map((id) => {
          const p = getProfile(id);
          return (
            <option key={id} value={id}>
              {p.name} · {p.role === "mentor" ? "Mentor" : "Mentee"}, {p.course}
              {p.year ? ` Y${p.year}` : ""}
            </option>
          );
        })}
      </select>
      <Button size="sm" variant="ghost" className="w-full text-xs" onClick={resetDemo} disabled={resetting}>
        {resetting ? "Resetting..." : "Reset demo"}
      </Button>
      <p className="text-[10px] leading-tight text-muted-foreground">
        Demo switcher (replaces auth). Reset restores sample posts and local applications.
      </p>
    </div>
  );
}
