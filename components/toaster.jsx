"use client";

import { useSyncExternalStore } from "react";
import { CheckCircle2, Info, X } from "lucide-react";
import { dismissToast, getToasts, subscribeToasts } from "@/lib/toast";
import { cn } from "@/lib/utils";

const EMPTY = [];

// Bottom centre, above the phone nav; newest at the bottom.
export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, () => EMPTY);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex max-w-sm items-center gap-2 rounded-full border bg-popover py-2 pr-2 pl-3.5 text-sm text-popover-foreground shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300"
          )}
        >
          {t.tone === "info" ? (
            <Info className="size-4 shrink-0 text-primary" />
          ) : (
            <CheckCircle2 className="size-4 shrink-0 text-primary" />
          )}
          <span className="min-w-0">{t.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss"
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
