// @ts-nocheck -- Bun supplies its test runner.
import { describe, it, expect } from "bun:test";
import { readSimpleStyle, simpleStyleToFields, graphicFrameStyle } from "./brandVisualStyle";
import { buildCarouselFrames } from "./designFrames";
import { topFormats, normalizeFormat } from "./postMetrics";
const base = { titleFont: "Inter", subtitleFont: "Inter", bodyFont: "Inter", footageInk: "#FFFFFF", lightInk: "#111111", accents: ["#FF0000", "#00FF00"] };
describe("simple visual style", () => {
  it("defaults footage ink to white and light ink to black", () => {
    const s = readSimpleStyle({});
    expect(s.footageInk).toBe("#FFFFFF"); expect(s.lightInk).toBe("#000000");
  });
  it("always writes no hook backing and transcription = footage ink", () => {
    const f = simpleStyleToFields({}, { ...base, footageInk: "#EEEEEE", backgroundStyle: "dark" });
    expect(f["Font background Color (Primary)"]).toBe("transparent");
    expect(f["Font background Color (Secondary)"]).toBe("transparent");
    expect(f["Font color (Secondary)"]).toBe("#EEEEEE");
    expect(f["Font color (Primary)"]).toBe("#EEEEEE");
  });
  it("dark: charcoal cover, white middle slides with light ink", () => {
    const f = simpleStyleToFields({}, { ...base, backgroundStyle: "dark" });
    expect(f["Carousel Cover Background"]).toBe("#1A1A1D"); expect(f["Carousel Cover Background 2"]).toBe("");
    expect(f["Carousel Slides Background"]).toBe("#FFFFFF"); expect(f["Carousel Slides Text Color"]).toBe("#111111");
  });
  it("gradient cover goes accent 1 to accent 2", () => {
    const f = simpleStyleToFields({}, { ...base, backgroundStyle: "gradient" });
    expect(f["Carousel Cover Background"]).toBe("#FF0000"); expect(f["Carousel Cover Background 2"]).toBe("#00FF00");
  });
  it("closing slide reuses the cover background and everything is centered", () => {
    const f = simpleStyleToFields({}, { ...base, backgroundStyle: "gradient" });
    const frames = buildCarouselFrames([{ role: "hook", copy: "Hook" }, { role: "body", copy: "Middle\nbody" }, { role: "cta", copy: "Follow\nfor more" }], graphicFrameStyle(f), "insightful");
    expect(frames[0].background).toBe("#FF0000");
    expect(frames[1].background).toBe("#FFFFFF");
    expect(frames[2].background).toBe("#FF0000");
    expect(frames.every((fr) => fr.align === "center")).toBe(true);
  });
  it("keeps at most 3 accents and round-trips", () => {
    const f = simpleStyleToFields({}, { ...base, accents: ["#1", "#2", "#3", "#4"], backgroundStyle: "dark" });
    expect(readSimpleStyle(f).accents.length).toBe(3); expect(readSimpleStyle(f).backgroundStyle).toBe("dark");
  });
});
describe("top performing format", () => {
  it("normalizes post types", () => {
    expect(normalizeFormat("B-Roll")).toBe("Broll"); expect(normalizeFormat("Talking video")).toBe("Talking Video"); expect(normalizeFormat("Weird")).toBe("");
  });
  it("ranks by average views, ignores unknown and unmeasured", () => {
    const r = topFormats([{ postType: "Carousel", views: 100 }, { postType: "Broll", views: 300 }, { postType: "Broll", views: 100 }, { postType: "X", views: 9999 }, { postType: "Graphic", views: null }]);
    expect(r[0]).toEqual({ format: "Broll", averageViews: 200, count: 2 }); expect(r.length).toBe(2);
  });
  it("empty when nothing measured", () => { expect(topFormats([])).toEqual([]); });
});

import { describe as d2, it as i2, expect as e2 } from "bun:test";
import { readSimpleStyle as rs, simpleStyleToFields as sf } from "./brandVisualStyle";
import { completionTone, averageStats } from "../brands";
d2("brand colors", () => {
  i2("saves chosen light and dark backgrounds", () => {
    const s = { ...rs({}), lightBg: "#F5F0E8", darkBg: "#101820", gradient: { on: false, start: "#4F6BFF", end: "#222222", angle: 160 } };
    const f = sf({}, s);
    e2(f["Carousel Slides Background"]).toBe("#F5F0E8");
    e2(f["Carousel Cover Background"]).toBe("#101820");
    e2(rs(f).darkBg).toBe("#101820");
  });
  i2("uses gradient colors when gradient is on", () => {
    const f = sf({}, { ...rs({}), gradient: { on: true, start: "#FF0000", end: "#0000FF", angle: 90 }, cover: "gradient" });
    e2(f["Carousel Cover Background"]).toBe("#FF0000");
    e2(f["Carousel Cover Background 2"]).toBe("#0000FF");
    e2(rs(f).gradient).toEqual({ on: true, start: "#FF0000", end: "#0000FF", angle: 90 });
  });
});
d2("brand card", () => {
  i2("traffic light thresholds", () => { e2(completionTone(39)).toBe("low"); e2(completionTone(40)).toBe("mid"); e2(completionTone(79)).toBe("mid"); e2(completionTone(80)).toBe("high"); });
  i2("averages stats", () => { e2(averageStats([{ views: 100, likes: 10, comments: 1 }, { views: 300, likes: 30, comments: 3 }])).toEqual({ views: 200, likes: 20, comments: 2, posts: 2 }); });
});
import { performanceStatus as ps } from "../brands";
d2("performance status", () => {
  i2("on track when recent views hold up", () => { e2(ps([{ views: 100, date: "2026-01" }, { views: 100, date: "2026-02" }])).toBe("on-track"); });
  i2("pay attention when the latest 5 drop below 80%", () => { const old = Array.from({ length: 5 }, (_, i) => ({ views: 1000, date: `2025-0${i + 1}` })); const recent = Array.from({ length: 5 }, (_, i) => ({ views: 100, date: `2026-0${i + 1}` })); e2(ps([...old, ...recent])).toBe("attention"); });
  i2("empty without stats", () => { e2(ps([])).toBe(""); });
});
d2("background rails", () => {
  i2("cover, slides and closing use their own surfaces", () => {
    const f = sf({}, { ...rs({}), darkBg: "#111111", lightBg: "#EEEEEE", brandBg: "#FF6600", cover: "brand", slides: "dark", closing: "light" });
    e2(f["Carousel Cover Background"]).toBe("#FF6600");
    e2(f["Carousel Slides Background"]).toBe("#111111");
    const r = rs(f); e2([r.cover, r.slides, r.closing]).toEqual(["brand", "dark", "light"]);
  });
});
