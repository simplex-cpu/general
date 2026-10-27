// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, test } from "bun:test";
import { boardScript, canAddToBoard, formatPostCopy, needsLongTranscription, shortFormCounts, pendingClipCounts, clipExitBlocked } from "./longFormClipper";

describe("Long form Clipper rules", () => {
  test("active processing blocks exits until completion or error", () => {
    expect(clipExitBlocked(true, "")).toBe(true);
    expect(clipExitBlocked(false, "")).toBe(false);
    expect(clipExitBlocked(true, "Transcription failed")).toBe(false);
  });
  test("resuming counts saved pieces instead of regenerating them", () => {
    expect(pendingClipCounts({ BROLL: 2, "Talking Video": 1, Graphic: 0, Carousel: 0 }, [{ format: "BROLL" }])).toEqual({ BROLL: 1, "Talking Video": 1, Graphic: 0, Carousel: 0 });
  });
  test("at least one short form must be requested", () => {
    expect(shortFormCounts.safeParse({ BROLL: 0, "Talking Video": 0, Graphic: 0, Carousel: 0 }).success).toBe(false);
    expect(shortFormCounts.safeParse({ BROLL: 1, "Talking Video": 0, Graphic: 0, Carousel: 0 }).success).toBe(true);
  });
  test("BROLL post copy is the text overlay", () => {
    expect(formatPostCopy("BROLL", { name: "", timestamps: "", textOverlay: "Hi" })).toBe("Text overlay:\nHi");
  });
  test("Talking Video post copy has visual hook then script", () => {
    const c = formatPostCopy("Talking Video", { name: "", timestamps: "", visualHook: "H", script: "S" });
    expect(c).toBe("Visual hook:\nH\n\nScript:\nS");
    expect(boardScript("Talking Video", c)).toMatchObject({ visualHook: "H", script: "S" });
  });
  test("carousel copy keeps cover and at most 6 slide titles", () => {
    const c = formatPostCopy("Carousel", { name: "", timestamps: "", coverTitle: "T", coverSubtitle: "S", slides: ["1", "2", "3", "4", "5", "6", "7"] });
    expect(c.split("\n").length).toBe(8);
    expect(boardScript("Carousel", c).slides.length).toBe(7);
  });
  test("graphic copy has only cover title and subtitle", () => {
    expect(formatPostCopy("Graphic", { name: "", timestamps: "", coverTitle: "T", coverSubtitle: "S", slides: ["x"] })).toBe("Cover title: T\nCover subtitle: S");
  });
  test("a piece goes to the board only once", () => {
    expect(canAddToBoard({ status: "New", contentIds: [] })).toBe(true);
    expect(canAddToBoard({ status: "In production", contentIds: [] })).toBe(false);
    expect(canAddToBoard({ status: "New", contentIds: ["recX"] })).toBe(false);
  });
});

describe("long-video transcription routing", () => {
  test("files over 24 MB go to the long transcriber", () => {
    expect(needsLongTranscription("https://cdn.example.com/a.mp4", 25 * 1024 * 1024)).toBe(true);
    expect(needsLongTranscription("https://cdn.example.com/a.mp4", 10 * 1024 * 1024)).toBe(false);
  });
  test("Drive, Dropbox and YouTube links always go to the long transcriber", () => {
    expect(needsLongTranscription("https://drive.google.com/file/d/abc/view")).toBe(true);
    expect(needsLongTranscription("https://www.dropbox.com/s/abc/a.mp4")).toBe(true);
    expect(needsLongTranscription("https://www.youtube.com/watch?v=abc")).toBe(true);
    expect(needsLongTranscription("https://youtu.be/abc")).toBe(true);
  });
  test("small direct files stay on the direct path", () => {
    expect(needsLongTranscription("https://cdn.example.com/a.mp4")).toBe(false);
    expect(needsLongTranscription("not a url")).toBe(false);
  });
});

import { creativeDirection as _cd, readableCreativeInstructions as _rci } from "./longFormClipper";
const _notes = JSON.stringify({ template: "podcast", segments: [
  { id: 55, start: "00:05:39.410", end: "00:05:44.230", speaker: "Speaker 1", text: "Sometimes you want to do a crumb coat." },
  { id: 58, start: "00:05:54.070", end: "00:06:00.200", speaker: "Speaker 1", text: "Smooth the side." }] });
test("creative direction is plain language with range, length and speaker", () => {
  const out = _cd(_notes, { "Speaker 1": "Ana" });
  expect(out.split("\n")[0]).toBe("Clip: 05:39 – 06:00 (21 sec) · Speaker: Ana");
  expect(out).not.toContain("{");
});
test("old raw provenance instructions become readable and drop empty speaker JSON", () => {
  const out = _rci(`Podcast source provenance (not on-screen copy):\n${_notes}\nUse the exact source range. Do not append recorded speech or invent a spoken CTA.\nConfirmed speaker names:\n{}`);
  expect(out.startsWith("Clip: 05:39 – 06:00")).toBe(true);
  expect(out).not.toContain("Confirmed speaker");
});

import { normalizeTimestamps, splitLegacySourceNotes, formatPostCopy as fpc } from "./longFormClipper";
describe("clip timestamps", () => {
  test("one padded range per line", () => {
    expect(normalizeTimestamps("5:33–5:35\n1:07:10 - 1:07:42")).toBe("00:05:33-00:05:35\n01:07:10-01:07:42");
  });
  test("legacy source notes move out of the script", () => {
    const r = splitLegacySourceNotes("Visual hook:\nHi\n\nScript:\nHello\n\nSource notes:\nAI studio draft, needs review (job 1)\nVisual plan: close-up\nSegments (keep this order):\n1. [00:05:33 – 00:05:35] Ana: Hello");
    expect(r?.copy).toBe("Visual hook:\nHi\n\nScript:\nHello");
    expect(r?.timestamps).toBe("00:05:33-00:05:35");
    expect(r?.direction).toBe("Visual plan: close-up");
  });
  test("script copy has no source notes for plain pieces", () => {
    expect(fpc("Talking Video", { name: "a", timestamps: "00:01:00-00:01:05", visualHook: "h", script: "s", creativeDirection: "d" })).not.toContain("Source notes");
  });
});
