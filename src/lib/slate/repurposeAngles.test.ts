// @ts-ignore Bun supplies the test runner.
import { test, expect } from "bun:test";
import { parseAngles, parseViralAngles, validateStoryPlan, type StoryPlan } from "./repurposeAngles";

const raw = JSON.stringify({ angles: [
  { angle: "A", hookPreview: "Okay, we need to break down A" },
  { angle: "B", hookPreview: "" },
  { angle: "C", hookPreview: "Okay, we need to break down C" },
] });

test("viral angles without a hook preview are dropped", () => {
  expect(parseAngles(raw, true).map((a) => a.angle)).toEqual(["A", "C"]);
});

test("own-post angles do not need a hook preview", () => {
  expect(parseAngles(raw, false)).toHaveLength(3);
});

const framework = "[Top rating] [resources] for [audience], with bigger payoffs as the countdown unfolds.";
const plan: StoryPlan = {
  contract: { mechanism: "ranked_countdown", subjectType: "resources", hookPattern: "Top 3 resources for social strategists", escalatingPayoff: true,
    beats: [ { id: "3", role: "Useful starting resource" }, { id: "2", role: "Stronger practical resource" }, { id: "1", role: "Biggest payoff" } ] },
  expertiseAnchor: "Social media strategy and testing",
  hookPreview: "Top 3 resources for social strategists",
  beats: [
    { sourceBeatId: "3", subject: "Platform help center", insight: "Verify eligibility before testing", payoff: "Avoid an ineligible test", payoffLevel: 1 },
    { sourceBeatId: "2", subject: "Account retention report", insight: "Find where viewers leave", payoff: "Diagnose the weak beat", payoffLevel: 2 },
    { sourceBeatId: "1", subject: "Controlled testing log", insight: "Compare one change at a time", payoff: "Build reusable decisions from evidence", payoffLevel: 3 },
  ],
};
const candidate = { angle: "Resources to diagnose content instead of guessing", belief: "More posting fixes weak content", fit: "Strategy and testing expertise", hookPreview: plan.hookPreview, expertiseAnchor: plan.expertiseAnchor, beats: plan.beats };
const payload = (contract = plan.contract, beats = plan.beats) => JSON.stringify({ contract, angles: [candidate, { ...candidate, angle: "Resources for better content tests", beats }] });

test("ranked resources preserve all three concrete ordered beats into the selected plan", () => {
  const result = parseViralAngles(payload(), framework);
  expect(result[0]?.storyPlan?.beats.map(b => b.subject)).toEqual(["Platform help center", "Account retention report", "Controlled testing log"]);
});
test("countdowns reject repeated resources", () => {
  expect(validateStoryPlan({ ...plan, beats: plan.beats.map(b => ({ ...b, subject: "Same resource" })) })).toBe(false);
});
test("countdowns reject flat or falling payoff progression", () => {
  expect(validateStoryPlan({ ...plan, beats: plan.beats.map(b => ({ ...b, payoffLevel: 1 })) })).toBe(false);
});
test("every source story beat must have a corresponding candidate beat in order", () => {
  expect(validateStoryPlan({ ...plan, beats: [...plan.beats].reverse() })).toBe(false);
  expect(validateStoryPlan({ ...plan, beats: plan.beats.slice(0, 2) })).toBe(false);
});
test("a ranked-resource source cannot silently become a generic story", () => {
  expect(() => parseViralAngles(payload({ ...plan.contract, mechanism: "story" }), framework)).toThrow();
});
test("bigger-payoff source promise cannot be switched off", () => {
  expect(() => parseViralAngles(payload({ ...plan.contract, escalatingPayoff: false }), framework)).toThrow();
});
test("missing substantive insights are never valid candidate beats", () => {
  expect(() => parseViralAngles(payload(plan.contract, plan.beats.map(b => ({ ...b, insight: "" }))), framework)).toThrow();
});
test("non-escalating comparisons are allowed without forcing countdown progression", () => {
  expect(validateStoryPlan({ ...plan, contract: { ...plan.contract, mechanism: "comparison", escalatingPayoff: false }, beats: plan.beats.map(b => ({ ...b, payoffLevel: 1 })) })).toBe(true);
});
