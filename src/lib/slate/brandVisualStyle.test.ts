// @ts-nocheck -- Bun supplies its test runner.
import { describe, it, expect } from "bun:test";
import { GRAPHIC_STYLE_FIELD, graphicFrameStyle, graphicPreferences } from "./brandVisualStyle";
import { buildCarouselFrames, buildGraphicFrame, frameBackgroundCss } from "./designFrames";
import { graphicRequestStyleFields, safeRequestStyleFields } from "./productionRequest";

const legacy = { "Captions style primary": "Anton, weight 400", "Captions style secondary": "Inter, weight 900", "Carousel Cover Background": "#112233", "Carousel Cover Background 2": "#445566", "Carousel Slides Background": "#FFFFFF" };
describe("brand graphic preferences", () => {
  it("preserves legacy cover gradients and font defaults", () => {
    const style = graphicFrameStyle(legacy);
    expect(style.coverBackgroundEnd).toBe("#445566");
    expect(style.titleFont).toBe("Anton, weight 400");
    expect(style.subtitleFont).toBe("Inter, weight 900");
  });
  it("keeps title, subtitle and body fonts independent of video fonts", () => {
    const fields = { ...legacy, [GRAPHIC_STYLE_FIELD]: JSON.stringify({ titleFont: "Montserrat, weight 800", subtitleFont: "Poppins, weight 700", bodyFont: "Space Grotesk, weight 700" }) };
    const style = graphicFrameStyle(fields);
    expect([style.titleFont, style.subtitleFont, style.bodyFont]).toEqual(["Montserrat, weight 800", "Poppins, weight 700", "Space Grotesk, weight 700"]);
    expect(fields["Captions style primary"]).toBe("Anton, weight 400");
  });
  it("applies separate left/right and vertical positions to cover and slides", () => {
    const style = graphicFrameStyle({ ...legacy, "Carousel Cover Text Align": "top", "Carousel Slides Text Align": "bottom", [GRAPHIC_STYLE_FIELD]: JSON.stringify({ coverHorizontal: "right", slidesHorizontal: "left" }) });
    const frames = buildCarouselFrames([{ copy: "Cover" }, { copy: "Slide" }], style);
    expect([frames[0].align, frames[0].verticalAlign, frames[1].align, frames[1].verticalAlign]).toEqual(["right", "top", "left", "bottom"]);
  });
  it("supports slide gradients and their chosen direction", () => {
    const style = graphicFrameStyle({ ...legacy, [GRAPHIC_STYLE_FIELD]: JSON.stringify({ slidesMode: "gradient", slidesEnd: "#ABCDEF", slidesDirection: "90" }) });
    const frame = buildCarouselFrames([{ copy: "Cover" }, { copy: "Slide" }], style)[1];
    expect(frameBackgroundCss(frame)).toBe("linear-gradient(90deg, #FFFFFF 0%, #ABCDEF 100%)");
  });
  it("solid mode does not apply the retained gradient color", () => {
    const fields = { ...legacy, [GRAPHIC_STYLE_FIELD]: JSON.stringify({ coverMode: "solid" }) };
    expect(graphicFrameStyle(fields).coverBackgroundEnd).toBe("");
    expect(fields["Carousel Cover Background 2"]).toBe("#445566");
  });
  it("still graphics have their own background and positioning", () => {
    const fields = { ...legacy, [GRAPHIC_STYLE_FIELD]: JSON.stringify({ stillBackground: "#123456", stillMode: "gradient", stillEnd: "#FEDCBA", stillDirection: "180", stillHorizontal: "right", stillVertical: "bottom" }) };
    const still = graphicFrameStyle(fields, true);
    expect([still.coverBackground, still.coverBackgroundEnd, still.coverGradientAngle, still.coverHorizontalAlign, still.coverAlign]).toEqual(["#123456", "#FEDCBA", 180, "right", "bottom"]);
    expect(graphicFrameStyle(fields).coverBackground).toBe("#112233");
  });
  it("ignores invalid saved preference shapes", () => {
    expect(graphicPreferences({ [GRAPHIC_STYLE_FIELD]: "[]" })).toEqual({});
    expect(graphicPreferences({ [GRAPHIC_STYLE_FIELD]: "bad json" })).toEqual({});
  });
  it("keeps graphic styles in the accepted production snapshot", () => {
    const style = graphicFrameStyle(legacy);
    const fields = graphicRequestStyleFields(style);
    const saved = safeRequestStyleFields(fields, "Carousel");
    expect(JSON.parse(saved["Style snapshot"]).graphic).toEqual(JSON.parse(JSON.stringify(style)));
  });
  it("uses the selected subtitle font on still graphics", () => {
    const style = graphicFrameStyle({ ...legacy, [GRAPHIC_STYLE_FIELD]: JSON.stringify({ subtitleFont: "Poppins, weight 700", bodyFont: "Inter, weight 900" }) }, true);
    const frame = buildGraphicFrame("A title\nA subtitle\nBody copy", style, undefined, "insightful");
    expect(frame.blocks.map(b => b.role)).toEqual(["title", "subtitle", "body"]);
    expect(frame.blocks[1].font).toBe("Poppins, weight 700");
    expect(frame.blocks[2].font).toBe("Inter, weight 900");
  });
});