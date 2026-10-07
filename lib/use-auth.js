"use client";

import { useEffect, useSyncExternalStore } from "react";
import { browserSupabase } from "./supabase-browser";
import { markSigningIn } from "./persona-store";

// The Google sign-in state, shared by every component: { ready, user }.
// ready is false until the browser has checked for a saved session.
let state = { ready: false, user: null };
const SERVER_STATE = { ready: false, user: null };
const listeners = new Set();
let started = false;

function setState(next) {
  state = next;
  for (const cb of listeners) cb();
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function start() {
  if (started) return;
  started = true;
  browserSupabase().then((supabase) => {
    if (!supabase) {
      setState({ ready: true, user: null });
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setState({ ready: true, user: data.session?.user ?? null });
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setState({ ready: true, user: session?.user ?? null });
    });
  });
}

export function useAuth() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  useEffect(() => {
    start();
  }, []);
  return snapshot;
}

// Sends the browser to Google, then back to /auth/callback and the current page.
export async function signInWithGoogle() {
  const supabase = await browserSupabase();
  if (!supabase) return { error: "Sign-in isn't set up on this server." };
  const back = `${window.location.pathname}${window.location.search}`;
  markSigningIn();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(back)}`,
      // Always show the account picker, so testers can switch Google accounts.
      queryParams: { prompt: "select_account" },
    },
  });
  return { error: error?.message ?? null };
}

export async function signOut() {
  await (await browserSupabase())?.auth.signOut();
}
