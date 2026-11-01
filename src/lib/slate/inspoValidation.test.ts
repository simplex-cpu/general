// @ts-nocheck -- Bun test runner.
import { test, expect } from "bun:test";
import { inspoFields, inspoPatch, detectInspoPlatform, metadataIsCurrent } from "./inspoValidation";
const valid = {
  title: "A useful post",
  url: "https://www.instagram.com/p/abc/",
  platform: "Instagram",
};
test("Post title may be left for the reading to fill", () =>
  expect(inspoFields.safeParse({ ...valid, title: "" }).success).toBe(true));
test("Post URL is required", () =>
  expect(inspoFields.safeParse({ ...valid, url: "" }).success).toBe(false));
test("Platform is required", () =>
  expect(inspoFields.safeParse({ ...valid, platform: "" }).success).toBe(false));
test("Only title URL platform suffice", () => expect(inspoFields.parse(valid).copy).toBe(""));
test("Edits cannot change ownership", () =>
  expect(inspoPatch.safeParse({ "Created by": ["someone"] }).success).toBe(false));
test("Detects actual platform hosts not lookalikes", () => {
  expect(detectInspoPlatform(valid.url)).toBe("Instagram");
  expect(detectInspoPlatform("https://instagram.com.evil.test/p/abc")).toBe("");
});
test("Ignores stale URL results", () =>
  expect(metadataIsCurrent(valid.url, "https://tiktok.com/@x/video/123")).toBe(false));
