// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, test } from "bun:test";
import { fieldsToStructured, parseCarouselCopy, serializeCarouselCopy, slideFieldOrder } from "./slideFields";
import { buildCarouselFrames, frameBackgroundCss, normalizeColor } from "./designFrames";

const style = { titleFont: "", bodyFont: "", coverBackground: "#B39EE7", slidesBackground: "#B39EE6", titleColor: "", subtitleColor: "", textColor: "" };

describe("labeled slide fields", () => {
  test("old 'Slide 2 · content' copy loads without the content tag", () => {
    const slides = parseCarouselCopy(
      { coverCopy: "Treat your homepage like a free trial", slidesCopy: "Slide 2 · content\nTemplates are built for everyone\nWhich means the layout never fit.", ctaCopy: "Share this with your team\nShare" },
      3,
    );
    expect(slides[0].title).toBe("Treat your homepage like a free trial");
    expect(slides[1]).toEqual({ title: "Templates are built for everyone", subtitle: "", body: "Which means the layout never fit." });
    expect(slides[2].title).toBe("Share this with your team");
    expect(slides[2].subtitle).toBe("Share");
    expect(JSON.stringify(slides)).not.toContain("content");
  });

  test("saved labeled copy round-trips into the same fields", () => {
    const original = [
      { title: "Cover", subtitle: "Guide", body: "" },
      { title: "One", subtitle: "Step", body: "Do it" },
      { title: "Close", subtitle: "Follow", body: "Follow for more" },
    ];
    expect(parseCarouselCopy(serializeCarouselCopy(original), 3)).toEqual(original);
  });

  test("covers never accept, persist, or render body copy", () => {
    const cover = { title: "A clear title", subtitle: "Guide", body: "Forbidden cover body" };
    expect(slideFieldOrder("cover")).toEqual(["title", "subtitle"]);
    const saved = serializeCarouselCopy([cover, { title: "Close", subtitle: "Save", body: "Keep this" }]);
    expect(saved.coverCopy).toBe("Cover title: A clear title\nCover label: Guide");
    expect(parseCarouselCopy({ coverCopy: "Cover title: A clear title\nCover body: Forbidden cover body" }, 2)[0].body).toBe("");
    expect(fieldsToStructured([cover, { title: "Close", subtitle: "Save", body: "Keep this" }])[0].body).toBeUndefined();
    const frame = buildCarouselFrames([{ position: 1, role: "hook", headline: cover.title, subtitle: cover.subtitle, body: cover.body }], style, "insightful")[0];
    expect(frame.blocks.map((block) => block.text)).toEqual(["Guide", "A clear title"]);
  });

  test("artwork never shows role tags", () => {
    const frames = buildCarouselFrames(fieldsToStructured(parseCarouselCopy({ coverCopy: "A", slidesCopy: "Slide 2 · content\nB", ctaCopy: "C\nShare" }, 3)), style);
    const text = frames.flatMap((f) => f.blocks.map((b) => b.text)).join(" ");
    expect(text.toLowerCase()).not.toContain("content");
  });

  test("same-line legacy role headings never become titles", () => {
    const slides = parseCarouselCopy({ slidesCopy: "Slide 1 · hook: A clean cover\n\nSlide 2 - content: A useful point\nBody: The explanation\n\nSlide 3: cta: A strong close\nCTA button: Save" }, 3);
    expect(slides.map((slide) => slide.title)).toEqual(["A clean cover", "A useful point", "A strong close"]);
    expect(JSON.stringify(slides).toLowerCase()).not.toContain("content:");
  });

  test("space-separated slide roles never enter fields or artwork", () => {
    const slides = parseCarouselCopy({
      slidesCopy: "Slide 1 Hook: Challenge the obvious\n\nSlide 2 Content: Show the better way\nBody: Make the lesson useful\n\nSlide 3 CTA: Keep this close\nCTA button: Save",
    }, 3);
    expect(slides.map((slide) => slide.title)).toEqual(["Challenge the obvious", "Show the better way", "Keep this close"]);
    expect(JSON.stringify(slides)).not.toMatch(/Slide \d|Hook:|Content:|CTA:/i);
    const frameText = buildCarouselFrames(fieldsToStructured(slides), style)
      .flatMap((frame) => frame.blocks.map((block) => block.text))
      .join(" ");
    expect(frameText).not.toMatch(/Slide \d|Hook:|Content:|CTA:/i);
  });
});

describe("brand background and layout", () => {
  test("brand hex colours are applied as the frame background", () => {
    const frames = buildCarouselFrames(fieldsToStructured([{ title: "A", subtitle: "", body: "" }, { title: "B", subtitle: "", body: "" }]), style);
    expect(frames[0].background).toBe("#B39EE7");
    expect(frames[1].background).toBe("#B39EE6");
  });
  test("saved cover gradients preserve both brand colours", () => {
    const frames = buildCarouselFrames(fieldsToStructured([{ title: "A", subtitle: "", body: "" }, { title: "B", subtitle: "", body: "" }]), { ...style, coverBackgroundEnd: "#4F6BFF" });
    expect(frames[0].background).toBe("#B39EE7");
    expect(frames[0].backgroundEnd).toBe("#4F6BFF");
    expect(frameBackgroundCss(frames[0])).toBe("linear-gradient(160deg, #B39EE7 0%, #4F6BFF 100%)");
  });
  test("short and bare hex values are accepted, garbage falls back", () => {
    expect(normalizeColor("fff", "#000000")).toBe("#FFFFFF");
    expect(normalizeColor("#12ab34", "#000000")).toBe("#12AB34");
    expect(normalizeColor("not a color!", "#000000")).toBe("#000000");
  });
  test("chosen alignment overrides every frame", () => {
    const frames = buildCarouselFrames(fieldsToStructured([{ title: "A", subtitle: "", body: "" }, { title: "B", subtitle: "", body: "" }]), { ...style, horizontalAlign: "right", slidesAlign: "bottom" });
    expect(frames.map((f) => f.align)).toEqual(["right", "right"]);
    expect(frames[1].verticalAlign).toBe("bottom");
  });
});

import { carouselSlidesFromPost as fromPost, serializeCarouselCopy as toPost } from "./slideFields";
describe("planner carousel copy round-trip", () => {
  test("keeps each slide's title, subtitle and body separate", () => {
    const saved = {
      coverCopy: "Cover title: Stop guessing\nCover label: A 3-step fix",
      slidesCopy: "Slide 2\nTitle: Step one\nSubtitle: Audit\nBody: Look at last month.",
      ctaCopy: "Closing statement: Start today\nInvitation: Comment PLAN\nCTA button: Get the plan",
    };
    const slides = fromPost(saved);
    expect(slides.length).toBe(3);
    expect(slides[1]).toEqual({ title: "Step one", subtitle: "Audit", body: "Look at last month." });
    expect(slides[2].subtitle).toBe("Get the plan");
    expect(toPost(slides)).toEqual(saved);
  });
});
