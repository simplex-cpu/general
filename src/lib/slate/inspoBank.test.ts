// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, test } from "bun:test";
import { derivePostTitle, postAge, writerFormat } from "./inspoBank";
import { viralKitDestination } from "./viralKit";

describe("Bank of Inspo", () => {
  test("opens from Viral Kit", () => expect(viralKitDestination("inspo")).toBe("inspo"));
  test("post age counts days since posted", () => {
    expect(postAge("2026-10-11", new Date("2026-10-14T12:00:00Z"))).toBe("3 days");
    expect(postAge("2026-06-14", new Date("2026-10-14T12:00:00Z"))).toBe("4 months");
    expect(postAge("", new Date())).toBe("");
  });
  test("empty title is derived from the copy", () => {
    expect(derivePostTitle("", "Stop posting daily. Here's why.")).toBe("Stop posting daily.");
    expect(derivePostTitle("Mine", "x")).toBe("Mine");
  });
  test("format maps to the scriptwriter format", () => expect(writerFormat("B-roll")).toBe("broll"));
});

import { inspoEmbedUrl } from "./inspoBank";
describe("inspo embed", () => {
  test("instagram reel", () => expect(inspoEmbedUrl("https://www.instagram.com/reel/ABC_1/")).toBe("https://www.instagram.com/reel/ABC_1/embed"));
  test("tiktok video", () => expect(inspoEmbedUrl("https://www.tiktok.com/@a/video/123")).toBe("https://www.tiktok.com/embed/v2/123"));
});
