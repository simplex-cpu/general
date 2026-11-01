// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, it } from "bun:test";
import { assignBalancedCarouselSubtypes, carouselInsightScore, designStructurePrompt, normalizeDesignSlides, validateDesignCopy, wordCount } from "./designTemplates";
import { buildCarouselFrames, sanitizeArtworkText } from "./designFrames";

describe("structured design templates", () => {
  it("creates exactly six quote-carousel slides in the required order", () => {
    const slides = normalizeDesignSlides("carousel", "quote", [], "A topic", "");
    expect(slides).toHaveLength(6);
    expect(slides.map((slide) => slide.role)).toEqual(["hook", "content", "content", "content", "content", "cta"]);
    expect(slides[5].headline).not.toBe("");
    expect(slides[5].actionLabel).not.toBe("");
  });

  it("creates exactly ten insightful-carousel slides in the required order", () => {
    const slides = normalizeDesignSlides("carousel", "insightful", [], "A topic", "");
    expect(slides).toHaveLength(10);
    expect(slides[0].role).toBe("hook");
    expect(slides.slice(1, 9).every((slide) => slide.role === "content")).toBe(true);
    expect(slides[9].role).toBe("cta");
  });

  it("enforces every insightful word maximum", () => {
    const many = "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen";
    const slides = normalizeDesignSlides("carousel", "insightful", [
      { role: "hook", headline: many, body: many },
      ...Array.from({ length: 8 }, () => ({ role: "content" as const, headline: many, body: many })),
    ]);
    expect(wordCount(slides[0].headline)).toBe(8);
    expect(wordCount(slides[0].subtitle || "")).toBe(10);
    expect(slides[0].body).toBeUndefined();
    expect(wordCount(slides[1].headline)).toBe(6);
    expect(wordCount(slides[1].body || "")).toBe(15);
  });

  it("never adds a CTA to either graphic template", () => {
    expect(normalizeDesignSlides("graphic", "quote", [{ headline: "A quote" }]).map((s) => s.role)).toEqual(["content"]);
    expect(normalizeDesignSlides("graphic", "insightful", [{ headline: "A title", body: "A body" }]).map((s) => s.role)).toEqual(["content"]);
  });

  it("requires a graphic subtitle and complete carousel CTA", () => {
    expect(validateDesignCopy("graphic", "quote", [{ headline: "A quote" }])).toBe("Graphic needs a subtitle.");
    expect(validateDesignCopy("graphic", "quote", [{ headline: "A quote", body: "A useful subtitle" }])).toBeNull();
    const carousel = normalizeDesignSlides("carousel", "quote", [
      { role: "hook", headline: "Challenge the familiar" },
      ...Array.from({ length: 4 }, (_, index) => ({ role: "content" as const, headline: `Belief ${index + 1}` })),
      { role: "cta", headline: "Choose a stronger belief", body: "Save this for later", actionLabel: "Save" },
    ], "A topic", "Save");
    expect(validateDesignCopy("carousel", "quote", carousel)).toBeNull();
    expect(validateDesignCopy("carousel", "quote", carousel.map((slide, index) => index === 5 ? { ...slide, body: "" } : slide))).toContain("invitation");
  });

  it("classifies an explanatory website visibility topic as strongly insightful", () => {
    expect(carouselInsightScore({ title: "Why is my website not appearing in ChatGPT?" })).toBeGreaterThan(0);
  });

  it("keeps even and odd carousel batches within one of a 50/50 split", () => {
    const topics = [
      { title: "Why your website is missing" },
      { title: "How discovery works" },
      { title: "Stop waiting for permission" },
      { title: "The belief holding founders back" },
      { title: "A practical guide to visibility" },
    ];
    const four = assignBalancedCarouselSubtypes(topics.slice(0, 4));
    const five = assignBalancedCarouselSubtypes(topics);
    expect(four.filter((topic) => topic.designSubtype === "insightful")).toHaveLength(2);
    expect(Math.abs(five.filter((topic) => topic.designSubtype === "insightful").length - five.filter((topic) => topic.designSubtype === "quote").length)).toBe(1);
  });

  it("defines quote sequences as one belief challenge rather than mini explanations", () => {
    const rule = designStructurePrompt("carousel", "quote");
    expect(rule).toContain("one coherent challenge or belief shift");
    expect(rule).toContain("Never compress a broader explanation");
  });

  it("keeps a natural carousel CTA when it preserves the selected action and reward", () => {
    const slides = normalizeDesignSlides(
      "carousel",
      "insightful",
      [{ role: "cta", headline: "Turn visibility into a repeatable advantage.", body: "Want the steps in one place? Comment GUIDE to get my guide." }],
      "A topic",
      "Comment “GUIDE” to get my guide",
    );
    expect(slides.at(-1)?.headline).toBe("Turn visibility into a repeatable advantage.");
    expect(slides.at(-1)?.body).toBe("Want the steps in one place? Comment GUIDE to get my guide.");
    expect(slides.at(-1)?.actionLabel).toBe("Comment");
  });

  it("separates a selected CTA from a fallback closing statement", () => {
    const slides = normalizeDesignSlides("carousel", "quote", [], "Better positioning", "Save");
    expect(slides.at(-1)?.headline).toBe("Better positioning starts with your next move.");
    expect(slides.at(-1)?.body).toBe("Save");
    expect(slides.at(-1)?.actionLabel).toBe("Save");
  });

  it("keeps structural labels out of the carousel writing instruction", () => {
    const rule = designStructurePrompt("carousel", "insightful");
    expect(rule).toContain("Never place structural labels");
    expect(rule).toContain("powerful closing statement");
  });

  it("never renders internal section labels as artwork", () => {
    expect(sanitizeArtworkText("title\nA stronger idea\nbody\nUseful detail")).toBe("A stronger idea\nUseful detail");
    const frames = buildCarouselFrames(
      normalizeDesignSlides("carousel", "quote", [], "Positioning", "Share"),
      { titleFont: "", bodyFont: "", coverBackground: "", slidesBackground: "", titleColor: "", subtitleColor: "", textColor: "" },
      "quote",
    );
    expect(frames.flatMap((frame) => frame.blocks).every((block) => !/^(hook|content|title|body|cta)$/i.test(block.text.trim()))).toBe(true);
    expect(frames.at(-1)?.blocks.some((block) => block.pill)).toBe(true);
  });
});