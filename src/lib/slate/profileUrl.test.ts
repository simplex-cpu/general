// @ts-ignore Bun supplies its test runner at runtime.
import { describe, expect, test } from "bun:test";
import { profileUrl } from "./profileUrl";
import { hookFromVideoText, looksLikeSceneDescription } from "./postCopy";
import { repurposeCaptions } from "./postRepurpose";
test("instagram profile link", () => expect(profileUrl("Instagram", "@drninahelps")).toBe("https://www.instagram.com/drninahelps/"));
test("tiktok profile link", () => expect(profileUrl("TikTok", "kash")).toBe("https://www.tiktok.com/@kash"));
test("scene descriptions are not visual hooks", () => expect(looksLikeSceneDescription("A woman is talking to the camera in her kitchen")).toBe(true));
test("on-screen text is a visual hook", () => expect(looksLikeSceneDescription("3 signs your gut is inflamed")).toBe(false));
test("visual hook is the full on-screen text, not the Visuals description", () =>
  expect(hookFromVideoText("3 signs your gut is inflamed\nSign 1\nVisuals: a woman talks to camera").visualHook).toBe("3 signs your gut is inflamed\nSign 1"));
test("repurpose uses the rewritten caption", () => expect(repurposeCaptions("New caption #gut", { caption: "Old" } as any)?.instagram).toBe("New caption #gut"));

describe("full opening hook", () => {
  test("keeps the whole Hook line", () => expect(hookFromVideoText("Hook: 3 signs your gut is inflamed and what to do\nSign 1\nVisuals: talks").visualHook).toBe("3 signs your gut is inflamed and what to do"));
});
