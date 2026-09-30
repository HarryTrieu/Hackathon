"use client";

import { useEffect, useRef, useState } from "react";
import { PostDialogButton } from "@/components/post-dialog";
import { cn } from "@/lib/utils";

// X-style floating "+" just above the mobile bottom nav: slides away while
// you scroll down and comes back as soon as you scroll up (or reach the top).
// Rendered inside the nav, which is fixed and blurred, so it is positioned
// against the nav rather than the window.
export function FloatingPostButton() {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) < 8) return; // ignore tiny jitters
      setVisible(delta < 0 || y < 80);
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "absolute -top-18 right-4 transition-all duration-300 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-6 scale-90 opacity-0"
      )}
    >
      <PostDialogButton compact />
    </div>
  );
}
