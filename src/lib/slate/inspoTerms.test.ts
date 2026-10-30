// @ts-nocheck -- Bun supplies its test runner.
import { describe, it, expect } from "bun:test";
import { parseTerms } from "./inspoFind";
describe("parseTerms", () => {
  it("never chops a longer query into the user's unfinished phrase", () => {
    expect(() => parseTerms('["agency content doesn\'t sound like me"]')).toThrow("do not truncate");
  });
  it("rejects the reported five-word fragment even though it fits the limit", () => {
    expect(() => parseTerms('["agency content doesn\'t sound like"]')).toThrow("unfinished");
  });
  it("keeps complete niche-specific queries intact", () => {
    expect(parseTerms('{"terms":["authentic brand voice","content ideas for agencies","turn followers into customers","social media content strategy","content marketing mistakes"]}')).toEqual([
      "authentic brand voice", "content ideas for agencies", "turn followers into customers", "social media content strategy", "content marketing mistakes",
    ]);
  });
  it("rejects unfinished connectors without banning complete comparisons", () => {
    expect(() => parseTerms('["content ideas for"]')).toThrow("unfinished");
    expect(parseTerms('["marketing versus sales"]')).toEqual(["marketing versus sales"]);
  });
  it("rejects non-text values instead of displaying object strings", () => {
    expect(() => parseTerms('{"terms":[{"query":"brand voice"}]}')).toThrow("not objects");
  });
  it("keeps at most 5 and drops duplicates/hashtags", () => {
    expect(parseTerms('["#brand voice","brand voice","content strategy","marketing mistakes","agency content","customer conversion","content planning"]')).toEqual(["brand voice", "content strategy", "marketing mistakes", "agency content", "customer conversion"]);
  });
  it("throws a readable error on garbage", () => {
    expect(() => parseTerms("nope")).toThrow("Couldn't generate search strings");
  });
});
