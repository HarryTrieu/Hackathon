// Safety rules that work without the AI: the moderation keyword fallback,
// how flags show, the AI mentor's offline replies, profile link rules and
// the daily AI limits.
import { test } from "node:test";
import assert from "node:assert/strict";
import { enrichPost } from "@/lib/enrich";
import { flagText, isHiddenByFlag, isSupportFlag } from "@/lib/moderation";
import { mockMentorReply } from "@/lib/mentor-ai";
import { SEED_MENTORS } from "@/lib/mentors";
import { getProfile } from "@/lib/seed";
import { checkLink, checkResource } from "@/lib/profile-links";
import { takeDailyQuota } from "@/lib/rate-limit";

// Force the keyword fallback, as if Gemini were down.
delete process.env.GEMINI_API_KEY;
const flagOf = async (text) => (await enrichPost(text)).flag_reason;

test("fallback flags selling assessment answers", async () => {
  assert.match(await flagOf("Selling SIT102 assignment answers, cheap $50"), /^Selling or sharing assessment answers/);
  assert.match(await flagOf("I can write your essay for MMK101, DM me"), /^Selling or sharing assessment answers/);
});

test("fallback flags scams, threats and harassment", async () => {
  assert.match(await flagOf("Guaranteed returns on this crypto investment, double your money"), /^Possible scam/);
  assert.match(await flagOf("I'm going to stab him after class"), /^Violence/);
  assert.match(await flagOf("you're stupid, go back to your country"), /^Hate or harassment/);
});

test("fallback flags a personal phone or email, but not a Deakin email", async () => {
  assert.match(await flagOf("Text me on 0412 345 678 for notes"), /^Personal contact details/);
  assert.match(await flagOf("email me at minh.study@gmail.com"), /^Personal contact details/);
  assert.equal(await flagOf("Email the unit chair at s.chen@deakin.edu.au"), null);
});

test("self-harm gets support, not a penalty: never hidden", async () => {
  const reason = await flagOf("honestly I want to die, I'm so behind");
  assert.ok(isSupportFlag(reason));
  assert.equal(isHiddenByFlag({ flag_reason: reason, status: "published" }), false);
  assert.doesNotMatch(flagText(reason), /^support:/);
});

test("ordinary posts aren't flagged, and unit codes are picked up", async () => {
  const r = await enrichPost("Anyone want to study SIT102 and MAA103 together at the library on Thursday?");
  assert.equal(r.flag_reason, null);
  assert.deepEqual(r.unit_codes, ["SIT102", "MAA103"]);
});

test("a flag hides the post until a moderator approves it", () => {
  const post = { flag_reason: "Possible scam: promises money", status: "published" };
  assert.equal(isHiddenByFlag(post), true);
  assert.equal(isHiddenByFlag({ ...post, status: "approved" }), false);
});

test("Vietnamese posts are detected (so they get an English summary)", async () => {
  assert.equal((await enrichPost("Có ai học SIT102 không? Mình cần giúp đỡ.")).lang, "vi");
});

const listing = { ...SEED_MENTORS.find((m) => m.unit_code === "SIT102"), profile: getProfile("p2") };

test("offline AI mentor refuses to do graded work", () => {
  assert.match(mockMentorReply(listing, "Can you just give me the answers to the assignment?"), /can't write assessment work/);
});

test("offline AI mentor sends visa and crisis questions to the right service", () => {
  assert.match(mockMentorReply(listing, "How many hours can I work on my visa?"), /Home Affairs/);
  assert.match(mockMentorReply(listing, "I want to die"), /Counselling/);
  assert.match(mockMentorReply(listing, "what's your phone number?"), /don't share personal contact details/);
});

test("profile links: https only, labelled, no personal social or messaging sites", () => {
  assert.deepEqual(checkLink("linkedin.com/in/sarah"), { ok: true, link: { url: "https://linkedin.com/in/sarah", label: "LinkedIn" } });
  assert.equal(checkLink("http://github.com/sarah").ok, false);
  for (const bad of ["instagram.com/me", "https://m.facebook.com/me", "wa.me/61400000000", "t.me/sellanswers", "discord.gg/abc"]) {
    assert.equal(checkLink(bad).ok, false, bad);
  }
  assert.equal(checkLink("not a link").ok, false);
});

test("resources: YouTube is a Video, titles and notes are cut to size", () => {
  const r = checkResource({ url: "https://youtu.be/abc", label: "x".repeat(150), note: "y".repeat(200) });
  assert.equal(r.resource.type, "Video");
  assert.equal(r.resource.label.length, 100);
  assert.equal(r.resource.note.length, 140);
});

test("daily AI limits stop at the cap, per person", () => {
  for (let i = 0; i < 3; i++) assert.equal(takeDailyQuota("test", "a", 3).ok, true);
  assert.equal(takeDailyQuota("test", "a", 3).ok, false);
  assert.equal(takeDailyQuota("test", "b", 3).ok, true);
});
