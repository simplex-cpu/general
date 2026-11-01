// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, test } from "bun:test";
import { railItems, wordCount } from "./contentCardRail";

describe("content card rail", () => {
  test("carousel shows section names only, never copy", () => {
    expect(railItems("carousel", { slideTitles: ["A", "B", "C", "D"] }).map((r) => r.title)).toEqual(["Cover", "Slide 1", "Slide 2", "Closing slide"]);
  });
  test("talking video has hook and script names", () => {
    expect(railItems("talking", {}).map((r) => r.title)).toEqual(["Visual hook", "Script"]);
  });
  test("b-roll and graphic have one part", () => {
    expect(railItems("broll", {})[0].title).toBe("Text overlay");
    expect(railItems("graphic", {})[0].title).toBe("Graphic");
  });
  test("word count", () => expect(wordCount(" a b  c ")).toBe(3));
});
