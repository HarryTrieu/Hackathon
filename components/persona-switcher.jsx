"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePersona } from "@/lib/persona-context";
import { getProfile, PERSONA_IDS, roleLabel } from "@/lib/seed";
import { ResetDemoButton } from "@/components/reset-demo-button";
import { UserAvatar } from "@/components/user-avatar";

export function PersonaSwitcher() {
  const { persona, personaId, setPersonaId } = usePersona();
  const pathname = usePathname();
  const router = useRouter();

  // On your own profile, follow the switch to the new persona's profile.
  function switchTo(nextId) {
    if (nextId === personaId) return;
    setPersonaId(nextId);
    if (pathname === `/profile/${personaId}`) router.push(`/profile/${nextId}`);
  }
  const otherRole = persona.role === "mentor" ? "mentee" : "mentor";
  const otherId = PERSONA_IDS.find((id) => getProfile(id).role === otherRole) ?? PERSONA_IDS[0];

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 transition-colors duration-300 ease-out hover:border-primary/30">
      <div className="flex items-center gap-2">
        <UserAvatar profile={persona} className="size-8" textClassName="text-xs" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{persona.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {roleLabel(persona.role)} · {persona.course}
            {persona.year ? ` · Year ${persona.year}` : ""}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-full rounded-full"
        onClick={() => switchTo(otherId)}
      >
        Switch to {otherRole} view
      </Button>
      <select
        aria-label="Switch demo persona"
        value={personaId}
        onChange={(e) => switchTo(e.target.value)}
        className="h-8 w-full cursor-pointer rounded-lg border bg-background px-2 text-xs outline-none transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
      >
        {PERSONA_IDS.map((id) => {
          const p = getProfile(id);
          return (
            <option key={id} value={id}>
              {p.name} · {roleLabel(p.role)}, {p.course}
              {p.year ? ` Y${p.year}` : ""}
            </option>
          );
        })}
      </select>
      <ResetDemoButton />
      <p className="text-[10px] leading-tight text-muted-foreground">
        Demo switcher (replaces auth). Reset restores sample posts and local applications.
      </p>
    </div>
  );
}
