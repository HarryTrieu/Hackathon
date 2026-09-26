"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePersona } from "@/lib/persona-context";
import { cn } from "@/lib/utils";

const REASONS = [
  "Harassment or abuse",
  "Spam or selling assignments",
  "Academic integrity (sharing exam answers)",
  "Fake credentials or misleading profile",
  "Other",
];

// Report a mentor profile, an AI chat, or a community post. AI never hides
// the target; a human sees the report on /review.
export function ReportButton({ targetType, targetId, className }) {
  const { persona } = usePersona();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, setState] = useState("idle");
  const [note, setNote] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!reason.trim()) return;
    setState("sending");
    setNote(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reporter_id: persona.id,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("idle");
        setNote(data.error ?? "Could not send the report.");
        return;
      }
      setState("sent");
    } catch {
      setState("idle");
      setNote("Could not reach the server.");
    }
  }

  if (state === "sent") {
    return <p className="text-xs text-muted-foreground">Reported. A person will review it.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive",
          className
        )}
      >
        <Flag className="size-3" />
        Report
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border p-3">
      <p className="text-xs font-medium">Why are you reporting this?</p>
      <div className="flex flex-wrap gap-1.5">
        {REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors",
              reason === r ? "border-destructive/40 bg-destructive/10 text-destructive" : "hover:bg-muted"
            )}
          >
            {r}
          </button>
        ))}
      </div>
      {note && <p className="text-xs text-destructive">{note}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" size="sm" variant="destructive" disabled={!reason || state === "sending"}>
          Send report
        </Button>
      </div>
    </form>
  );
}
