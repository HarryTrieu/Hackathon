"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResourceLink } from "@/components/resource-link";
import { usePersona } from "@/lib/persona-context";
import { MAX_RESOURCES, checkResource } from "@/lib/profile-links";
import { toast } from "@/lib/toast";

// The "Resources used" list; on your own Google profile you can add a link
// with a title and a note, or remove one.
export function ProfileResources({ profileId, resources = [] }) {
  const { persona, realActive } = usePersona();
  const router = useRouter();
  const mine = realActive && persona.id === profileId;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(resources);
  const [form, setForm] = useState({ url: "", label: "", note: "" });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function add(event) {
    event.preventDefault();
    const check = checkResource(form);
    if (!check.ok) return setError(check.error);
    if (draft.length >= MAX_RESOURCES) return setError(`Up to ${MAX_RESOURCES} resources.`);
    setDraft((prev) => [...prev.filter((r) => r.url !== check.resource.url), check.resource]);
    setForm({ url: "", label: "", note: "" });
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile-resources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile_id: profileId, resources: draft }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.error ?? "Could not save your resources.");
      toast("Resources saved");
      setEditing(false);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  const input =
    "h-9 w-full rounded-lg border bg-transparent px-3 text-base outline-none focus:border-primary/50 md:text-sm";

  if (editing) {
    return (
      <div className="space-y-3">
        {draft.map((r) => (
          <div key={r.url} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <ResourceLink resource={r} />
            </div>
            <button
              type="button"
              onClick={() => setDraft((prev) => prev.filter((x) => x.url !== r.url))}
              aria-label={`Remove ${r.label}`}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        {draft.length < MAX_RESOURCES && (
          <form onSubmit={add} className="space-y-2 rounded-lg border border-dashed p-3">
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="Link (YouTube video, website, course...)"
              className={input}
            />
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Title (optional)"
              maxLength={100}
              className={input}
            />
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Why it helped (optional)"
              maxLength={140}
              className={input}
            />
            <Button type="submit" size="sm" variant="outline" className="rounded-full" disabled={!form.url.trim()}>
              <Plus data-icon="inline-start" />
              Add resource
            </Button>
          </form>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" className="rounded-full" disabled={saving} onClick={save}>
            Save resources
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full"
            onClick={() => {
              setEditing(false);
              setDraft(resources);
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
    <>
      {resources.length === 0 && <p className="text-sm text-muted-foreground">No resources listed yet.</p>}
      {resources.map((r) => (
        <ResourceLink key={r.url} resource={r} />
      ))}
      {mine && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed p-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          {resources.length ? <Pencil className="size-3.5" /> : <Plus className="size-3.5" />}
          {resources.length ? "Edit your resources" : "Add resources that helped you"}
        </button>
      )}
    </>
  );
}
