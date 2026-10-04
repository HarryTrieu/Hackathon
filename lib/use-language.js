"use client";

import { useSyncExternalStore } from "react";
import { LANGUAGE_CODES } from "./languages";

// The language posts are translated into: picked once in a Translate menu and
// remembered in this browser; first guess is the browser's own language.
const KEY = "sodu.language";
const listeners = new Set();

function read() {
  try {
    const saved = window.localStorage.getItem(KEY);
    if (LANGUAGE_CODES.includes(saved)) return saved;
  } catch {
    // Storage blocked: fall through to the browser language.
  }
  const browser = (navigator.language ?? "en").slice(0, 2).toLowerCase();
  return LANGUAGE_CODES.includes(browser) ? browser : "en";
}

export function useLanguage() {
  const lang = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => "en"
  );
  function setLang(code) {
    try {
      window.localStorage.setItem(KEY, code);
    } catch {
      // Not remembered, still used now.
    }
    for (const cb of listeners) cb();
  }
  return [lang, setLang];
}
