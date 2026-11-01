// @ts-nocheck -- Bun provides this module to its test runner.
import { expect, test } from "bun:test";
import { applySelectedCta, captionStructureInstruction, completeVideoScript, formatTalkingVideoParagraphs, selectedCtaInstruction } from "./scriptCta";
import { normalizeDesignSlides } from "./designTemplates";

test("talking video does not persist a separate CTA field", () => {
  const doc = {
    kind: "video",
    format: "talkingVideo",
    script: "Useful body",
    visualHook: "",
    onScreenCta: "DM for a free consultation",
  };
  expect(applySelectedCta(doc, "Save").onScreenCta).toBe("");
});

test("B-roll keeps its CTA out of the overlay and separate field", () => {
  const cta = "Comment “GUIDE” to get my guide";
  expect(
    applySelectedCta(
      { kind: "video", format: "broll", script: "Useful overlay", visualHook: "", onScreenCta: "" },
      cta,
    ),
  ).toMatchObject({ script: "Useful overlay", onScreenCta: "" });
});

test("carousel action follows requested CTA, not model-invented action", () => {
  const slides = normalizeDesignSlides(
    "carousel",
    "quote",
    [{ role: "cta", headline: "Get a free consultation", actionLabel: "DM" }],
    "Topic",
    "Save",
  );
  expect(slides.at(-1).headline).toBe("Topic starts with your next move.");
  expect(slides.at(-1).body).toBe("Save");
  expect(slides.at(-1).actionLabel).toBe("Save");
});

test("writer instructions prohibit invented offers and preserve the reward", () => {
  const instruction = selectedCtaInstruction("talkingVideo", "Comment “GUIDE” to get my guide");
  expect(instruction).toContain("SELECTED CTA (AUTHORITATIVE");
  expect(instruction).toContain("Comment “GUIDE” to get my guide");
  expect(instruction).toContain("Never invent an offer");
  expect(instruction).toContain("natural final thought");
});

test("legacy talking video hook is included exactly once in delivered script", () => {
  const base = { kind: "video", format: "talkingVideo", visualHook: "", onScreenCta: "", spokenHook: "Start here" };
  expect(completeVideoScript({ ...base, script: "Start here\n\nUseful body" })).toBe("Start here\n\nUseful body");
  expect(completeVideoScript({ ...base, script: "Useful body" })).toBe("Start here\n\nUseful body");
});

test("talking video copy uses paragraphs of no more than three sentences", () => {
  const formatted = formatTalkingVideoParagraphs(
    "First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.",
  );
  expect(formatted).toBe(
    "First sentence. Second sentence. Third sentence.\n\nFourth sentence. Fifth sentence.",
  );
});

test("talking video paragraph formatting preserves every sentence", () => {
  const source = "Open strong! Explain the idea. Add proof. Land the takeaway? Close naturally.";
  expect(formatTalkingVideoParagraphs(source).replace(/\n+/g, " ")).toBe(source);
});

test("B-roll and graphic instructions reserve CTA for captions", () => {
  expect(selectedCtaInstruction("broll", "Save this")).toContain("only in the platform captions");
  expect(selectedCtaInstruction("graphic", "Save this")).toContain("only in the platform captions");
});

test("caption CTA keeps its keyword and reward while requiring a natural transition", () => {
  const instruction = captionStructureInstruction("Comment “GUIDE” to get my guide");
  expect(instruction).toContain("blank line");
  expect(instruction).toContain("natural transition");
  expect(instruction).toContain("Comment “GUIDE” to get my guide");
});

test("caption instructions do not invent a CTA when the format already owns it", () => {
  const instruction = captionStructureInstruction("");
  expect(instruction).toContain("Do not add a CTA");
  expect(instruction).not.toContain("close with a natural transition into the selected CTA");
});
