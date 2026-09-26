"use client";

import { Moon, Sun } from "lucide-react";
import { toggleTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className, compact = false }) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className={cn(
        "inline-flex items-center gap-2 rounded-full transition-colors hover:bg-muted",
        compact ? "p-2" : "px-3 py-2 text-sm",
        className
      )}
    >
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
      {!compact && (
        <>
          <span className="dark:hidden">Dark mode</span>
          <span className="hidden dark:inline">Light mode</span>
        </>
      )}
    </button>
  );
}
