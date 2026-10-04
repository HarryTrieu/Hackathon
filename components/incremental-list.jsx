"use client";

import { useEffect, useRef, useState } from "react";

// Renders a long list a page at a time: the first `step` items, then the
// next page whenever the end comes near. Phones only lay out what you can
// actually reach, which is most of the feed's cost.
export function IncrementalList({ items, render, step = 10 }) {
  const [count, setCount] = useState(step);
  const sentinel = useRef(null);
  const more = count < items.length;

  useEffect(() => {
    if (!more || !sentinel.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setCount((c) => c + step);
      },
      { rootMargin: "800px 0px" }
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [more, step, count]);

  return (
    <>
      {items.slice(0, count).map(render)}
      {more && <div ref={sentinel} aria-hidden className="h-px" />}
    </>
  );
}
