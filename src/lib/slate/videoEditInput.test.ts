// @ts-nocheck -- Bun test runner
import { describe, expect, it } from "bun:test";
import { buildVideoEdit, mergeEditingPreferences, videoEditFormat } from "./videoEditInput";

const url = "https://cdn.example.com/long.mp4";
describe("video_edit contract", () => {
  it("maps old long form labels", () => {
    expect(videoEditFormat("Talking from long form")).toBe("Talking video from long form");
    expect(videoEditFormat("BROLL from long form")).toBe("B-roll from long form");
    expect(videoEditFormat("Long Form Clip")).toBe("Talking video from long form");
  });
  it("B-roll from long form keeps ranges as alternatives, default 10s", () => {
    const v = buildVideoEdit({ format: "B-roll from long form", clips: [{ url }], visualHook: "Hi", timestamps: "00:02:14-00:02:28\n00:06:03-00:06:14" });
    expect(v.timestamp_ranges).toEqual([{ start_time: "00:02:14", end_time: "00:02:28" }, { start_time: "00:06:03", end_time: "00:06:14" }]);
    expect(v.output_duration_seconds).toBe(10);
    expect(v.version).toBe(1);
    expect(v.music_url).toBeUndefined();
  });
  it("rejects ranges shorter than 3 seconds", () => {
    expect(() => buildVideoEdit({ format: "B-roll from long form", clips: [{ url }], visualHook: "Hi", timestamps: "00:01:00-00:01:02" })).toThrow();
  });
  it("rejects more than 12 ranges", () => {
    const t = Array.from({ length: 13 }, (_, i) => `00:0${Math.floor(i / 6)}:${String((i % 6) * 10).padStart(2, "0")}-00:0${Math.floor(i / 6)}:${String((i % 6) * 10 + 5).padStart(2, "0")}`).join("\n");
    expect(() => buildVideoEdit({ format: "B-roll from long form", clips: [{ url }], visualHook: "Hi", timestamps: t })).toThrow();
  });
  it("final B-roll duration must be 5-15s", () => {
    expect(() => buildVideoEdit({ format: "B-roll from long form", clips: [{ url }], visualHook: "Hi", timestamps: "00:00:10-00:00:20", outputDurationSeconds: 16 })).toThrow();
  });
  it("talking from long form uses one start/end, max 10 minutes, hook+CTA required", () => {
    const v = buildVideoEdit({ format: "Talking video from long form", clips: [{ url }], visualHook: "H", visualCta: "C", timestamps: "00:02:14.5-00:03:02" });
    expect(v.start_time).toBe("00:02:14.5");
    expect(v.timestamp_ranges).toBeUndefined();
    expect(() => buildVideoEdit({ format: "Talking video from long form", clips: [{ url }], visualHook: "H", visualCta: "C", timestamps: "00:00:00-00:10:01" })).toThrow();
    expect(() => buildVideoEdit({ format: "Talking video from long form", clips: [{ url }], visualHook: "H", timestamps: "00:00:00-00:01:00" })).toThrow();
  });
  it("text over 240 characters is rejected", () => {
    expect(() => buildVideoEdit({ format: "BROLL", clips: [{ url }], visualHook: "x".repeat(241) })).toThrow();
  });
  it("ordinary BROLL accepts up to 3 clips", () => {
    expect(() => buildVideoEdit({ format: "BROLL", clips: [1, 2, 3, 4].map(() => ({ url })), visualHook: "Hi" })).toThrow();
  });
  it("keeps other preferences and wraps non-JSON text", () => {
    expect(JSON.parse(mergeEditingPreferences('{"hook":{"a":1},"video_edit":{"old":true}}', { version: 1 }))).toEqual({ hook: { a: 1 }, video_edit: { version: 1 } });
    expect(JSON.parse(mergeEditingPreferences("make it punchy", { version: 1 }))).toEqual({ legacy_text: "make it punchy", video_edit: { version: 1 } });
  });
});
