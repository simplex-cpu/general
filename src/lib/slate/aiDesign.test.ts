// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, test } from "bun:test";
import { boxesInsideSafeArea, validateDesignSvg } from "./aiDesign";

const ok = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="#1A1A1D"/><text fill="#FFFFFF">Hi</text></svg>';
describe("AI slide design checks", () => {
  test("accepts an on-palette 1080x1350 design", () => {
    expect(validateDesignSvg(ok, ["#1a1a1d", "#ffffff"]).ok).toBe(true);
  });
  test("rejects colours outside the brand palette", () => {
    const r = validateDesignSvg(ok.replace("#1A1A1D", "#FF00AA"), ["#1a1a1d", "#ffffff"]);
    expect(r.ok).toBe(false);
  });
  test("strips scripts, event handlers and external images", () => {
    const bad = ok.replace("<text", '<script>alert(1)</script><image href="https://x.y/a.png"/><text onclick="x()"');
    const r = validateDesignSvg(bad, ["#1a1a1d", "#ffffff"]);
    expect(r.ok).toBe(false);
    expect(r.svg).not.toContain("<script");
    expect(r.svg).not.toContain("onclick");
    expect(r.svg).not.toContain("https://x.y");
  });
  test("text outside the safe area fails the fit check", () => {
    expect(boxesInsideSafeArea([{ x: 100, y: 100, width: 800, height: 200 }])).toBe(true);
    expect(boxesInsideSafeArea([{ x: 10, y: 100, width: 800, height: 200 }])).toBe(false);
  });
});
describe("AI slide copy fidelity", () => {
  test("rejects words the copy doesn't contain", () => {
    const svg = '<svg viewBox="0 0 1080 1350"><text fill="#FFFFFF">Stop <tspan>guessing</tspan> now</text></svg>';
    expect(validateDesignSvg(svg, ["#ffffff"], "Stop guessing").ok).toBe(false);
    expect(validateDesignSvg(svg, ["#ffffff"], "Stop guessing now").ok).toBe(true);
  });
});

import { validateDesignSvg as vds, checkDesignQuality as cdq } from "./aiDesign";
import { test as t2, expect as e2 } from "bun:test";
const head = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350">';
t2("photo slots are allowed only when a photo was provided", () => {
  const svg = `${head}<image href="photo:1" x="0" y="0" width="10" height="10"/></svg>`;
  e2(vds(svg, ["#ffffff"], undefined, 1).ok).toBe(true);
  e2(vds(svg, ["#ffffff"], undefined, 0).ok).toBe(false);
  e2(vds(`${head}<image href="https://x.com/a.png"/></svg>`, ["#ffffff"], undefined, 1).ok).toBe(false);
});
t2("a slide may use the gradient instead of the accent, but not both", () => {
  const grad = `<defs><linearGradient id="g"><stop stop-color="#112233"/><stop stop-color="#445566"/></linearGradient></defs>`;
  const sizes = '<text font-size="20">a</text><text font-size="40">b</text><text font-size="80">c</text><rect fill="url(#g)"/>';
  e2(cdq(`${head}${grad}${sizes}</svg>`, ["#ff0000"], ["#112233", "#445566"])).toEqual([]);
  e2(cdq(`${head}${grad}${sizes}<rect fill="#ff0000"/></svg>`, ["#ff0000"], ["#112233", "#445566"]).join(" ")).toContain("both");
});

describe("editorial micro-copy", () => {
  const head = '<svg viewBox="0 0 1080 1350">';
  test("allows up to 4 extra words in tiny labels", () => {
    const svg = `${head}<text font-size="18">Rise Voice Section</text><text font-size="80">Hello world</text></svg>`;
    expect(validateDesignSvg(svg, ["#ffffff"], "Hello world").ok).toBe(true);
  });
  test("rejects extra words in large text", () => {
    const svg = `${head}<text font-size="60">Bonus</text><text font-size="80">Hello world</text></svg>`;
    expect(validateDesignSvg(svg, ["#ffffff"], "Hello world").ok).toBe(false);
  });
  test("rejects a fifth extra label word", () => {
    const svg = `${head}<text font-size="18">one two three four five</text><text font-size="80">Hello</text></svg>`;
    expect(validateDesignSvg(svg, ["#ffffff"], "Hello").ok).toBe(false);
  });
});
