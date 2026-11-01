// @ts-ignore Bun supplies its test runner.
import { expect, test } from "bun:test";
import { scrapedMedia } from "./statsRefresh";
import { hashtagsFromCaption, plannerPostCopy, readPostCopy, mergePostCopy, postCopyFields } from "./postCopy";
import { parsePublishedSlides, serializePublishedSlides } from "./slideFields";
import { preserveOriginalBody } from "./postRepurpose";

test("carousel mining includes every child image in order", () => {
  const media = scrapedMedia("Instagram", { shortCode: "AAA", type: "Sidecar", childPosts: [{ displayUrl: "https://example.com/1" }, { displayUrl: "https://example.com/2" }, { displayUrl: "https://example.com/3" }] });
  expect(media?.imageUrls).toEqual(["https://example.com/1", "https://example.com/2", "https://example.com/3"]);
});
test("published slide one retains cover body and every slide through N", () => {
  const slides = [{ title: "Cover", subtitle: "Label", body: "Cover copy" }, { title: "Value", subtitle: "", body: "Full body" }, { title: "Finish", subtitle: "", body: "Final copy" }];
  const text = serializePublishedSlides(slides);
  expect(text).toContain("Slide 3");
  expect(parsePublishedSlides(text)).toEqual(slides);
});
test("planner carousel includes cover, middle and CTA and stores cover independently", () => {
  const copy = plannerPostCopy({ "Cover Copy": "Cover title: Why it works", "Slides Copy": "Slide 2\nTitle: Evidence\nBody: Original argument", "CTA Copy": "Closing statement: Next step\nInvitation: Read more", "IG Captions": "Caption #Original" }, "Instagram", "Carousel");
  expect(copy.coverTitle).toBe("Why it works");
  expect(copy.slideCopy).toContain("Slide 3");
  expect(copy.hashtags).toBe("#Original");
});
test("B-roll planner copy stores overlay separately from caption", () => {
  const copy = plannerPostCopy({ "Script Text": "Full overlay", "IG Captions": "Payoff #Topic" }, "Instagram", "BROLL Video");
  expect(copy.textOnScreen).toBe("Full overlay"); expect(copy.caption).toBe("Payoff #Topic");
});
test("saved copy is never erased or silently truncated", () => {
  const text = "X".repeat(30000);
  const copy = mergePostCopy(readPostCopy({ Transcript: text }), { transcript: "replacement", caption: "Real caption" });
  expect(postCopyFields(copy).Transcript).toBe(text);
});
test("same-format talking repurpose preserves complete transcript; caption is rewritten separately", () => {
  const original = readPostCopy({ Transcript: "Original opening. Original payoff.", Caption: "Original caption #Topic" });
  const result = preserveOriginalBody({ format: "talkingVideo", kind: "video", visualHook: "New shot", script: "Rewritten", onScreenCta: "" }, "visual", original);
  expect(result.kind === "video" && result.script).toBe("Original opening. Original payoff.");
});
test("same-format B-roll changes visuals not overlay", () => {
  const original = readPostCopy({ "Text on Screen": "Original overlay" });
  const result = preserveOriginalBody({ format: "broll", kind: "video", visualHook: "New shot", script: "Wrong rewrite", onScreenCta: "" }, "visual", original);
  expect(result.kind === "video" && result.script).toBe("Original overlay");
});
test("same-format carousel restores slide count and later bodies", () => {
  const original = readPostCopy({ "Slide Copy": "Slide 1\nTitle: Old cover\nBody: Cover body\n\nSlide 2\nTitle: Original value\nBody: Exact full value\n\nSlide 3\nTitle: Original close\nBody: Exact closing" });
  const result = preserveOriginalBody({ format: "carousel", kind: "carousel", slides: [{ position: 1, role: "hook", headline: "New cover" }] }, "cover", original);
  expect(result.kind === "carousel" && result.slides.length).toBe(3);
  expect(result.kind === "carousel" && result.slides[1].body).toBe("Exact full value");
  expect(result.kind === "carousel" && result.slides[0].headline).toBe("New cover");
});
test("all caption hashtags persist without inventing any", () => expect(hashtagsFromCaption("Full caption #Topic #Original #Topic")).toBe("#Topic #Original"));
test("talking planner script separates transcript and visual hook", () => {
  const copy = plannerPostCopy({ "Script Text": "── VISUAL HOOK ──\nOpen the notebook\n── SCRIPT ──\nOriginal speech.", "IG Captions": "Caption #Topic" }, "Instagram", "Talking Video");
  expect(copy.transcript).toBe("Original speech.");
  expect(copy.visualHook).toBe("Open the notebook");
});
test("same-format graphic preserves full body while changing its title", () => {
  const result = preserveOriginalBody({ format: "graphic", kind: "carousel", slides: [{ position: 1, role: "hook", headline: "New title" }] }, "cover", readPostCopy({ "Cover Title": "Old title", "Text on Screen": "Full original body" }));
  expect(result.kind === "carousel" && result.slides[0].body).toBe("Full original body");
});