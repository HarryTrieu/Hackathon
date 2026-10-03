// How AI flags are stored and shown. A flag is only a suggestion: a
// moderator approves or removes the post in /review.
//
// flag_reason holds "<Category>: <why>". Self-harm is different: the post is
// not hidden or treated as a violation, it gets support contacts instead, and
// its reason starts with SUPPORT_PREFIX so moderators can check in.
export const SUPPORT_PREFIX = "support:";

export const isSupportFlag = (reason) => typeof reason === "string" && reason.startsWith(SUPPORT_PREFIX);

// Text to show people: without the support prefix.
export const flagText = (reason) => (isSupportFlag(reason) ? reason.slice(SUPPORT_PREFIX.length).trim() : reason);

// Collapsed in the feed behind the reason, until a moderator approves it.
export const isHiddenByFlag = (post) =>
  Boolean(post.flag_reason) && !isSupportFlag(post.flag_reason) && post.status !== "approved";

export const SUPPORT_CONTACTS = [
  { name: "Lifeline", detail: "13 11 14, any time", href: "tel:131114" },
  { name: "Beyond Blue", detail: "1300 22 4636", href: "tel:1300224636" },
  { name: "Deakin counselling", detail: "free for students, through Student Wellbeing" },
];
