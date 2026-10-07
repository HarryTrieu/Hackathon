"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Link2, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePersona } from "@/lib/persona-context";
import { MAX_LINKS, checkLink } from "@/lib/profile-links";
import { toast } from "@/lib/toast";

// Link chips under a profile's header; on your own (Google) profile, an
// editor to add or remove up to MAX_LINKS.
export function ProfileLinks({ profileId, links = [] }) {
  const { persona, realActive } = usePersona();
  const router = useRouter();
  const mine = realActive && persona.id === profileId;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(links.map((l) => l.url));
  const [adding, setAdding] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  if (links.length === 0 && !mine) return null;

  function add(event) {
    event.preventDefault();
    const check = checkLink(adding);
    if (!check.ok) return setError(check.error);
    if (draft.length >= MAX_LINKS) return setError(`Up to ${MAX_LINKS} links.`);
    setDraft((prev) => [...prev, check.link.url]);
    setAdding("");
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile-links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile_id: profileId, links: draft }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.error ?? "Could not save your links.");
      toast("Links saved");
      setEditing(false);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="mt-3 space-y-2 rounded-xl border bg-background/70 p-3 text-left text-sm">
        <p className="font-semibold">Your links</p>
        {draft.length === 0 && <p className="text-xs text-muted-foreground">No links yet.</p>}
        <ul className="space-y-1.5">
          {draft.map((url) => (
            <li key={url} className="flex items-center gap-2">
              <Link2 className="size-3.5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate">{url}</span>
              <button
                type="button"
                onClick={() => setDraft((prev) => prev.filter((u) => u !== url))}
                aria-label={`Remove ${url}`}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        {draft.length < MAX_LINKS && (
          <form onSubmit={add} className="flex gap-2">
            <input
              value={adding}
              onChange={(e) => setAdding(e.target.value)}
              placeholder="linkedin.com/in/you, github.com/you, your portfolio..."
              className="h-9 min-w-0 flex-1 rounded-full border bg-transparent px-3.5 text-base outline-none focus:border-primary/50 md:text-sm"
            />
            <Button type="submit" size="sm" variant="outline" className="rounded-full" disabled={!adding.trim()}>
              <Plus data-icon="inline-start" />
              Add
            </Button>
          </form>
        )}
        <p className="text-xs text-muted-foreground">
          LinkedIn, GitHub, a portfolio or anything public. Personal social and messaging links aren&apos;t allowed.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" className="rounded-full" disabled={saving} onClick={save}>
            Save links
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full"
            onClick={() => {
              setEditing(false);
              setDraft(links.map((l) => l.url));
              setError(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
      {links.map((l) => (
        <a
          key={l.url}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-full border bg-background/70 px-2.5 py-1 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary"
        >
          <ExternalLink className="size-3" />
          {l.label}
        </a>
      ))}
      {mine && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          {links.length ? <Pencil className="size-3" /> : <Plus className="size-3" />}
          {links.length ? "Edit links" : "Add links (LinkedIn, GitHub, portfolio)"}
        </button>
      )}
    </div>
  );
}
