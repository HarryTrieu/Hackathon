import { getProfile } from "./seed.js";

// The author of a post or reply: a seeded profile, or the real (Google)
// account the server attached to it as `author`. null when unknown.
export const authorOf = (item) => getProfile(item.author_id) ?? item.author ?? null;

// Only the items whose author we can show, so one unknown author can never
// break a whole feed.
export const withAuthors = (items) => items.filter((item) => authorOf(item));
