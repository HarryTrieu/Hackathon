const KEY = "sodu-followed-tags";

export function readFollowedTags() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY)) ?? [];
  } catch {
    return [];
  }
}

export function writeFollowedTags(tags) {
  window.localStorage.setItem(KEY, JSON.stringify([...new Set(tags)]));
}

export function toggleFollowedTag(tag) {
  const next = readFollowedTags();
  const i = next.indexOf(tag);
  if (i >= 0) next.splice(i, 1);
  else next.push(tag);
  writeFollowedTags(next);
  return next;
}
