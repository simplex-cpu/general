// @ts-ignore Bun supplies its test runner at runtime.
import { describe, expect, it } from "bun:test";
import { angleInstruction, brandPillars, brandRealityBlock } from "./brandContext";

const f = { "Brand Name": "Kash", "My Brand in Nutshell": "Content agency", "Pain Points": "No time", "Topics": "Hooks, Scripting", "My Funnel for Monetization": "Book a call" };

describe("brandContext", () => {
  it("includes reality fields and excludes funnel by default", () => {
    const b = brandRealityBlock(f);
    expect(b).toContain("Content agency");
    expect(b).toContain("No time");
    expect(b).not.toContain("Book a call");
    expect(brandRealityBlock(f, { includeFunnel: true })).toContain("Book a call");
  });
  it("splits pillars", () => expect(brandPillars(f)).toEqual(["Hooks", "Scripting"]));
  it("keep angle leaves own-post message unchanged", () => expect(angleInstruction({ kind: "keep", text: "" }, "own")).toContain("unchanged"));
  it("viral angle is injected as the new topic", () => expect(angleInstruction({ kind: "trending", text: "AI fatigue" }, "viral")).toContain("AI fatigue"));
});
