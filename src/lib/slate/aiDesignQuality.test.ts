// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, test } from "bun:test";
import { checkDesignQuality, withBrandBackground } from "./aiDesign";

const svg = (inner: string) => `<svg viewBox="0 0 1080 1350">${inner}</svg>`;
const sizes = '<text font-size="140">A</text><text font-size="64">B</text><text font-size="32">C</text>';

describe("premium AI design checks", () => {
  test("rejects a slide that never uses the brand accent", () => {
    const p = checkDesignQuality(svg(`${sizes}<rect x="90" y="90" width="80" height="80" fill="#ffffff"/>`), ["#4F6BFF"]);
    expect(p.some((x) => x.includes("accent"))).toBe(true);
  });
  test("rejects fewer than three text sizes", () => {
    const p = checkDesignQuality(svg('<text font-size="64" fill="#4F6BFF">A</text><text font-size="32">B</text><circle r="4"/>'), ["#4F6BFF"]);
    expect(p.some((x) => x.includes("three"))).toBe(true);
  });
  test("rejects text-and-lines-only slides", () => {
    const p = checkDesignQuality(svg(`${sizes}<line stroke="#4F6BFF"/>`), ["#4F6BFF"]);
    expect(p.some((x) => x.includes("graphic element"))).toBe(true);
  });
  test("accepts accent, three sizes and a shape", () => {
    expect(checkDesignQuality(svg(`${sizes}<rect x="90" y="90" width="80" height="20" fill="#4f6bff"/>`), ["#4F6BFF"])).toEqual([]);
  });
  test("draws the brand gradient under the design", () => {
    const out = withBrandBackground(svg("<text>x</text>"), { background: "#4F6BFF", backgroundEnd: "#1A1A1D" });
    expect(out).toContain('stop-color="#4F6BFF"');
    expect(out).toContain('stop-color="#1A1A1D"');
    expect(out.indexOf("<rect")).toBeLessThan(out.indexOf("<text"));
  });
});
