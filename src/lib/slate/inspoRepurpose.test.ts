// @ts-nocheck -- Bun test runner.
import { test, expect } from "bun:test";
import { parseRepurposeScript, repurposeTranscript, REPURPOSE_TITLE } from "./inspoRepurpose";
test("Conversation is named Repurpose", () => expect(REPURPOSE_TITLE).toBe("Repurpose"));
test("Talking video retains opening exactly once", () => {
  const d = parseRepurposeScript(
    JSON.stringify({ spokenHook: "Stop scrolling.", script: "Stop scrolling. This is the body." }),
    "talkingVideo",
    "Topic",
  );
  expect(d.script.match(/Stop scrolling/g).length).toBe(1);
});
test("B-roll is a single overlay with no separate CTA", () => {
  const d = parseRepurposeScript('{"script":"Your ideas deserve attention."}', "broll", "Topic");
  expect(d.onScreenCta).toBe("");
  expect(d.format).toBe("broll");
});
test("Graphic contains editable title and supporting copy", () => {
  const d = parseRepurposeScript(
    '{"slides":[{"headline":"Make it clear","body":"Choose one message."}]}',
    "graphic",
    "Topic",
  );
  expect(d.slides.length).toBe(1);
  expect(d.slides[0].body).toBe("Choose one message.");
});
test("Carousel uses shared ten-slide insightful contract", () => {
  const d = parseRepurposeScript(
    JSON.stringify({
      slides: [
        { role: "hook", headline: "Start here" },
        ...Array.from({ length: 8 }, (_, i) => ({
          role: "content",
          headline: `Idea ${i}`,
          body: "One useful explanation.",
        })),
        { role: "cta", headline: "Keep going", body: "Try this today.", actionLabel: "Save" },
      ],
    }),
    "carousel",
    "Topic",
  );
  expect(d.slides.length).toBe(10);
  expect(d.slides[9].role).toBe("cta");
});
test("Repurpose saves a structured approvable card and brand context", () => {
  const d = parseRepurposeScript('{"script":"A complete overlay."}', "broll", "Topic");
  const t = repurposeTranscript(d, "Source", {
    brandId: "brand",
    brandName: "Name",
    brief: { text: "Brand brief", name: "Name", loading: false },
  });
  expect(t[1].kind).toBe("script");
  expect(t[1].variantGroup).toBe(0);
  expect(t[0].repurposeContext.brandId).toBe("brand");
});
