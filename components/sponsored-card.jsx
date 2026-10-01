"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, EyeOff, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/image-lightbox";
import { initials } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

const TINTS = [
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-100",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-100",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-100",
  "bg-rose-100 text-rose-800 dark:bg-rose-900/70 dark:text-rose-100",
];

// One view per ad per persona per page load, however often the card re-renders.
const counted = new Set();

function track(ad, type, match) {
  fetch("/api/sponsored", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ad_id: ad.id, type, match }),
  }).catch(() => {});
}

export function SponsoredCard({ entry, viewerId, onHide }) {
  const { ad, match, reason } = entry;
  const ref = useRef(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [clicked, setClicked] = useState(false);
  const tint = TINTS[ad.advertiser.length % TINTS.length];

  // A view counts once half the card has been on screen.
  useEffect(() => {
    const key = `${viewerId}:${ad.id}`;
    const node = ref.current;
    if (!node || counted.has(key)) return;
    const observer = new IntersectionObserver(
      ([seen]) => {
        if (!seen.isIntersecting || counted.has(key)) return;
        counted.add(key);
        track(ad, "impression", match);
        observer.disconnect();
      },
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ad, match, viewerId]);

  function openAd() {
    setClicked(true);
    track(ad, "click", match);
  }

  function hide() {
    track(ad, "hide", match);
    onHide(ad.id);
  }

  return (
    <article
      ref={ref}
      aria-label={`Sponsored post from ${ad.advertiser}`}
      className="border-b bg-muted/20 px-4 py-4"
    >
      <div className="flex gap-3">
        <div
          aria-hidden
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
            tint
          )}
        >
          {initials(ad.advertiser)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span className="text-sm font-bold">{ad.advertiser}</span>
            <Badge variant="secondary">Sponsored</Badge>
            <Badge variant="outline" className="text-muted-foreground">
              Demo advertiser
            </Badge>
          </div>

          <h3 className="mt-1.5 font-semibold leading-snug">{ad.headline}</h3>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">{ad.body}</p>

          {ad.image && (
            <ImageLightbox
              src={ad.image}
              alt={ad.imageAlt ?? `${ad.advertiser} sponsored image`}
              className="mt-2.5 rounded-2xl border"
              imgClassName="aspect-video w-full object-cover"
            />
          )}

          <ul className="mt-2 flex flex-wrap gap-1.5">
            {ad.details.map((detail) => (
              <li
                key={detail}
                className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
              >
                {detail}
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-center gap-1">
            <Button size="sm" onClick={openAd}>
              {ad.cta}
              <ArrowUpRight data-icon="inline-end" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-expanded={whyOpen}
              onClick={() => setWhyOpen((open) => !open)}
            >
              <Info data-icon="inline-start" />
              Why this ad?
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-muted-foreground"
              onClick={hide}
              aria-label={`Hide this ad from ${ad.advertiser}`}
            >
              <EyeOff data-icon="inline-start" />
              <span className="max-sm:sr-only">Hide</span>
            </Button>
          </div>

          {clicked && (
            <p role="status" className="mt-2 text-xs text-muted-foreground">
              {ad.advertiser} is a demo advertiser. In the live product this button opens
              their page.
            </p>
          )}

          {whyOpen && (
            <div className="mt-2 flex flex-col gap-1.5 rounded-lg border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Why you&apos;re seeing this: </span>
                {reason}
              </p>
              <p>
                Sponsored posts are matched only to the units, course and goals on your profile.
                Sodu never uses your posts, chats or clicks to target ads, and advertisers never
                learn who you are. They only see total views and clicks.
              </p>
              <p>
                A person checks every ad before it runs. Sodu doesn&apos;t accept ads for
                assignment help, exam services or anything else that breaks academic integrity
                rules.
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
