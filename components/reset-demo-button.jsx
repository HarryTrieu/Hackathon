"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEYS = ["sodu-mentor-apps", "sodu-followed-tags"];

const CONFIRM_TEXT =
  "Reset the demo for everyone using the site?\n\n" +
  "Sample posts, votes and replies go back to how they started, and any sample post a moderator removed comes back. " +
  "Posts people wrote themselves stay.";

// Re-seeds the shared database, so it changes what every visitor sees.
export function ResetDemoButton({ className }) {
  const [resetting, setResetting] = useState(false);

  async function resetDemo() {
    if (!window.confirm(CONFIRM_TEXT)) return;
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
    <Button
      size="sm"
      variant="ghost"
      className={cn("w-full text-xs", className)}
      onClick={resetDemo}
      disabled={resetting}
    >
      {resetting ? "Resetting..." : "Reset demo"}
    </Button>
  );
}
