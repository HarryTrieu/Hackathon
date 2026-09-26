"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LinkPreview({ preview, className }) {
  const [imageOk, setImageOk] = useState(Boolean(preview.image));

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block overflow-hidden rounded-xl border transition-colors duration-300 ease-out hover:border-primary/30 hover:bg-muted/30",
        className
      )}
    >
      {imageOk && (
        // Arbitrary link domains cannot be whitelisted for next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview.image}
          alt=""
          loading="lazy"
          onError={() => setImageOk(false)}
          className="aspect-video w-full border-b object-cover"
        />
      )}
      <div className="flex flex-col gap-1 p-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link2 className="size-3" />
          {preview.site}
        </span>
        <span className="text-sm font-semibold">{preview.title}</span>
        {preview.description && (
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {preview.description}
          </span>
        )}
      </div>
    </a>
  );
}
