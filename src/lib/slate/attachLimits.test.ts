// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, it } from "bun:test";
import { checkAttachments, limitFor } from "./attachLimits";

const img = (n: number) => Array.from({ length: n }, () => ({ type: "image/png" }));
const vid = (n: number) => Array.from({ length: n }, () => ({ type: "video/mp4" }));

describe("attach limits", () => {
  it("carousel allows up to 24 images", () => {
    expect(checkAttachments("Carousel", img(24))).toBe("");
    expect(checkAttachments("Carousel", img(25))).not.toBe("");
    expect(limitFor("carousel")?.max).toBe(24);
  });
  it("graphic allows exactly 1 image", () => {
    expect(checkAttachments("Graphic", img(1))).toBe("");
    expect(checkAttachments("Graphic", img(2))).not.toBe("");
  });
  it("talking video allows up to 5 clips", () => {
    expect(checkAttachments("Talking Video", vid(5))).toBe("");
    expect(checkAttachments("talkingVideo", vid(6))).not.toBe("");
    expect(checkAttachments("Talking Video", img(1))).not.toBe("");
  });
  it("b-roll allows exactly 1 clip", () => {
    expect(checkAttachments("B-roll", vid(1))).toBe("");
    expect(checkAttachments("BROLL", vid(2))).not.toBe("");
  });
});
