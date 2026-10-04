// Mentor membership: A$25 a trimester with a 30-day money-back guarantee.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PRICE_CENTS, PRICE_LABEL, activeMembership, guaranteeState, isSeedProfile, newMembership } from "@/lib/membership";

const PAID = new Date("2026-07-01T00:00:00Z");
const plus = (days) => new Date(PAID.getTime() + days * 24 * 60 * 60 * 1000);

test("membership costs A$25 and lasts a trimester (120 days)", () => {
  assert.equal(PRICE_CENTS, 2500);
  assert.equal(PRICE_LABEL, "A$25");
  const m = newMembership("u-x", PAID);
  assert.equal(m.amount_cents, 2500);
  assert.equal(m.ends_at, plus(120).toISOString());
  assert.equal(m.guarantee_until, plus(30).toISOString());
});

test("only an unrefunded, unexpired membership lists you; the newest wins", () => {
  const old = newMembership("u-x", plus(-200));
  const refunded = { ...newMembership("u-x", plus(0)), refunded_at: plus(31).toISOString() };
  const current = newMembership("u-x", plus(10));
  assert.equal(activeMembership([old, refunded], plus(40)), null);
  assert.equal(activeMembership([old, refunded, current], plus(40)), current);
  assert.equal(activeMembership([current], plus(200)), null);
});

test("guarantee: still counting inside 30 days with no requests", () => {
  assert.equal(guaranteeState(newMembership("u-x", PAID), [], plus(10)), "open");
});

test("guarantee: a session request inside 30 days means it was met", () => {
  assert.equal(guaranteeState(newMembership("u-x", PAID), [{ created_at: plus(12).toISOString() }], plus(40)), "met");
});

test("guarantee: no request in 30 days means the mentor can claim the fee back", () => {
  assert.equal(guaranteeState(newMembership("u-x", PAID), [], plus(31)), "claimable");
});

test("guarantee: requests before paying or after day 30 don't count", () => {
  const reqs = [{ created_at: plus(-5).toISOString() }, { created_at: plus(35).toISOString() }];
  assert.equal(guaranteeState(newMembership("u-x", PAID), reqs, plus(40)), "claimable");
});

test("guarantee: a refund can't be claimed twice", () => {
  const m = { ...newMembership("u-x", PAID), refunded_at: plus(31).toISOString() };
  assert.equal(guaranteeState(m, [], plus(40)), "refunded");
});

test("demo personas mentor free; real accounts pay", () => {
  assert.equal(isSeedProfile("p13"), true);
  assert.equal(isSeedProfile("u-3f1c2a9e-0000-4000-8000-000000000000"), false);
  assert.equal(isSeedProfile("p1x"), false);
});
