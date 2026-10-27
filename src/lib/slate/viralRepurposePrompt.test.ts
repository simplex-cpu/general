// @ts-ignore Bun supplies the test runner.
import { test, expect } from "bun:test";
import { stripSourcePromotion, viralAudienceContext, prepareViralSource } from "./viralRepurposePrompt";
import type { InspoPost } from "./inspoBank";

test("removes source offers and comment prompts while retaining nearby insights", () => {
  expect(stripSourcePromotion('I noticed owners repeat themselves. DM me for my course.\nThe handoff was the problem. Comment "GUIDE" to get it.\nBook a free call. Link in bio.'))
    .toBe("I noticed owners repeat themselves.\nThe handoff was the problem.");
});
test("preserves non-promotional questions, ordered beats and line breaks", () => {
  const source = "Why does this keep happening?\nFirst, the owner checks everything.\nThen the team waits.\nWhat did you notice?";
  expect(stripSourcePromotion(source)).toBe(source);
});
test("only audience, topics and tone enter viral context", () => {
  expect(viralAudienceContext({ "Brand Name": "Sales Inc", "My Brand in Nutshell": "Buy consulting", "Pain Points": "Buy help", "My Competitive Edge": "Best offer", "My Funnel for Monetization": "Book a call", "My Target Audience": "Owners", Topics: "Delegation", "My Tone of Voice": "Conversational" }))
    .toEqual({ audience: "Owners", topics: "Delegation", tone: "Conversational" });
});
test("hook and framework are separate and length uses cleaned source without changing saved copy", () => {
  const post = { format: "Talking Video", copy: 'Owners keep checking.\nDM me for help.', whyItWorks: "Hook template: [Audience] keep [habit]\nFramework: Observation, friction, realization" } as InspoPost;
  expect(prepareViralSource(post)).toEqual({ format: "Talking Video", copy: "Owners keep checking.", wordCount: 3, hookTemplate: "[Audience] keep [habit]", framework: "Observation, friction, realization" });
  expect(post.copy).toBe('Owners keep checking.\nDM me for help.');
});
import { viralFormatRule } from "./viralRepurposePrompt";
test("viral format stays locked to the original", () => {
  expect(viralFormatRule("Talking Video", "Talking Video")).toContain("FORMAT IS LOCKED");
});
test("explicit format change follows the new format's guidelines", () => {
  expect(viralFormatRule("Talking Video", "B-roll")).toContain("B-roll guidelines");
});
