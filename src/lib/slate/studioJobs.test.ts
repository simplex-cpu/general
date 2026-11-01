// @ts-nocheck -- Bun provides the test runner.
import { describe, expect, it } from "bun:test";
import { canRetry, isStale } from "./studioJobs";
describe("AI studio job rules", () => {
  it("flags a job silent for over 10 minutes", () => {
    const t = Date.parse("2026-10-17T06:35:00Z");
    expect(isStale("processing", "2026-10-17T06:35:00Z", t + 10 * 60000 + 1)).toBe(true);
    expect(isStale("processing", "2026-10-17T06:35:00Z", t + 9 * 60000)).toBe(false);
  });
  it("offers retry only for failed, stalled or unconfirmed jobs", () => {
    expect(canRetry("failed")).toBe(true);
    expect(canRetry("needs_attention")).toBe(true);
    expect(canRetry("submission_uncertain")).toBe(true);
    expect(canRetry("processing")).toBe(false);
    expect(canRetry("partial")).toBe(false);
  });
});
