"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithGoogle, signOut, useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

// Google's "G" mark, as Google's sign-in branding guidelines ask for.
function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-4">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// "Sign in with Google", or who you're signed in as plus Sign out.
export function AuthButton({ className }) {
  const { ready, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!ready) return null;

  if (user) {
    const name = user.user_metadata?.full_name ?? user.email;
    return (
      <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2", className)}>
        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{name}</span>
        </p>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await signOut();
            setBusy(false);
          }}
        >
          <LogOut data-icon="inline-start" />
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        className="w-full rounded-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const result = await signInWithGoogle();
          // On success the browser leaves for Google, so only errors land here.
          if (result.error) {
            setError(result.error);
            setBusy(false);
          }
        }}
      >
        <GoogleMark />
        {busy ? "Opening Google..." : "Sign in with Google"}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
