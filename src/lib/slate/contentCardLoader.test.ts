// @ts-ignore Bun supplies its test runner at runtime.
import { describe, expect, it } from "bun:test";
import { cardErrorKind, mergeCard } from "./contentCardLoader";

describe("content card loader", () => {
  it("maps statuses to error kinds", () => {
    expect(cardErrorKind(503)).toBe("busy");
    expect(cardErrorKind(404)).toBe("notFound");
    expect(cardErrorKind(0, true)).toBe("timeout");
    expect(cardErrorKind(500)).toBe("failed");
  });
  it("loaded fields win over the starter", () => {
    expect(mergeCard({ postName: "Old", clientStatus: "Approve" }, { postName: "New", clientStatus: undefined as any })).toEqual({ postName: "New", clientStatus: "Approve" });
  });
});
