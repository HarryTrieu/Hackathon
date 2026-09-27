import { ExternalLink, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function youtubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.hostname.endsWith("youtube.com")) return u.searchParams.get("v");
  } catch {
    // Seed URLs are static; a bad one just gets the favicon card.
  }
  return null;
}

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// A resource in a profile's Path tab: YouTube videos get their thumbnail,
// everything else gets the site's icon.
export function ResourceLink({ resource }) {
  const videoId = youtubeId(resource.url);
  const domain = domainOf(resource.url);

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-lg border p-2 text-sm transition-all hover:border-primary/40 hover:bg-muted/50"
    >
      {videoId ? (
        <span className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-8 items-center justify-center rounded-full bg-black/70 text-white">
              <Play className="size-4 fill-current" />
            </span>
          </span>
        </span>
      ) : (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-md border bg-background">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
            alt=""
            loading="lazy"
            className="size-7"
          />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 font-medium">{resource.label}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Badge variant="secondary">{resource.type}</Badge>
          {resource.note ?? domain}
        </span>
      </span>
      <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
    </a>
  );
}
