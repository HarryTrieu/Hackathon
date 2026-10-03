// A small per-day counter for AI routes that don't keep their own count in
// the database. Lives in server memory: it resets on restart and each Vercel
// instance counts on its own, so it stops runaway use rather than billing.
const counts = (globalThis.__soduRateLimits ??= new Map());

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });

// Counts one use of `feature` by `who`; ok: false once `max` is reached today.
export function takeDailyQuota(feature, who, max) {
  const key = `${feature}|${who}|${today()}`;
  const used = counts.get(key) ?? 0;
  if (used >= max) return { ok: false, remaining: 0 };
  counts.set(key, used + 1);
  return { ok: true, remaining: max - used - 1 };
}

// Best-effort caller id for routes without a signed-in profile.
export function clientIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}
