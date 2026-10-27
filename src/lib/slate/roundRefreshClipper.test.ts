// @ts-nocheck -- Bun test runner.
import { describe, expect, test } from "bun:test";
import { postsNeedingTags, tagFields } from "./statsRefresh";
import { estimateWait, formatPostCopy, boardScript } from "./longFormClipper";

describe("refresh tagging", () => {
  const url = "https://www.instagram.com/reel/ABC123/";
  test("only posts on the profile missing a topic or format are tagged", () => {
    const posts = [{ id: "a", url, topic: "", postType: "Carousel", caption: "Hi" }, { id: "b", url, topic: "Sleep", postType: "Broll", caption: "Hi" }];
    expect(postsNeedingTags("Instagram", posts, new Set(["ig:ABC123"])).map((p) => p.id)).toEqual(["a"]);
  });
  test("saved topic and format are never overwritten", () => {
    expect(tagFields({ id: "a", url, topic: "Sleep", postType: "Carousel" }, { topic: "Diet", type: "broll" })).toEqual({});
  });
  test("empty fields are filled", () => {
    expect(tagFields({ id: "a", url, topic: "", postType: "" }, { topic: "Diet", type: "talking" })).toEqual({ Topic: "Diet", "Post Type": "\u{1F4F9} Talking Video" });
  });
});

describe("long form clipper", () => {
  test("wait estimate grows with short forms", () => {
    expect(estimateWait("transcribe", 0)).toBe("About 10–30 min");
    expect(estimateWait("upload", 4)).toBe("About 3–6 min");
  });
  test("manual carousel keeps slide subtitle and body for the planner", () => {
    const copy = formatPostCopy("Carousel", { name: "x", timestamps: "", coverTitle: "C", coverSubtitle: "S", slides: ["T1"], slideDetails: [{ subtitle: "Sub", body: "Body" }], cta: "Follow" });
    const s = boardScript("Carousel", copy) as any;
    expect(s.slides[1]).toMatchObject({ headline: "T1", subtitle: "Sub", body: "Body" });
    expect(s.cta).toBe("Follow");
  });
  test("graphic keeps its body", () => {
    expect((boardScript("Graphic", formatPostCopy("Graphic", { name: "x", timestamps: "", coverTitle: "T", coverBody: "B" })) as any).slides[0].body).toBe("B");
  });
});
