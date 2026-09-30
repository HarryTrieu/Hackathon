"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// An image you can click to see full size on a dark backdrop. Esc, the X
// or a click outside the image closes it.
export function ImageLightbox({ src, alt, className, imgClassName }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="View image full size"
        className={cn("block w-full cursor-pointer overflow-hidden", className)}
      >
        {/* Uploaded and demo URLs are arbitrary, so next/image is not usable here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={cn("transition-opacity duration-300 hover:opacity-90", imgClassName)}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-black/85" />
          <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <DialogTitle className="sr-only">{alt}</DialogTitle>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="h-auto max-h-[88vh] w-[min(92vw,1100px)] rounded-lg object-contain"
            />
            <DialogPrimitive.Close
              aria-label="Close image"
              className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <XIcon className="size-5" />
            </DialogPrimitive.Close>
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    </>
  );
}
