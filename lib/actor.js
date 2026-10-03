// Server-only: who a request is allowed to act as.
//
// The browser sends the profile id it is acting as (author_id, profile_id,
// mentee_id...). That id is only trusted when:
//   - it is a seeded demo profile, and demo mode is on (anyone may use the
//     demo accounts, signed in or not: that's how judges try Sodu), or
//   - it is a real account (u-...) and the request comes from that account's
//     signed-in Google user.
// Nobody can act as someone else's real account.
import { ADMIN_PROFILE, PROFILES } from "./seed.js";
import { getAuthUser } from "./auth.js";
import { findProfile } from "./account.js";

const DEMO_IDS = new Set(PROFILES.map((p) => p.id));

export const isDemoProfileId = (id) => DEMO_IDS.has(id);

// Demo accounts are on unless DEMO_MODE=false (e.g. a real-users-only pilot).
export const demoMode = () => process.env.DEMO_MODE !== "false";

const deny = (error, status) => ({ ok: false, error, status });

// The signed-in user's own profile, or a denial explaining why not.
async function signedInProfile() {
  const user = await getAuthUser();
  if (!user) return deny("Sign in with Google to do that.", 401);
  const { profile, error } = await findProfile(user.id);
  if (error) return deny("Could not check your account. Try again.", 503);
  if (!profile) return deny("Finish setting up your account first.", 403);
  return { ok: true, profile };
}

// { ok: true, id, real } or { ok: false, error, status }.
export async function actAs(claimedId) {
  if (typeof claimedId !== "string" || claimedId.length === 0 || claimedId.length > 80) {
    return deny("Unknown profile.", 400);
  }
  if (isDemoProfileId(claimedId)) {
    return demoMode() ? { ok: true, id: claimedId, real: false } : deny("Demo accounts are switched off.", 403);
  }
  if (!claimedId.startsWith("u-")) return deny("Unknown profile.", 400);
  const me = await signedInProfile();
  if (!me.ok) return me;
  if (me.profile.id !== claimedId) return deny("You can only act as yourself.", 403);
  return { ok: true, id: claimedId, real: true };
}

// Moderator actions (review queue, mentor approvals, resolving reports,
// removing posts): the demo Moderator persona while demo mode is on, or a
// real account marked as moderator (profiles.is_moderator).
export async function actAsModerator(claimedId) {
  if (claimedId === ADMIN_PROFILE.id) {
    return demoMode() ? { ok: true, id: claimedId, real: false } : deny("Demo accounts are switched off.", 403);
  }
  const me = await signedInProfile();
  if (!me.ok || !me.profile.moderator) return deny("Only moderators can do that.", 403);
  if (claimedId && claimedId !== me.profile.id) return deny("You can only act as yourself.", 403);
  return { ok: true, id: me.profile.id, real: true };
}

// Writing posts and replies: anyone actAs() allows, plus the demo Moderator
// persona (its posts show as "Sodu Moderator", e.g. announcements).
export async function actAsAuthor(claimedId) {
  return claimedId === ADMIN_PROFILE.id ? actAsModerator(claimedId) : actAs(claimedId);
}

// Re-seeding the shared database: real moderator accounts only, never a demo
// persona, because anyone can pick a demo persona.
export async function requireRealModerator() {
  const me = await signedInProfile();
  if (!me.ok) return me;
  if (!me.profile.moderator) return deny("Only a signed-in moderator can reset the demo.", 403);
  return { ok: true, id: me.profile.id, real: true };
}

// Shorthand for routes: a JSON error response from a denial.
export const denied = (result) => Response.json({ error: result.error }, { status: result.status });
