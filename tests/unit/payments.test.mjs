// Demo payments: one hour at the listed rate, Sodu keeps 15%.
import { test } from "node:test";
import assert from "node:assert/strict";
import { SODU_CUT, aud, sessionPayment } from "@/lib/payments";

test("a A$30 session: the student pays A$30, Sodu keeps A$4.50, the mentor gets A$25.50", () => {
  assert.equal(SODU_CUT, 0.15);
  const p = sessionPayment({ id: "8e5b118e-5504-40f8-85bd-4163af2db212", rate_per_hour: 30 });
  assert.deepEqual(p, { price: 3000, fee: 450, payout: 2550, receipt: "SODU-8E5B118E" });
  assert.equal(aud(p.payout), "A$25.50");
});

test("no listed rate means no receipt", () => {
  assert.equal(sessionPayment({ id: "x", rate_per_hour: null }), null);
  assert.equal(sessionPayment({ id: "x" }), null);
});
