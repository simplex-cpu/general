// @ts-ignore Bun supplies its test runner at runtime.
import { describe, it, expect } from "bun:test";
import { externalHref } from "./externalLink";
describe("externalHref", () => {
  it("routes outside links through /go", () => {
    expect(externalHref("https://instagram.com/p/x")).toBe("/go?u=https%3A%2F%2Finstagram.com%2Fp%2Fx");
  });
  it("leaves in-app paths alone", () => {
    expect(externalHref("/?planner=rec1")).toBe("/?planner=rec1");
  });
});
