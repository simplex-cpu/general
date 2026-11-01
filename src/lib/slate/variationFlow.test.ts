// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, test } from "bun:test";
import {
  canApproveVariation,
  completeVariationPair,
  createWriterActionLock,
  formatCtaChoice,
  historyAction,
  hookPair,
  orderedVariations,
  plannerActionLabel,
  progressTone,
  writerProgress,
} from "./variationFlow";

describe("variation flow", () => {
  test("only one regeneration, approval or planner action runs at a time", () => {
    const lock = createWriterActionLock();
    expect(lock.acquire()).toBe(true);
    expect(lock.acquire()).toBe(false);
    expect(lock.busy).toBe(true);
    lock.release();
    expect(lock.acquire()).toBe(true);
  });
  test("approve stays disabled until a variation is picked", () => {
    const msgs = [
      { kind: "script", variantGroup: 0 },
      { kind: "script", variantGroup: 0 },
    ];
    expect(canApproveVariation(msgs, 0)).toBe(false);
    expect(canApproveVariation([{ ...msgs[0], chosen: true }, msgs[1]], 0)).toBe(true);
  });

  test("a pick on a regenerated-away card does not count", () => {
    const msgs = [
      { kind: "script", variantGroup: 0, chosen: true, discarded: true },
      { kind: "script", variantGroup: 0 },
    ];
    expect(canApproveVariation(msgs, 0)).toBe(false);
  });

  test("each topic gets two different hooks, one per variation", () => {
    const hooks = [
      { topicIndex: 1, visual: "a" },
      { topicIndex: 1, visual: "b" },
      { topicIndex: 2, visual: "c" },
      { topicIndex: 2, visual: "d" },
    ];
    expect(hookPair(hooks, 1).map((h) => h?.visual)).toEqual(["c", "d"]);
  });
});

test("CTA choices produce fixed copy and require the chosen lead magnet keyword", () => {
  expect(formatCtaChoice("follow")).toBe("Follow");
  expect(formatCtaChoice("lead-magnet", " GUIDE ")).toBe("Comment “GUIDE”");
});

test("lead magnet CTA includes what the viewer receives", () => {
  expect(formatCtaChoice("lead-magnet", " GUIDE ", " to get my guide ")).toBe(
    "Comment “GUIDE” to get my guide",
  );
});

test("the last script planner action does not promise another script", () => {
  expect(plannerActionLabel(0, 3)).toBe("Add this to Planner & Write Next");
  expect(plannerActionLabel(2, 3)).toBe("Add this to Planner");
});

test("variation cards are released only as a complete ordered pair", () => {
  const one = { kind: "script", variantGroup: 0, variantLabel: "Variation 1" };
  const two = { kind: "script", variantGroup: 0, variantLabel: "Variation 2" };
  expect(completeVariationPair([two, null])).toEqual([]);
  expect(completeVariationPair([two, one]).map((item) => item.variantLabel)).toEqual([
    "Variation 1",
    "Variation 2",
  ]);
});

test("incomplete sessions continue while completed sessions can be repurposed", () => {
  expect(historyAction("In progress", true)).toBe("continue");
  expect(historyAction("Done", true)).toBe("repurpose");
  expect(historyAction("Done", false)).toBe("none");
});

test("variations are always ordered one then two", () => {
  const messages = [
    { kind: "script", variantGroup: 0, variantLabel: "Variation 2" },
    { kind: "script", variantGroup: 0, variantLabel: "Variation 1" },
  ];
  expect(orderedVariations(messages, 0).map((message) => message.variantLabel)).toEqual([
    "Variation 1",
    "Variation 2",
  ]);
});

test("progress uses traffic-light thresholds", () => {
  expect(progressTone(1, 10)).toBe("low");
  expect(progressTone(5, 10)).toBe("mid");
  expect(progressTone(8, 10)).toBe("high");
});

test("three scripts count three steps each, not six variation cards", () => {
  expect(
    writerProgress(
      [
        { kind: "script", chosen: true, captions: {}, plannerAdded: true },
        { kind: "script", discarded: true },
        { kind: "script", chosen: true },
      ],
      3,
      4,
      4,
    ),
  ).toEqual({ completed: 8, total: 13 });
});
test("single script completes five of five steps", () => {
  expect(
    writerProgress([{ kind: "script", chosen: true, captions: {}, plannerAdded: true }], 1, 2, 2),
  ).toEqual({ completed: 5, total: 5 });
});
