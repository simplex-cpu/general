// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, test } from "bun:test";
import { isInstructionTopic } from "./topicGuard";
import { extractTargetAudience } from "./promptBuilder";

describe("topic guard", () => {
  test("rejects instruction topics", () => {
    expect(isInstructionTopic("Turn one sales-call answer into next week's content")).toBe(true);
  });
  test("accepts subject topics", () => {
    expect(isInstructionTopic("Why pricing objections repeat on every sales call")).toBe(false);
  });
});

describe("target audience", () => {
  test("reads a labelled audience section", () => {
    expect(extractTargetAudience("## Target audience\nFounders of service businesses\n\n## Tone\nWarm")).toBe("Founders of service businesses");
  });
});
