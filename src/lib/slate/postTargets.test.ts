// @ts-ignore Bun supplies its test runner at runtime.
import { describe, expect, it } from "bun:test";
import { formatsFor, postBlocker, validFormats } from "./postTargets";

describe("post targets", () => {
  it("offers only formats of the selected platforms", () => {
    expect(formatsFor(["Tiktok"])).toEqual(["TikTok Video", "TikTok Photo Carousel"]);
    expect(formatsFor(["Youtube"])).toEqual([]);
  });
  it("drops formats for unselected platforms", () => {
    expect(validFormats(["Instagram Reel", "TikTok Video"], ["Instagram"])).toEqual(["Instagram Reel"]);
  });
  it("blocks posting unless the card is Ready to Post", () => {
    expect(postBlocker({ clientStatus: "Approved", postAccountIds: ["a"], postFormats: ["Instagram Reel"] })).toMatch(/Ready to Post/);
    expect(postBlocker({ clientStatus: "To Post", postAccountIds: ["a"], postFormats: ["Instagram Reel"] })).toBe("");
    expect(postBlocker({ clientStatus: "To Post", postAccountIds: [], postFormats: [] })).toMatch(/account/);
  });
});
