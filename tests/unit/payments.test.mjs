// Demo payments: the mentor's price for a session, Sodu keeps 10%.
import { test } from "node:test";
import assert from "node:assert/strict";
import { SODU_CUT, aud, sessionPayment } from "@/lib/payments";

test("a A$30 session: the student pays A$30, Sodu keeps A$3.00, the mentor gets A$27.00", () => {
  assert.equal(SODU_CUT, 0.1);
  const p = sessionPayment({ id: "8e5b118e-5504-40f8-85bd-4163af2db212", rate_per_hour: 30 });
  assert.deepEqual(p, { price: 3000, fee: 300, payout: 2700, receipt: "SODU-8E5B118E" });
  assert.equal(aud(p.payout), "A$27.00");
});

test("no listed price means no receipt", () => {
  assert.equal(sessionPayment({ id: "x", rate_per_hour: null }), null);
  assert.equal(sessionPayment({ id: "x" }), null);
});
