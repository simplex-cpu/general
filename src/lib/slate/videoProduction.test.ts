// @ts-nocheck -- Bun provides this module to its test runner.
import { test, expect } from "bun:test";
import {
  videoFootageReady,
  videoRequestText,
  createProductionSubmission,
  overlaySegments,
  videoBrandStyle,
  playableVideoUrl,
} from "./videoProduction";

test("video requires uploaded footage or a usable link, not produced images", () => {
  expect(videoFootageReady(0, "", "", false)).toBe(false);
  expect(videoFootageReady(0, "https://drive.google.com/folder", "empty", false)).toBe(false);
  expect(videoFootageReady(0, "https://drive.google.com/folder", "ok", true)).toBe(false);
  expect(videoFootageReady(0, "https://drive.google.com/folder", "unknown", false)).toBe(false);
  expect(videoFootageReady(0, "https://drive.google.com/folder", "ok", false)).toBe(true);
  expect(videoFootageReady(1, "", "", false)).toBe(true);
});
test("Talking Video sends only the short visual hook to Visual Hook", () => {
  expect(videoRequestText("Talking Video", "Full spoken script", "Short hook")).toEqual({
    textOverlay: "",
    visualHook: "Short hook",
  });
});
test("BROLL sends the complete overlay to the existing Text Overlay field", () => {
  expect(videoRequestText("BROLL", "Full overlay copy", "Hook")).toEqual({
    textOverlay: "Full overlay copy",
    visualHook: "",
  });
});
test("failed synchronization retries without creating a second DIY record", async () => {
  const gate = createProductionSubmission();
  let creates = 0;
  let syncs = 0;
  const create = async () => {
    creates++;
  };
  await expect(
    gate.run(create, async () => {
      syncs++;
      throw new Error("sync");
    }),
  ).rejects.toThrow("sync");
  await gate.run(create, async () => {
    syncs++;
  });
  expect(creates).toBe(1);
  expect(syncs).toBe(2);
});
test("simultaneous submission is locked before creating a record", async () => {
  const gate = createProductionSubmission();
  let release;
  let creates = 0;
  const pending = new Promise<void>((r) => {
    release = r;
  });
  const first = gate.run(
    async () => {
      creates++;
      await pending;
    },
    async () => {},
  );
  expect(
    await gate.run(
      async () => {
        creates++;
      },
      async () => {},
    ),
  ).toBe(false);
  release();
  await first;
  expect(creates).toBe(1);
});
test("brand backing and fonts are taken from the saved choices", () => {
  const style = videoBrandStyle({
    "Captions style primary": "Arial, weight 700",
    "Font background Color (Primary)": "#123456",
  });
  expect(style.hookFont).toBe("Arial, weight 700");
  expect(style.hookBacking).toBe("#123456");
});
test("text overlay stays in one complete box, including line breaks", () => {
  const text = "one two three four five six seven eight nine ten";
  expect(overlaySegments(text)).toEqual([text]);
  expect(overlaySegments("First line\nSecond line")).toEqual(["First line\nSecond line"]);
});
test("Drive folders are not treated as playable video", () => {
  expect(playableVideoUrl("https://drive.google.com/drive/folders/example")).toBeUndefined();
  expect(playableVideoUrl("https://example.com/clip.mp4")).toBe("https://example.com/clip.mp4");
});

import { videoScriptParts as vsp } from "./videoProduction";
test("creative instructions never reach the text overlay", () => {
  const r = vsp("Hook:\nStop scrolling\n\nThe body line.\n\nCreative Instructions:\nFilm at golden hour");
  expect(r.hook).toBe("Stop scrolling");
  expect(r.body).toBe("The body line.");
});

import { splitColor, joinColor, videoBrandFields } from "./videoProduction";
test("backing keeps its transparency", () => {
  expect(joinColor("#112233", 50)).toBe("#11223380");
  expect(splitColor("#11223380")).toEqual({ hex: "#112233", opacity: 50 });
  expect(joinColor("#112233", 100)).toBe("#112233");
  expect(splitColor("transparent").opacity).toBe(0);
});
test("BROLL style edits only the text overlay fields", () => {
  const f = videoBrandFields({ hookFont: "A", captionFont: "B", hookColor: "#1", captionColor: "#2", hookBacking: "#3", captionBacking: "#4" }, false);
  expect(f["Font background Color (Secondary)"]).toBe("#4");
  expect(f["Font background Color (Primary)"]).toBeUndefined();
});
