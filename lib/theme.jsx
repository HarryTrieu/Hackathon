"use client";

const KEY = "sodu-theme";

function applyTheme(next) {
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    /* ignore quota / private mode */
  }
}

// Many elements have their own colour transitions (cards, chips, buttons),
// so a plain class flip changes some parts instantly and fades others at
// different speeds. Switch with every transition off for one frame so the
// whole page changes at once.
function applyWithoutTransitions(next) {
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(style);
  applyTheme(next);
  // Force the new colours to apply before transitions come back.
  window.getComputedStyle(document.body).color;
  requestAnimationFrame(() => style.remove());
}

export function toggleTheme() {
  const dark = document.documentElement.classList.contains("dark");
  const next = dark ? "light" : "dark";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Cross-fade the whole page in one pass where the browser supports it;
  // elsewhere (or with reduce motion) switch instantly and cleanly.
  if (!document.startViewTransition || reduceMotion) {
    applyWithoutTransitions(next);
    return;
  }
  document.startViewTransition(() => applyWithoutTransitions(next));
}
