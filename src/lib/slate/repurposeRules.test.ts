// @ts-ignore Bun supplies its test runner at runtime.
import { describe, it, expect } from "bun:test";
import { ownPostInstruction, viralPostInstruction, wordCount } from "./repurposeRules";

describe("repurpose rules", () => {
  it("own-post conversion prioritizes target limits, not verbatim source length", () => {
    expect(ownPostInstruction("reformat")).toMatch(/target-format limits take priority/);
    expect(ownPostInstruction("reformat")).not.toMatch(/Do not add, drop or reorder points|opening line EXACTLY/);
  });
  it("own post in the same format only varies the hook or cover", () => {
    expect(ownPostInstruction("visual")).toMatch(/ONLY the visual hook/);
    expect(ownPostInstruction("cover")).toMatch(/ONLY the cover title/);
  });
  it("viral post keeps the word count within 10%", () => {
    expect(viralPostInstruction(120)).toMatch(/about 120 words, within 10%/);
  });
  it("viral post changes only topic, idea and stance", () => {
    expect(viralPostInstruction(10)).toMatch(/CHANGE ONLY: the topic, main idea and stance/);
  });
  it("counts words", () => expect(wordCount(" a b  c ")).toBe(3));
});
