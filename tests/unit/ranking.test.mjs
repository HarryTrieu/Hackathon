// Ranking: mentors by performance only (never by fees), the feed by relevance.
import { test } from "node:test";
import assert from "node:assert/strict";
import { performanceOf } from "@/lib/mentor-ai";
import { rankForYou, rankHot } from "@/lib/rank";
import { getProfile, POSTS } from "@/lib/seed";

const done = (rating) => ({ status: "completed", ended_at: "2026-09-01T00:00:00Z", rating });

test("mentor performance: 5 stars +30, 3 stars +10, 1 star -10, plus helpful votes / 10", () => {
  assert.equal(performanceOf("p1", [done(5)], 0).performance, 30);
  assert.equal(performanceOf("p1", [done(3)], 0).performance, 10);
  assert.equal(performanceOf("p1", [done(1)], 0).performance, -10);
  assert.equal(performanceOf("p1", [], 40).performance, 4);
});

test("mentor performance ignores requests that never became sessions", () => {
  const r = performanceOf("p1", [{ status: "sent" }, { status: "declined" }, done(5)], 0);
  assert.equal(r.completed_sessions, 1);
  assert.equal(r.performance, 30);
});

test("ranking has no fee input: paying more can't move a mentor up", () => {
  // Only sessions and helpful votes go in. A membership payment slipped in
  // with the requests changes nothing.
  assert.equal(performanceOf.length, 3);
  const payment = { amount_cents: 999900, paid_at: "2026-09-01T00:00:00Z" };
  assert.equal(performanceOf("p1", [payment, done(5)], 0).performance, 30);
});

test("For you gives every post a reason, strongest signal first", () => {
  const ranked = rankForYou(POSTS, getProfile("p9"), ["interviews"]);
  assert.ok(ranked.length > 0);
  const followed = ranked.find((r) => r.post.tags.includes("interviews"));
  assert.match(followed.reason, /^Because you follow interviews/);
  assert.ok(ranked.every((r) => typeof r.reason === "string" && r.reason.length > 0));
});

test("Hot sorts by Helpful votes, most first", () => {
  const counts = rankHot(POSTS).map((r) => r.post.helpful_count);
  assert.deepEqual(counts, [...counts].sort((a, b) => b - a));
});
