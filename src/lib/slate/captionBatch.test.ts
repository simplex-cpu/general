// @ts-nocheck -- Bun test runtime.
import { expect, test } from "bun:test";
import { validateCaptionBatch } from "./captionBatch";

const caption = { instagram: "IG", facebook: "FB", tiktok: "TT", youtube: "YT", visualHook: "" };
test("one approved script receives one complete four-platform caption batch", () => {
  expect(validateCaptionBatch({ captions: [caption] }, 1)).toEqual([{ ...caption, visualHookOptions: [] }]);
});
test("incomplete batches and missing platforms cannot silently succeed", () => {
  expect(() => validateCaptionBatch({ captions: [] }, 1)).toThrow();
  expect(() => validateCaptionBatch({ captions: [{ ...caption, tiktok: "" }] }, 1)).toThrow();
});

import { normalizeCaptionList } from "./captionBatch";
import { test as t2, expect as e2 } from "bun:test";
const one = { instagram: "a", facebook: "b", tiktok: "c", youtube: "d", visualHook: "" };
t2("accepts captions delivered as a JSON string", () => {
  e2(normalizeCaptionList({ captions: JSON.stringify([one]) })).toHaveLength(1);
});
t2("accepts a single bare caption object", () => {
  e2(normalizeCaptionList(one)).toHaveLength(1);
});

import { cleanHookOptions as _clean, needsVisualHookChoice as _needs } from "./captionBatch";
import { describe as describe, test as test, expect as expect } from "bun:test";
describe("visual hook options", () => {
  test("keeps three distinct options", () => {
    expect(_clean(["A", "a", "B", "C", "D"])).toEqual(["A", "B", "C"]);
  });
  test("talking video with options blocks planner until one is picked", () => {
    const doc: any = { kind: "video", format: "talkingVideo", visualHookOptions: ["A", "B", "C"], visualHook: "" };
    expect(_needs(doc)).toBe(true);
    expect(_needs({ ...doc, visualHook: "B" })).toBe(false);
    expect(_needs({ ...doc, format: "broll" })).toBe(false);
  });
});
