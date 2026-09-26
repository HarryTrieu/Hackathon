"use client";

import { useEffect, useState } from "react";

// One fetch per persona, shared by every PostCard on the page.
const cache = new Map(); // personaId -> Promise<Set<postId>>

function loadLiked(personaId) {
  if (!cache.has(personaId)) {
    cache.set(
      personaId,
      fetch(`/api/helpful?profile_id=${personaId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => new Set(data?.liked ?? []))
        .catch(() => new Set())
    );
  }
  return cache.get(personaId);
}

export function useLikedPosts(personaId) {
  const [liked, setLiked] = useState({ personaId: null, set: new Set() });
  useEffect(() => {
    let cancelled = false;
    loadLiked(personaId).then((set) => {
      if (!cancelled) setLiked({ personaId, set });
    });
    return () => {
      cancelled = true;
    };
  }, [personaId]);
  return {
    set: liked.personaId === personaId ? liked.set : new Set(),
    ready: liked.personaId === personaId,
  };
}

// Update the cache for the next page load. Do not mutate the Set already
// held in React state, or the count formula double-counts and can go to -1.
export function rememberVote(personaId, postId, isLiked) {
  const pending = cache.get(personaId);
  if (!pending) return;
  cache.set(
    personaId,
    pending.then((set) => {
      const next = new Set(set);
      if (isLiked) next.add(postId);
      else next.delete(postId);
      return next;
    })
  );
}
