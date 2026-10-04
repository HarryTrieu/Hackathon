// Mentor membership rules, shared by the API and the Mentor hub page.
// Mentors pay a fee per trimester to be listed; if no student requests a
// session in the first GUARANTEE_DAYS, they can claim the fee back.
export const PRICE_CENTS = 2500;
export const TERM_DAYS = 120;
export const GUARANTEE_DAYS = 30;
export const PRICE_LABEL = `A$${PRICE_CENTS / 100}`;

const DAY = 24 * 60 * 60 * 1000;

// Seeded demo personas mentor for free: membership is included.
export const isSeedProfile = (id) => /^p\d+$/.test(id ?? "");

export function newMembership(profileId, now = new Date()) {
  return {
    profile_id: profileId,
    amount_cents: PRICE_CENTS,
    paid_at: now.toISOString(),
    ends_at: new Date(now.getTime() + TERM_DAYS * DAY).toISOString(),
    guarantee_until: new Date(now.getTime() + GUARANTEE_DAYS * DAY).toISOString(),
    refunded_at: null,
    demo: true,
  };
}

// The membership that lists you right now, or null.
export function activeMembership(rows, now = new Date()) {
  return (
    rows
      .filter((m) => !m.refunded_at && new Date(m.ends_at) > now)
      .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0] ?? null
  );
}

// Money-back guarantee for one membership, given the session requests the
// mentor received: "open" (still counting), "met" (a request came in),
// "claimable" (window over, no requests) or "refunded".
export function guaranteeState(membership, requests, now = new Date()) {
  if (membership.refunded_at) return "refunded";
  const from = new Date(membership.paid_at);
  const until = new Date(membership.guarantee_until);
  const got = requests.some((r) => {
    const at = new Date(r.created_at);
    return at >= from && at <= until;
  });
  if (got) return "met";
  return now > until ? "claimable" : "open";
}

export function formatDay(iso) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}
