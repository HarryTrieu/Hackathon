"use client";

import { useEffect, useRef, useState } from "react";

// How many items each remembered list had shown, kept in memory while you
// move around the app, so Back rebuilds the same length and the browser can
// put you back where you were. A reload starts fresh.
const shown = new Map();

export function forgetListLength(key) {
  shown.delete(key);
}

// Renders a long list a page at a time: the first `step` items, then the
// next page whenever the end comes near. Phones only lay out what you can
// actually reach, which is most of the feed's cost. Pass `memoryKey` to
// remember how far the list had grown.
export function IncrementalList({ items, render, step = 10, memoryKey }) {
  const [count, setCount] = useState(() => (memoryKey && shown.get(memoryKey)) || step);
  const sentinel = useRef(null);
  const more = count < items.length;

  useEffect(() => {
    if (memoryKey) shown.set(memoryKey, count);
  }, [memoryKey, count]);

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
