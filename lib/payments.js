// Demo payments. Nothing is charged: when a session ends (the student ends
// it, or it ends by itself after SESSION_DAYS), the student "pays" the
// mentor's price for a session, as listed when the request was made. Sodu
// keeps SODU_CUT and the mentor receives the rest. Real payments come later.
// (The column is called rate_per_hour for history; it holds the price per
// session.)
export const SODU_CUT = 0.15;

// { price, fee, payout, receipt } in cents, or null when the session has no
// listed rate (requests made before rates were saved).
export function sessionPayment(request) {
  const rate = request?.rate_per_hour;
  if (typeof rate !== "number" || rate <= 0) return null;
  const price = Math.round(rate * 100);
  const fee = Math.round(price * SODU_CUT);
  return {
    price,
    fee,
    payout: price - fee,
    receipt: `SODU-${String(request.id ?? "").replaceAll("-", "").slice(0, 8).toUpperCase()}`,
  };
}

export const aud = (cents) => `A$${(cents / 100).toFixed(2)}`;
