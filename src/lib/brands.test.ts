// @ts-ignore Bun supplies its test runner at runtime.
import { describe, expect, test } from "bun:test";
import { BRAND_BRIEF_FIELDS, briefCompletion, brandLinkOwned, createSingleFlight } from "./brands";
describe("brand brief contract", () => {
  test("empty brief is 0 percent", () => expect(briefCompletion({})).toBe(0));
  test("one of nine fields rounds to 11 percent", () => expect(briefCompletion({ "Brand Name": "Risevoice" })).toBe(11));
  test("whitespace does not count", () => expect(briefCompletion({ "Brand Name": "   " })).toBe(0));
  test("nine filled fields is 100 percent", () => expect(briefCompletion(Object.fromEntries(BRAND_BRIEF_FIELDS.map((key) => [key, "filled"])))).toBe(100));
  test("logo and connected socials do not count", () => expect(briefCompletion({ Logo: [{}], "Instagram Connected": "Connected" })).toBe(0));
  test("owned brand is accessible", () => expect(brandLinkOwned(["recMine"], ["recMine"])).toBe(true));
  test("another owner's brand is rejected", () => expect(brandLinkOwned(["recOther"], ["recMine"])).toBe(false));
  test("missing ownership rejects access", () => expect(brandLinkOwned(undefined, ["recMine"])).toBe(false));
  test("creation admits only one action until released", () => {
    const lock = createSingleFlight(); expect(lock.acquire()).toBe(true); expect(lock.acquire()).toBe(false);
    lock.release(); expect(lock.acquire()).toBe(true);
  });
});