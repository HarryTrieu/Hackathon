"use client";

import { usePersona } from "@/lib/persona-context";
import { getProfile, PERSONA_IDS } from "@/lib/seed";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
}

export function PersonaSwitcher() {
  const { persona, personaId, setPersonaId } = usePersona();

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40">
      <div className="flex items-center gap-2">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials(persona.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{persona.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {persona.role === "mentor" ? "Mentor" : "Mentee"} · {persona.course}
            {persona.year ? ` · Year ${persona.year}` : ""}
          </p>
        </div>
      </div>
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
              {p.name} — {p.role === "mentor" ? "Mentor" : "Mentee"}, {p.course}
              {p.year ? ` Y${p.year}` : ""}
            </option>
          );
        })}
      </select>
      <p className="text-[10px] leading-tight text-muted-foreground">
        Demo persona switcher (replaces auth)
      </p>
    </div>
  );
}
