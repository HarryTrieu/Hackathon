"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// In-app Back, so nobody needs the browser button. With no page to go back
// to (the link was opened in a new tab), it goes to `fallback` instead.
export function BackButton({ fallback = "/", className }) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(fallback);
  }

  return (
    <Button variant="ghost" size="sm" onClick={goBack} className={cn("rounded-full", className)}>
      <ArrowLeft data-icon="inline-start" />
      Back
    </Button>
  );
}
