"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronUp, LogOut, PencilLine, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth-button";
import { ResetDemoButton } from "@/components/reset-demo-button";
import { UserAvatar } from "@/components/user-avatar";
import { usePersona } from "@/lib/persona-context";
import { getProfile, PERSONA_IDS, roleLabel } from "@/lib/seed";
import { signOut } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

const subtitle = (p) => `${roleLabel(p.role)} · ${p.course}${p.year ? ` · Year ${p.year}` : ""}`;

function Tag({ google = false }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-1.5 py-px text-[10px] font-medium",
        google ? "border-primary/40 text-primary" : "text-muted-foreground"
      )}
    >
      {google ? "Google" : "Demo"}
    </span>
  );
}

// The list: your Google account (or Sign in), then every demo account.
// You are one or the other: picking a demo account signs Google out first.
function AccountList({ onDone }) {
  const { persona, personaId, setPersonaId, account } = usePersona();
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const signedIn = account.status === "ready" || account.status === "needs-profile";
  const googleName = account.profile?.name ?? account.user?.user_metadata?.full_name ?? account.user?.email;

  async function pickDemo(id) {
    setBusy(true);
    if (signedIn) await signOut();
    setPersonaId(id);
    setBusy(false);
    // On your own profile, follow the switch to the new account's profile.
    if (pathname === `/profile/${personaId}`) router.push(`/profile/${id}`);
    onDone?.();
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="space-y-1.5">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Your account</p>
        {signedIn ? (
          <div className="space-y-1.5 rounded-xl border p-2">
            <div className="flex items-center gap-2">
              <UserAvatar
                profile={account.profile ?? { name: googleName ?? "You", handle: account.user.id, avatar: account.user.user_metadata?.avatar_url }}
                className="size-8"
                textClassName="text-xs"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{googleName}</p>
                <p className="truncate text-xs text-muted-foreground">{account.user.email}</p>
              </div>
              {account.status === "ready" && persona.id === account.profile.id && <Check className="size-4 shrink-0 text-primary" />}
            </div>
            {account.status === "needs-profile" ? (
              <Link
                href="/welcome"
                onClick={onDone}
                className="flex items-center gap-2 rounded-lg bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
              >
                <UserPlus className="size-3.5" />
                Finish setting up your account
              </Link>
            ) : (
              <Link
                href="/welcome"
                onClick={onDone}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted"
              >
                <PencilLine className="size-3.5" />
                Edit your details
              </Link>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start text-xs text-muted-foreground"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await signOut();
                setBusy(false);
                onDone?.();
              }}
            >
              <LogOut data-icon="inline-start" />
              Sign out
            </Button>
          </div>
        ) : (
          <AuthButton />
        )}
      </section>

      <section className="space-y-1">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Demo accounts{signedIn ? " (signs you out of Google)" : ", no sign-in needed"}
        </p>
        <ul className="flex flex-col">
          {PERSONA_IDS.map((id) => {
            const p = getProfile(id);
            const current = !signedIn && id === persona.id;
            return (
              <li key={id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => (current ? onDone?.() : pickDemo(id))}
                  aria-current={current || undefined}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-muted",
                    current && "bg-primary/[0.06]"
                  )}
                >
                  <UserAvatar profile={p} className="size-7" textClassName="text-[10px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{subtitle(p)}</span>
                  </span>
                  {current && <Check className="size-4 shrink-0 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <ResetDemoButton />
    </div>
  );
}

// One card with whoever you are now; tap it to switch accounts.
// inline: always show the list (phone Me sheet). Otherwise the card toggles
// the list open above itself (desktop left nav).
export function AccountSwitcher({ inline = false }) {
  const { persona, account } = usePersona();
  const [open, setOpen] = useState(false);
  const google = account.status === "ready";
  const needsSetup = account.status === "needs-profile";

  if (inline) return <AccountList />;

  return (
    <div className="flex flex-col gap-2">
      {open && (
        <div className="max-h-[60svh] overflow-y-auto rounded-xl border bg-card p-3 shadow-sm">
          <AccountList onDone={() => setOpen(false)} />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Switch account"
        className="flex w-full items-center gap-2 rounded-xl border bg-card p-2.5 text-left transition-colors duration-300 ease-out hover:border-primary/30"
      >
        <UserAvatar profile={persona} className="size-8" textClassName="text-xs" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">{persona.name}</span>
            <Tag google={google} />
          </span>
          <span className={cn("block truncate text-xs", needsSetup ? "font-medium text-primary" : "text-muted-foreground")}>
            {needsSetup ? "Google signed in: finish setup" : subtitle(persona)}
          </span>
        </span>
        <ChevronUp className={cn("size-4 shrink-0 text-muted-foreground transition-transform", !open && "rotate-180")} />
      </button>
    </div>
  );
}
