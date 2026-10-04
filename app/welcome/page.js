"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { AuthButton } from "@/components/auth-button";
import { UNIVERSITY, unitDirectory } from "@/lib/communities";
import { COURSES, GOALS, MAX_GOALS, MAX_UNITS, YEARS, goalLabel } from "@/lib/onboarding";
import { setAccountProfile, useAccount } from "@/lib/use-account";
import { signOut } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

function Chip({ active, onClick, children, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled && !active}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors duration-300 disabled:opacity-40",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/40 hover:bg-primary/[0.04]"
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-2 border-b px-4 py-4">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

// Delete my account (editing your details only): wipes your personal
// details and your Google sign-in; posts stay but show "Deleted user".
function DeleteAccount() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function remove() {
    if (
      !window.confirm(
        "Delete your Sodu account? Your name, course, units, links and saves are removed and your Google sign-in is disconnected. Your posts and messages stay, shown as \"Deleted user\". This can't be undone."
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/me", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? "Could not delete your account.");
      await signOut();
      router.push("/");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-1 border-t pt-4 text-center">
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="text-sm font-medium text-destructive hover:underline disabled:opacity-50"
      >
        Delete my account
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const toggle = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

// One-screen setup after the first Google sign-in. Also edits your details later.
function WelcomeForm({ account }) {
  const router = useRouter();
  // Where to go after saving: back to the page you signed in from.
  const next = useSearchParams().get("next");
  const backTo = next?.startsWith("/") && !next.startsWith("//") && next !== "/welcome" ? next : "/";
  const existing = account.profile;
  const [name, setName] = useState(existing?.name ?? account.user.user_metadata?.full_name ?? "");
  const [course, setCourse] = useState(existing?.course ?? "");
  const [year, setYear] = useState(existing?.year ?? null);
  const [units, setUnits] = useState(existing?.units.map((u) => u.code) ?? []);
  const [goals, setGoals] = useState(existing?.goals ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Units in your course first, then the rest.
  const allUnits = unitDirectory()
    .filter((u) => u.name)
    .sort((a, b) => (b.course === course) - (a.course === course) || a.code.localeCompare(b.code));

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, course, year, units, goals }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save. Try again.");
        return;
      }
      setAccountProfile(account.user.id, data.profile);
      router.push(backTo);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save}>
      {account.error === "migration-missing" && (
        <p className="border-b bg-destructive/5 px-4 py-2 text-sm text-destructive">
          Accounts aren&apos;t switched on in the database yet, so saving will fail until it&apos;s updated.
        </p>
      )}
      <Field label="Your name" hint="Shown on your posts and profile.">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          className="h-10 w-full rounded-lg border bg-transparent px-3 text-base outline-none focus:border-primary/50 md:text-sm"
        />
      </Field>
      <Field label="Your course">
        <div className="flex flex-wrap gap-2">
          {COURSES.map((c) => (
            <Chip key={c} active={course === c} onClick={() => setCourse(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Year">
        <div className="flex flex-wrap gap-2">
          {YEARS.map((y) => (
            <Chip key={y} active={year === y} onClick={() => setYear(y)}>
              Year {y}
            </Chip>
          ))}
        </div>
      </Field>
      <Field
        label="Units you're taking or have taken"
        hint={`Pick up to ${MAX_UNITS}. Your feed and mentor matches use these. ${units.length} picked.`}
      >
        <div className="flex flex-wrap gap-2">
          {allUnits.map((u) => (
            <Chip
              key={u.code}
              active={units.includes(u.code)}
              disabled={units.length >= MAX_UNITS}
              onClick={() => setUnits((prev) => toggle(prev, u.code))}
            >
              <span className="font-mono">{u.code}</span> <span className="opacity-80">{u.name}</span>
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="What are you working towards?" hint={`Optional, up to ${MAX_GOALS}.`}>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <Chip
              key={g}
              active={goals.includes(g)}
              disabled={goals.length >= MAX_GOALS}
              onClick={() => setGoals((prev) => toggle(prev, g))}
            >
              {goalLabel(g)}
            </Chip>
          ))}
        </div>
      </Field>
      <div className="space-y-2 px-4 py-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {(!name.trim() || !course || !year) && (
          <p className="text-center text-xs text-muted-foreground">
            Still needed: {[!name.trim() && "your name", !course && "your course", !year && "your year"].filter(Boolean).join(", ")}.
          </p>
        )}
        <Button type="submit" className="w-full rounded-full" disabled={saving || !name.trim() || !course || !year}>
          {saving ? <Spinner data-icon="inline-start" /> : <CheckCircle2 data-icon="inline-start" />}
          {existing ? "Save changes" : "Finish setting up"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          We keep your name, course, year, units, goals and Google profile picture. Never your password. By
          continuing you agree to how we use your data in our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            privacy page
          </Link>
          .
        </p>
        {existing && <DeleteAccount />}
      </div>
    </form>
  );
}

function Welcome() {
  const account = useAccount();

  return (
    <div className="pb-24 md:pb-8">
      <div className="sticky top-0 z-10 border-b bg-background md:bg-background/95 px-4 py-3 md:backdrop-blur">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <GraduationCap className="size-5 text-primary" />
          {account.status === "ready" ? "Your details" : "Welcome to Sodu"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {UNIVERSITY} students helping each other through their units.
        </p>
      </div>

      {account.status === "loading" && (
        <div className="space-y-3 px-4 py-6">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      )}

      {account.status === "demo" && (
        <div className="space-y-4 px-4 py-8">
          <p className="text-sm">
            Sign in with Google to create your own account. It takes a minute: your name, course, year and units.
          </p>
          <AuthButton />
          <p className="text-sm text-muted-foreground">
            Or{" "}
            <Link href="/" className="text-primary hover:underline">
              keep exploring as a demo student
            </Link>
            .
          </p>
        </div>
      )}

      {(account.status === "needs-profile" || account.status === "ready") && (
        <WelcomeForm key={account.user.id} account={account} />
      )}
    </div>
  );
}

// useSearchParams (in the form) needs a Suspense boundary.
export default function WelcomePage() {
  return (
    <Suspense fallback={null}>
      <Welcome />
    </Suspense>
  );
}
