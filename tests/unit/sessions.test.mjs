// Session journey rules: states, the 5-day auto-end, ratings.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SESSION_DAYS,
  canChatInSession,
  isOpenSession,
  ratingSummary,
  sessionEndsAt,
  sessionEvents,
  sessionState,
} from "@/lib/sessions";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-10-08T12:00:00Z");
const daysAgo = (n) => new Date(NOW - n * DAY).toISOString();
const accepted = (extra = {}) => ({ status: "accepted", decided_at: daysAgo(1), created_at: daysAgo(2), ...extra });
const justNow = () => new Date().toISOString();

test("a request moves pending -> active -> ending -> completed", () => {
  assert.equal(sessionState({ status: "sent" }, NOW), "pending");
  assert.equal(sessionState(accepted(), NOW), "active");
  assert.equal(sessionState(accepted({ end_requested_at: daysAgo(0) }), NOW), "ending");
  assert.equal(sessionState(accepted({ ended_at: daysAgo(0), rating: 5 }), NOW), "completed");
});

test("a declined request is declined, never open", () => {
  assert.equal(sessionState({ status: "declined" }, NOW), "declined");
  assert.equal(isOpenSession({ status: "declined" }), false);
});

test("the session ends by itself 5 days after the mentor accepts", () => {
  assert.equal(SESSION_DAYS, 5);
  const r = accepted({ decided_at: "2026-10-01T00:00:00.000Z" });
  assert.equal(sessionEndsAt(r), "2026-10-06T00:00:00.000Z");
});

test("nobody can keep a session open to avoid paying: day 6 counts as completed", () => {
  assert.equal(sessionState(accepted({ decided_at: daysAgo(4) }), NOW), "active");
  assert.equal(sessionState(accepted({ decided_at: daysAgo(6) }), NOW), "completed");
  assert.equal(sessionState(accepted({ decided_at: daysAgo(6), end_requested_at: daysAgo(5) }), NOW), "completed");
});

test("the mentor's Mark as done only asks; the room stays open", () => {
  const r = accepted({ decided_at: justNow(), end_requested_at: justNow() });
  assert.equal(sessionState(r), "ending");
  assert.equal(canChatInSession(r), true);
});

test("the session room is read-only before it starts and after it ends", () => {
  assert.equal(canChatInSession({ status: "sent" }), false);
  assert.equal(canChatInSession({ status: "declined" }), false);
  assert.equal(canChatInSession({ status: "accepted", decided_at: justNow(), ended_at: justNow() }), false);
  assert.equal(canChatInSession({ status: "accepted", decided_at: justNow() }), true);
});

test("rating summary: average to one decimal and percent who said it helped", () => {
  const s = ratingSummary([{ rating: 5, helped: true }, { rating: 4, helped: true }, { rating: 4, helped: false }, { rating: null }]);
  assert.deepEqual(s, { average: 4.3, count: 3, helpedPercent: 67 });
  assert.equal(ratingSummary([{ status: "sent" }]), null);
});

test("an auto-ended session says so in the room's timeline", () => {
  const nineDaysAgo = new Date(Date.now() - 9 * DAY).toISOString();
  const events = sessionEvents(accepted({ decided_at: nineDaysAgo, mentor_id: "p1" }), "p9", "Sarah Chen");
  assert.ok(events.some((e) => e.text === `Session ended after ${SESSION_DAYS} days`));
});
