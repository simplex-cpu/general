// @ts-nocheck -- Bun supplies its test runner.
import { describe, it, expect } from "bun:test";
import { postKey, scrapedStats, buildStatPatches } from "./statsRefresh";
describe("stats refresh", () => {
  it("matches instagram /p/ and /reel/ and tiktok ids", () => {
    expect(postKey("Instagram", "https://www.instagram.com/reel/ABC_1/?igsh=x")).toBe("ig:ABC_1");
    expect(postKey("Instagram", "https://instagram.com/p/ABC_1/")).toBe("ig:ABC_1");
    expect(postKey("TikTok", "https://www.tiktok.com/@me/video/7312345678901234567?lang=en")).toBe("tt:7312345678901234567");
  });
  it("updates only planner posts, never writes blanks, keeps real zero", () => {
    const scraped = [scrapedStats("Instagram", { shortCode: "AAA", likesCount: 0, commentsCount: 3, videoPlayCount: 500 }), scrapedStats("Instagram", { shortCode: "ZZZ", likesCount: 1 })];
    const { patches, notOnPlanner } = buildStatPatches("Instagram", [{ id: "rec1", url: "https://www.instagram.com/p/AAA/" }, { id: "rec2", url: "https://www.instagram.com/p/BBB/" }], scraped, "2026-10-17T00:00:00Z");
    expect(patches.length).toBe(1);
    expect(patches[0].fields["Instagram Likes"]).toBe(0);
    expect(patches[0].fields["Instagram Views"]).toBe(500);
    expect("Instagram Saves" in patches[0].fields).toBe(false);
    expect(patches[0].fields["Instagram Stats Status"]).toBe("Partial");
    expect(notOnPlanner).toBe(1);
  });
});
import { tagFields as tf, deriveHook } from "./statsRefresh";
describe("posted content", () => {
  it("fills posted content only when blank", () => {
    const content = { caption: "Cap", transcript: "Hi there. More.", hook: "Hi there.", coverUrl: "https://x/c.jpg", slideCopy: "" };
    expect(tf({ id: "r", url: "", topic: "t", postType: "p" }, { topic: "", type: null, content })["Posted Caption"]).toBe("Cap");
    expect(Object.keys(tf({ id: "r", url: "", topic: "t", postType: "p", caption: "Old" }, { topic: "", type: null, content })).length).toBe(0);
    expect(deriveHook("Hi there. More.", "Cap")).toBe("Hi there.");
    expect(deriveHook("", "Line one\nLine two")).toBe("Line one");
  });
});
