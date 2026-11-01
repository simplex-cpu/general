// @ts-ignore Bun supplies its test runner at runtime.
import { describe, expect, test } from "bun:test";
import { DEFAULT_PROMPTS } from "@/lib/simplex/prompts";
import { REFINE_PRESETS, buildRefinePrompt, cleanRefined, guidelineKey, refineInstruction } from "./refine";

describe("refine", () => {
  test("each piece reads the matching Settings prompt", () => {
    expect(guidelineKey("hook", "talkingVideo")).toBe("hookTalking");
    expect(guidelineKey("hook", "carousel")).toBe("hookCarousel");
    expect(guidelineKey("script", "broll")).toBe("brollScript");
    expect(guidelineKey("slides", "carousel")).toBe("carouselSlides");
    expect(guidelineKey("cta", "graphic")).toBe("graphicCta");
    expect(guidelineKey("caption", "talkingVideo", "tiktok")).toBe("captionTiktok");
  });
  test("a chip becomes its instruction; typed words are added", () => {
    expect(refineInstruction({ preset: "shorter" })).toBe(REFINE_PRESETS.shorter);
    expect(refineInstruction({ preset: "shorter", instruction: "keep the first line" })).toBe(`${REFINE_PRESETS.shorter}\nkeep the first line`);
    expect(refineInstruction({ preset: "notAChip", instruction: "" })).toBe("");
  });
  test("typed instructions are capped", () => expect(refineInstruction({ instruction: "x".repeat(900) }).length).toBe(500));
  test("the prompt carries the piece, the change and that piece's rules", () => {
    const p = buildRefinePrompt({ piece: "hook", format: "talkingVideo", text: "Stop posting every day", instruction: "Make it punchier", brandDetails: "Brand: Risevoice", prompts: DEFAULT_PROMPTS });
    expect(p).toContain("Stop posting every day");
    expect(p).toContain("Make it punchier");
    expect(p).toContain(DEFAULT_PROMPTS.hookTalking.trim().slice(0, 40));
    expect(p).toContain("Brand: Risevoice");
  });
  test("wrapping quotes and code fences are removed", () => {
    expect(cleanRefined('"Stop posting every day"')).toBe("Stop posting every day");
    expect(cleanRefined("```\nLine one\nLine two\n```")).toBe("Line one\nLine two");
    expect(cleanRefined('He said "stop" today')).toBe('He said "stop" today');
  });
});
