"use client";

import { useEffect, useRef, useState } from "react";
import { PenLine, ImagePlus, X, TriangleAlert, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { LinkPreview } from "@/components/link-preview";
import { usePersona } from "@/lib/persona-context";

const URL_PATTERN = /https?:\/\/[^\s]+/;

export function Composer({ onPublished }) {
  const { persona } = usePersona();
  const [text, setText] = useState("");
  const [image, setImage] = useState(null); // { url, mocked }
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const foundUrl = text.match(URL_PATTERN)?.[0] ?? null;
  // Derived, so editing the link hides a stale card without clearing state.
  const shownPreview =
    preview && preview.requested === foundUrl ? preview : null;

  // Unfurl the first link as the user types, debounced.
  useEffect(() => {
    if (!foundUrl || foundUrl === preview?.requested) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/link-preview?url=${encodeURIComponent(foundUrl)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setPreview({ ...data, requested: foundUrl });
      } catch {
        // A failed unfurl is not worth an error message in the composer.
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [foundUrl, preview?.requested]);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed. Please try again.");
        return;
      }
      setImage({ url: data.url, mocked: Boolean(data.mocked) });
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handlePost() {
    setError(null);
    setStatus(null);
    setPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          author_id: persona.id,
          text: text.trim(),
          image_url: image?.url,
          link_preview: shownPreview
            ? {
                url: shownPreview.url,
                title: shownPreview.title,
                site: shownPreview.site,
                description: shownPreview.description,
                image: shownPreview.image,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Posting failed. Please try again.");
        return;
      }

      onPublished?.(data.post);
      setText("");
      setImage(null);
      setPreview(null);
      const aiNote = data.mocked
        ? "Posted with mock AI labels (add GEMINI_API_KEY for real ones)."
        : "Posted. AI added tags and a summary.";
      const dbNote = data.persisted
        ? ""
        : " Session only: add Supabase keys to save posts.";
      setStatus(aiNote + dbNote);
    } catch {
      setError("Posting failed. Check your connection and try again.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="border-b px-4 py-3">
      <div className="flex gap-3">
        <UserAvatar profile={persona} className="shrink-0" textClassName="text-sm" />
        <div className="min-w-0 flex-1">
          <Textarea
            id="composer-input"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setStatus(null);
            }}
            placeholder="Share what you learned..."
            className="min-h-16 resize-none border-none bg-transparent p-0 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
          />

          {uploading && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
              <Spinner />
              Uploading image...
            </div>
          )}

          {image && !uploading && (
            <div className="relative mt-2 overflow-hidden rounded-xl border">
              {/* Cloudinary URLs are arbitrary, so next/image is not usable here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt="Attached preview"
                className="aspect-video w-full object-cover"
              />
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label="Remove image"
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 rounded-full"
              >
                <X />
              </Button>
              {image.mocked && (
                <Badge variant="secondary" className="absolute top-2 left-2">
                  Mock image · Cloudinary not configured
                </Badge>
              )}
            </div>
          )}

          {shownPreview && <LinkPreview preview={shownPreview} className="mt-2" />}

          {error && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
              <TriangleAlert className="size-4" />
              {error}
            </p>
          )}
          {status && !error && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              {status}
            </p>
          )}

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="sm"
                disabled={uploading || posting}
                onClick={() => fileRef.current?.click()}
                className="text-muted-foreground"
              >
                <ImagePlus data-icon="inline-start" />
                Image
              </Button>
              <p className="hidden text-xs text-muted-foreground sm:block">
                AI adds tags and a TL;DR when you post.
              </p>
            </div>
            <Button
              size="sm"
              className="rounded-full font-semibold"
              disabled={text.trim().length === 0 || uploading || posting}
              onClick={handlePost}
            >
              {posting ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <PenLine data-icon="inline-start" />
              )}
              {posting ? "Tagging..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
