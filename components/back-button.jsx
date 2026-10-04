"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Back to the page you came from (including which tab it was on). With no
// page to go back to (the link was opened in a new tab), go to `fallback`.
export function useGoBack(fallback = "/") {
  const router = useRouter();
  return () => {
    if (window.history.length > 1) router.back();
    else router.push(fallback);
  };
}

// In-app Back, so nobody needs the browser button.
export function BackButton({ fallback = "/", className }) {
  const goBack = useGoBack(fallback);

  return (
    <Button variant="ghost" size="sm" onClick={goBack} className={cn("rounded-full", className)}>
      <ArrowLeft data-icon="inline-start" />
      Back
    </Button>
  );
}

// Icon-only Back for chat headers.
export function BackArrow({ fallback = "/", label = "Back", className }) {
  const goBack = useGoBack(fallback);
  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      className={cn("rounded-full p-1.5 transition-colors hover:bg-muted", className)}
    >
      <ArrowLeft className="size-4" />
    </button>
  );
}
