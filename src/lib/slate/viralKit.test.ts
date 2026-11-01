// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, test } from "bun:test";
import { primaryNavigationMode, viralKitDestination, VIRAL_KIT_TOOLS } from "./viralKit";

describe("Viral Kit availability", () => {
  test("Analyze account opens the existing analysis flow", () => {
    expect(viralKitDestination("strategy")).toBe("analyze");
  });
  test("Analyze Competitors is removed from the gallery", () => {
    expect(VIRAL_KIT_TOOLS.some((tool) => tool.id === "competitors")).toBe(false);
    expect(viralKitDestination("competitors")).toBeNull();
  });
  test("Long form Clipper opens its gallery", () => {
    expect(viralKitDestination("clipper")).toBe("clipper");
    expect(primaryNavigationMode("clipper")).toBe("viral-kit");
  });
  for (const id of ["thumbnails"]) {
    test(`${id} has no actionable destination in the initial release`, () => {
      expect(VIRAL_KIT_TOOLS.find((tool) => tool.id === id)?.available).toBe(false);
      expect(viralKitDestination(id)).toBeNull();
    });
  }
  test("analysis belongs to Viral Kit rather than standalone Analyze navigation", () => {
    expect(primaryNavigationMode("analyze")).toBe("viral-kit");
    expect(primaryNavigationMode("viral-kit")).toBe("viral-kit");
    expect(primaryNavigationMode("script")).toBe("script");
  });
});