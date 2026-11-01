// @ts-ignore Bun runtime
import { expect, test } from "bun:test";
import { sectionsFromPostCopy, sectionsFromScript, oneLine } from "./postFields";
const c = { caption: "Cap #a", hashtags: "#a", transcript: "T", textOnScreen: "On screen", coverTitle: "Cover", coverCopy: "", visualHook: "Line one\nline two", slideCopy: "Slide 1\nTitle: Cover\n\nSlide 2\nTitle: Two", hook: "" };
const labels = (f: string) => sectionsFromPostCopy(f, c).map((s) => s.label);
test("graphic fields", () => expect(labels("Single Graphic")).toEqual(["Slide copy", "Captions and hashtags"]));
test("carousel fields", () => expect(labels("Carousel")).toEqual(["Cover title", "Slides copy", "Captions and hashtags"]));
test("talking video fields", () => expect(labels("Talking Video")).toEqual(["Visual hook", "Transcript", "Captions and hashtags"]));
test("b-roll fields", () => expect(labels("B-roll")).toEqual(["Text on screen", "Captions and hashtags"]));
test("carousel slides labelled", () => expect(sectionsFromPostCopy("Carousel", c)[1].items?.map((i) => i.title)).toEqual(["Slide 1", "Slide 2"]));
test("visual hook on one line", () => expect(oneLine(c.visualHook)).toBe("Line one line two"));
test("story result shows text on screen", () => expect(sectionsFromScript("story", { format: "broll", kind: "video", topic: "", visualHook: "", script: "x", onScreenCta: "" } as any)[0].label).toBe("Text on screen"));
