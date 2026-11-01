// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, test } from "bun:test";
import { isReelRatio, shapeForFormat, SOCIAL_SIZES } from "./socialSizes";

describe("social post sizes", () => {
  test("videos are 1080x1920 (9:16)", () => {
    expect(SOCIAL_SIZES.reel).toMatchObject({ width: 1080, height: 1920 });
  });
  test("carousels and graphics are 1080x1350 (4:5)", () => {
    expect(SOCIAL_SIZES.feed).toMatchObject({ width: 1080, height: 1350 });
  });
  test("format picks the frame", () => {
    expect(shapeForFormat("Talking Video")).toBe("reel");
    expect(shapeForFormat("BROLL")).toBe("reel");
    expect(shapeForFormat("Carousel")).toBe("feed");
    expect(shapeForFormat("Graphic")).toBe("feed");
  });
  test("flags videos that are not 9:16", () => {
    expect(isReelRatio(1080, 1920)).toBe(true);
    expect(isReelRatio(1920, 1080)).toBe(false);
    expect(isReelRatio(1080, 1080)).toBe(false);
  });
});

import { requestStyleFields } from "./productionRequest";
test("video edit requests ask for 1080x1920 output", () => {
  const style = { hookFont: "Inter", hookColor: "#fff", hookBacking: "#000", captionFont: "Inter", captionColor: "#fff", captionBacking: "#000" } as any;
  const fields = requestStyleFields(style, { talking: true });
  const snapshot = JSON.parse(String(Object.values(fields).find((v) => typeof v === "string" && v.includes('"output"'))));
  expect(snapshot.output).toEqual({ width: 1080, height: 1920, aspect: "9:16" });
});
