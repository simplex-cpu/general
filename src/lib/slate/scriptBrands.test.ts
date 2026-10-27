// @ts-nocheck -- Bun supplies its test runner.
import { describe, expect, it } from "bun:test";
import { autoBrand, sessionBrandName, sessionMatchesBrand } from "./scriptBrands";

const a = { id: "b1", name: "A", brandIds: ["recA"] };
const b = { id: "b2", name: "B", brandIds: ["recB"] };
const legacy = { id: "b0", name: "L", brandIds: [] };

describe("script brands", () => {
  it("filters history to the chosen brand", () => {
    expect(sessionMatchesBrand(["recA"], a, [a, b])).toBe(true);
    expect(sessionMatchesBrand(["recB"], a, [a, b])).toBe(false);
  });
  it("shows every session for All brands", () => {
    expect(sessionMatchesBrand(["recB"], null, [a, b])).toBe(true);
  });
  it("gives unlinked sessions to the legacy brand only", () => {
    expect(sessionMatchesBrand([], legacy, [legacy, a])).toBe(true);
    expect(sessionMatchesBrand([], a, [legacy, a])).toBe(false);
  });
  it("auto-picks only when there is exactly one brand", () => {
    expect(autoBrand([a])).toBe(a);
    expect(autoBrand([a, b])).toBeNull();
  });
  it("names the session's brand for its title", () => {
    expect(sessionBrandName(["recB"], [a, b])).toBe("B");
    expect(sessionBrandName([], [legacy, a])).toBe("L");
  });
});
