// @ts-nocheck -- Bun supplies its test runner.
import { describe, expect, it } from "bun:test";
import { baseStyle, editingStyleFor, isLongFormType, LONG_FORM_POST_TYPES } from "./longFormTypes";
import { dropInventedText } from "./aiDesign";
import { plannerMenuActions } from "./plannerPresentation";

describe("long form types", () => {
  it("talking clips use Talking from long form", () => expect(editingStyleFor("Talking Video", true)).toBe("Talking video from long form"));
  it("B-roll clips use BROLL from long form", () => expect(editingStyleFor("BROLL", true)).toBe("B-roll from long form"));
  it("non long-form keeps its style", () => expect(editingStyleFor("BROLL", false)).toBe("BROLL"));
  it("maps from-long-form post types to base format", () => {
    expect(baseStyle("📹 Talking from long form")).toBe("Talking Video");
    expect(baseStyle("📹 BROLL from long form")).toBe("BROLL");
    expect(baseStyle("🖼️ Carousel from long form")).toBe("Carousel");
    expect(isLongFormType(LONG_FORM_POST_TYPES.Graphic)).toBe(true);
    expect(isLongFormType("📹 Talking Video")).toBe(false);
  });
});

describe("closing slide", () => {
  it("drops invented large text but keeps copy", () => {
    const svg = '<svg><text font-size="60">Follow for more tips</text><text font-size="40">Save this now please</text></svg>';
    const out = dropInventedText(svg, "Follow for more tips");
    expect(out).toContain("Follow for more tips");
    expect(out).not.toContain("Save this");
  });
});

it("Post action is Coming soon", () => {
  expect(plannerMenuActions("🖼️ Carousel", []).find((a) => a.id === "post")?.reason).toBe("Coming soon");
});

import { showsClipFields as clipFields } from "./longFormTypes";
describe("clip fields visibility", () => {
  it("shows only for talking videos from a long form", () => {
    expect(clipFields("📹 Talking from long form", false)).toBe(true);
    expect(clipFields("📹 Talking Video", true)).toBe(true);
    expect(clipFields("📹 BROLL from long form", true)).toBe(false);
    expect(clipFields("🖼️ Carousel from long form", true)).toBe(false);
    expect(clipFields("📹 Talking Video", false)).toBe(false);
  });
});
