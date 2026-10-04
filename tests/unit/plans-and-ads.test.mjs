// Study plans (offline) and sponsored-post placement.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildStudyPlan, planBlocks, planReferences } from "@/lib/study-plan";
import { OUTLINES, resourcesFor, taskGrade } from "@/lib/study-outlines";
import { SPONSORED, sponsoredFor, withSponsored } from "@/lib/sponsored";
import { getProfile } from "@/lib/seed";

delete process.env.GEMINI_API_KEY;

test("a Pass plan has fewer tasks than a High Distinction plan, all from the outline", () => {
  const count = (goal) => planBlocks("SIT102", { goal }).flatMap((b) => b.tasks).length;
  assert.ok(count(0) < count(3));
  for (const b of planBlocks("SIT102", { goal: 0 })) assert.ok(b.tasks.every((t) => taskGrade(t) === 0));
});

test("every unit with plans has six blocks", () => {
  for (const [code, blocks] of Object.entries(OUTLINES)) assert.equal(blocks.length, 6, code);
});

test("offline plan only links to the unit's checked resources", async () => {
  const plan = await buildStudyPlan({ unit: { code: "SIT102", name: "Intro to Programming" }, inputs: { goal: 2, weak_spots: ["pointers"] }, posts: [] });
  assert.equal(plan.mocked, true);
  const allowed = new Set(resourcesFor("SIT102").map((r) => r.key));
  const used = plan.blocks.flatMap((b) => b.steps.flatMap((s) => s.resources));
  assert.ok(used.length > 0);
  assert.ok(used.every((k) => allowed.has(k)));
  const refs = planReferences("SIT102", []);
  assert.ok(Object.values(refs.links).every((l) => l.url.startsWith("https://")));
});

test("no study plan for a unit without an outline", async () => {
  assert.equal(await buildStudyPlan({ unit: { code: "XYZ999" }, inputs: { goal: 1, weak_spots: [] }, posts: [] }), null);
});

test("ads: at most 3, matched to the viewer, hidden ones never come back", () => {
  const me = getProfile("p10");
  const ads = sponsoredFor(me);
  assert.ok(ads.length > 0 && ads.length <= 3);
  const hidden = sponsoredFor(me, [ads[0].ad.id]);
  assert.ok(hidden.every((a) => a.ad.id !== ads[0].ad.id));
});

test("ads aimed at other students don't fill gaps", () => {
  const nobody = { units: [], goals: [], course: "Nursing" };
  const untargeted = SPONSORED.filter((ad) => !ad.units.length && !ad.goals.length && !ad.courses.length).length;
  assert.equal(sponsoredFor(nobody).length, Math.min(3, untargeted));
});

test("ads sit after post 3, then every 8 posts", () => {
  const posts = Array.from({ length: 20 }, (_, i) => ({ id: i }));
  const ads = [{ ad: { id: "a" } }, { ad: { id: "b" } }, { ad: { id: "c" } }];
  const mixed = withSponsored(posts, ads);
  const at = mixed.map((x, i) => (x.sponsored ? i : -1)).filter((i) => i >= 0);
  assert.deepEqual(at, [3, 12, 21]);
});
