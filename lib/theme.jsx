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

export function toggleTheme() {
  const dark = document.documentElement.classList.contains("dark");
  applyTheme(dark ? "light" : "dark");
}
