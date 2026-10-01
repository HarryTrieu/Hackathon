"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "./use-auth";

// Who you are in Sodu right now:
//   "loading"        still checking
//   "demo"           signed out: you're a seeded demo persona
//   "needs-profile"  signed in with Google but /welcome not done yet
//   "ready"          signed in with a Sodu profile
// plus { user, profile, error }.
let state = { userId: null, loaded: false, profile: null, error: null };
const EMPTY = { userId: null, loaded: false, profile: null, error: null };
const listeners = new Set();
let inflight = null;

function setState(next) {
  state = next;
  for (const cb of listeners) cb();
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function load(userId) {
  if (inflight?.userId === userId) return inflight.promise;
  const promise = fetch("/api/me", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null)
    .then((data) => {
      setState({
        userId,
        loaded: true,
        profile: data?.profile ?? null,
        error: data ? (data.error ?? null) : "network",
      });
    })
    .finally(() => {
      if (inflight?.promise === promise) inflight = null;
    });
  inflight = { userId, promise };
  return promise;
}

// Re-read the profile, e.g. right after /welcome saves it.
export function setAccountProfile(userId, profile) {
  setState({ userId, loaded: true, profile, error: null });
}

export function useAccount() {
  const { ready, user } = useAuth();
  const snap = useSyncExternalStore(subscribe, () => state, () => EMPTY);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (userId && !(state.userId === userId && state.loaded)) load(userId);
  }, [userId]);

  if (!ready) return { status: "loading", user: null, profile: null, error: null };
  if (!user) return { status: "demo", user: null, profile: null, error: null };
  if (snap.userId !== user.id || !snap.loaded) return { status: "loading", user, profile: null, error: null };
  return {
    status: snap.profile ? "ready" : "needs-profile",
    user,
    profile: snap.profile,
    error: snap.error,
  };
}
