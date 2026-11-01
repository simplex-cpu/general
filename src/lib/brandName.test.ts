// @ts-ignore Bun supplies its test runner at runtime.
import { describe, it, expect } from "bun:test";
import { sameBrandName } from "./brands";
describe("sameBrandName", () => {
  it("reuses a brand with the same name", () => expect(sameBrandName("Dev Usama", "dev  usama")).toBe(true));
  it("does not match a different brand", () => expect(sameBrandName("Dev Usama", "Kash")).toBe(false));
  it("never matches empty names", () => expect(sameBrandName("", "")).toBe(false));
});
