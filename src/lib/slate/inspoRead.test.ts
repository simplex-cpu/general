// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, test } from "bun:test";
import { isSilentTranscript, isTopicFree, parseInspoAnalysis, readBranch } from "./inspoRead";

describe("inspo read", () => {
  test("only the four formats are accepted", () => {
    expect(() =>
      parseInspoAnalysis(JSON.stringify({ format: "Reel", whyItWorks: "x", title: "t" })),
    ).toThrow();
    expect(
      parseInspoAnalysis(
        JSON.stringify({ format: "B-roll", whyItWorks: "Hook template: X", title: "t" }),
      ).format,
    ).toBe("B-roll");
  });
  test("why it works must not be empty", () => {
    expect(() =>
      parseInspoAnalysis(JSON.stringify({ format: "Graphic", whyItWorks: " " })),
    ).toThrow();
  });
  test("videos are transcribed, carousels are read", () => {
    expect(readBranch({ videoUrl: "v" })).toBe("video");
    expect(readBranch({ imageUrls: ["a", "b"], format: "Carousel" })).toBe("images");
    expect(readBranch({ imageUrls: ["a"] })).toBe("images");
  });
});

test("silent or near-silent videos are read visually", () => {
  expect(isSilentTranscript("")).toBe(true);
  expect(isSilentTranscript("la la oh")).toBe(true);
  expect(isSilentTranscript("Here are three reasons your skincare routine fails")).toBe(false);
});
test("topic words leaking into the template are flagged", () => {
  const post = "Stop buying protein powder if you want to lose belly fat";
  expect(isTopicFree("Hook template: Stop buying protein powder if you want [result]", post)).toBe(
    false,
  );
  expect(
    isTopicFree("Hook template: Stop doing [common habit] if you want [desired result]", post),
  ).toBe(true);
});
