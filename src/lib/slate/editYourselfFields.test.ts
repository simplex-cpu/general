// @ts-nocheck -- Bun test runner
import { describe, expect, it } from "bun:test";
import { editScriptFields } from "./contentScriptFields";
import { editingStyleFor } from "./longFormTypes";
import { buildVideoEdit, videoEditFormat } from "./videoEditInput";

const parts = { script: "spoken", visualHook: "Hook", textOverlay: "Overlay", visualCta: "Follow", timestamps: "00:05:33-00:05:45", creativeDirection: "Tight cuts", coverCopy: "", slidesCopy: "", ctaCopy: "" };
const url = "https://drive.google.com/file/d/abc/view";

describe("Edit Yourself record fields per route", () => {
  it("long form styles get the exact editing-style tag", () => {
    expect(editingStyleFor("BROLL", true)).toBe("B-roll from long form");
    expect(editingStyleFor("Talking Video", true)).toBe("Talking video from long form");
    expect(editingStyleFor("BROLL", false)).toBe("BROLL");
  });
  it("B-roll writes text overlay, no hook/CTA/speech", () => {
    const f = editScriptFields("BROLL", parts);
    expect(f["Text Overlay"]).toBe("Overlay");
    expect(f["Visual Hook"]).toBe("");
    expect(f.CTA).toBe("");
    expect(f["Source speech"]).toBe("");
  });
  it("Talking video writes visual hook and CTA, no text overlay", () => {
    const f = editScriptFields("Talking Video", parts);
    expect(f["Visual Hook"]).toBe("Hook");
    expect(f.CTA).toBe("Follow");
    expect(f["Text Overlay"]).toBe("");
  });
  it("timestamps and creative direction are carried for long form clips", () => {
    const f = editScriptFields("Talking Video", parts);
    expect(f.Timestamps).toContain("00:05:33");
    expect(f["Creative Direction"]).toBe("Tight cuts");
  });
  it("long form talking snapshot carries the clip start and end", () => {
    const v = buildVideoEdit({ format: videoEditFormat("Talking video from long form"), clips: [{ url }], visualHook: "Hook", visualCta: "Follow", timestamps: parts.timestamps });
    expect(v.start_time).toBe("00:05:33");
    expect(v.end_time).toBe("00:05:45");
  });
});
