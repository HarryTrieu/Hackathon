"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronsUpDown, LogOut, PencilLine, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
// Your Google account stays signed in while you try demo accounts; one click
// switches back to it. Only "Sign out" removes it.
function AccountList({ onDone }) {
  const { persona, personaId, setPersonaId, pickGoogle, account, realActive } = usePersona();
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const signedIn = account.status === "ready" || account.status === "needs-profile";
  const googleName = account.profile?.name ?? account.user?.user_metadata?.full_name ?? account.user?.email;

  // On your own profile page, follow the switch to the new account's profile.
  function followProfile(nextId) {
    if (pathname === `/profile/${personaId}`) router.push(`/profile/${nextId}`);
  }

  function pickDemo(id) {
    setPersonaId(id);
    followProfile(id);
    onDone?.();
  }

  function switchToGoogle() {
    pickGoogle();
    // Optional chaining: the React Compiler reads this while rendering, when
    // signed-out users have no profile.
    followProfile(account.profile?.id);
    onDone?.();
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="space-y-1.5">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Your account</p>
        {signedIn ? (
          <div className="space-y-1">
            {account.status === "ready" ? (
              <button
                type="button"
                onClick={() => (realActive ? onDone?.() : switchToGoogle())}
                aria-current={realActive || undefined}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-muted",
                  realActive && "bg-primary/[0.06]"
                )}
              >
                <UserAvatar profile={account.profile} className="size-8" textClassName="text-xs" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">{googleName}</span>
                    <Tag google />
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{account.user.email}</span>
                </span>
                {realActive && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            ) : (
              <Link
                href="/welcome"
                onClick={onDone}
                className="flex items-center gap-2 rounded-lg bg-primary/10 px-2 py-2 text-left hover:bg-primary/15"
              >
                <UserAvatar
                  profile={{ name: googleName ?? "You", handle: account.user.id, avatar: account.user.user_metadata?.avatar_url }}
                  className="size-8"
                  textClassName="text-xs"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{googleName}</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    <UserPlus className="size-3.5" />
                    Finish setting up your account
                  </span>
                </span>
              </Link>
            )}
            <div className="flex gap-1 px-1">
              {account.status === "ready" && (
                <Link
                  href="/welcome"
                  onClick={onDone}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                >
                  <PencilLine className="size-3.5" />
                  Edit details
                </Link>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await signOut();
                  setBusy(false);
                  onDone?.();
                }}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <AuthButton />
        )}
      </section>

      <section className="space-y-1">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Demo accounts{signedIn ? " (you stay signed in)" : ", no sign-in needed"}
        </p>
        <ul className="flex flex-col">
          {PERSONA_IDS.map((id) => {
            const p = getProfile(id);
            const current = !realActive && id === persona.id;
            return (
              <li key={id}>
                <button
                  type="button"
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
// inline: always show the list (phone Me sheet, already a pop-up panel).
// Otherwise the card opens the list in a centred "Switch account" popup
// (desktop left nav), which closes with X, Esc, a click outside, or a pick.
export function AccountSwitcher({ inline = false }) {
  const { persona, account, realActive, actingAsDemo } = usePersona();
  const [open, setOpen] = useState(false);
  const google = realActive;
  const needsSetup = account.status === "needs-profile" && !actingAsDemo;

  if (inline) return <AccountList />;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
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
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85svh] gap-3 overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Switch account</DialogTitle>
            <DialogDescription>
              Use your own Google account, or explore Sodu as one of the demo students and mentors.
            </DialogDescription>
          </DialogHeader>
          <AccountList onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
