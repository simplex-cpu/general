// @ts-ignore Bun supplies its test runner at runtime.
import { describe, expect, test } from "bun:test";
import { planRepurpose, writerFormatFor } from "./postRepurpose";

describe("planRepurpose", () => {
  test("talking video to talking video makes a new visual", () => expect(planRepurpose("Talking Video", "talkingVideo")).toBe("visual"));
  test("carousel to carousel makes a new cover title", () => expect(planRepurpose("Carousel", "carousel")).toBe("cover"));
  test("graphic to graphic makes a new cover title", () => expect(planRepurpose("Single Graphic", "graphic")).toBe("cover"));
  test("different format reformats the copy", () => {
    expect(planRepurpose("Carousel", "talkingVideo")).toBe("reformat");
    expect(planRepurpose("Talking Video", "story")).toBe("reformat");
    expect(planRepurpose("B-roll", "carousel")).toBe("reformat");
  });
  test("b-roll to b-roll makes a new hook line", () => expect(planRepurpose("B-roll", "broll")).toBe("visual"));
  test("talking video to b-roll reformats", () => expect(planRepurpose("Talking Video", "broll")).toBe("reformat"));
  test("story is written as a text overlay", () => expect(writerFormatFor("story")).toBe("broll"));
});

import { ownPostSystemPrompt } from "./postRepurpose";
describe("own-post format guidelines", () => {
  test("conversion includes the new format's guidelines", () => expect(ownPostSystemPrompt("reformat", "carousel", "BASE", "CAROUSEL RULES")).toContain("CAROUSEL RULES"));
  test("same format does not", () => expect(ownPostSystemPrompt("cover", "carousel", "BASE", "CAROUSEL RULES")).toBe("BASE"));
});
