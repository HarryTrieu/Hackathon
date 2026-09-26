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
  return liked.personaId === personaId ? liked.set : new Set();
}

// Keep the shared cache in sync after a vote so other cards agree.
export function rememberVote(personaId, postId, isLiked) {
  loadLiked(personaId).then((set) => {
    if (isLiked) set.add(postId);
    else set.delete(postId);
  });
}
