"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// In a normal chat with a mentor: "Duc mentors SIT102. Want a session?",
// with the request form right there. Hidden per chat with the X (saved in
// this browser); the header button brings it back.
const KEY = "sodu.sessionPrompt.hidden";
const listeners = new Set();

function readHidden() {
  try {
    return window.localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function setHidden(otherId, hidden) {
  try {
    const ids = new Set(JSON.parse(readHidden()));
    if (hidden) ids.add(otherId);
    else ids.delete(otherId);
    window.localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    // Storage blocked: the card just comes back on the next visit.
  }
  for (const cb of listeners) cb();
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSessionPromptHidden(otherId) {
  const raw = useSyncExternalStore(subscribe, readHidden, () => "[]");
  let hidden = false;
  try {
    hidden = JSON.parse(raw).includes(otherId);
  } catch {
    // Unreadable: treat as shown.
  }
  return [hidden, (next) => setHidden(otherId, next)];
}

// The other person's live mentor listings (approved and listed).
export function useMentorListings(otherId) {
  const [state, setState] = useState({ otherId: null, listings: [] });
  useEffect(() => {
    let cancelled = false;
    fetch("/api/mentors")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.mentors) {
          setState({ otherId, listings: data.mentors.filter((l) => l.profile_id === otherId) });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [otherId]);
  return state.otherId === otherId ? state.listings : [];
}

export function SessionPrompt({ me, other, listings, onHide }) {
  const router = useRouter();
  const first = other.name.split(" ")[0];
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState(listings[0].unit_code);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const units = listings.map((l) => l.unit_code);
  const listing = listings.find((l) => l.unit_code === unit) ?? listings[0];
  const draft = message || `Hi ${first}, could we do a ${unit} session? I'd like help with `;

  async function request(event) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/session-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listing_id: listing.id, mentee_id: me.id, message: draft.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.error ?? "Could not send the request.");
      if (json.persisted && json.request?.id) router.push(`/sessions/${json.request.id}`);
      else setError("Saved on this device only: the database isn't connected.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-b bg-gradient-to-r from-primary/[0.08] to-transparent px-4 py-3 text-sm animate-in fade-in slide-in-from-top-1">
      <div className="flex items-start gap-2">
        <CalendarPlus className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1 space-y-2">
          <p>
            <span className="font-semibold">{first} is a mentor</span>
            <span className="text-muted-foreground">
              {" "}
              for {units.join(", ")}
              {listing.rate_per_hour ? ` · A$${listing.rate_per_hour}/hour` : ""}. Hitting it off? Book a session with{" "}
              {first} right here.
            </span>
          </p>
          {!open ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="h-7 rounded-full" onClick={() => setOpen(true)}>
                Request a session
              </Button>
              <Link href={`/mentors/${listing.unit_code}/${other.id}`} className="text-xs text-primary hover:underline">
                See {first}&apos;s mentor page
              </Link>
            </div>
          ) : (
            <form onSubmit={request} className="space-y-2">
              {units.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {units.map((code) => (
                    <button
                      key={code}
                      type="button"
                      aria-pressed={unit === code}
                      onClick={() => setUnit(code)}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 font-mono text-xs",
                        unit === code ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                      )}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                value={draft}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                maxLength={1000}
                aria-label="Message for the session request"
                className="w-full resize-none rounded-xl border bg-background px-3 py-2 text-base outline-none focus:border-primary/50 md:text-sm"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="h-7 rounded-full" disabled={sending || draft.trim().length < 5}>
                  Send request
                </Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 rounded-full" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                The session gets its own chat once {first} accepts. Sessions last up to 5 days.
              </p>
            </form>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <button
          type="button"
          onClick={onHide}
          aria-label="Hide session suggestion for this chat"
          title="Just chatting? Hide this"
          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
