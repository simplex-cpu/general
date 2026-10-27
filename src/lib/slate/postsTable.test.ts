// @ts-nocheck -- Bun supplies its test runner.
import { describe, test, expect } from "bun:test";
import { buildPostUpserts } from "./postsTable";
const s = (key, views, likes = 1) => ({ key, views, likes, comments: 2, saves: null, shares: null, url: "https://www.instagram.com/p/" + key.slice(3) + "/", publishedAt: "2026-10-01T00:00:00Z" });
describe("posts table upserts", () => {
  test("refresh does not overwrite an existing caption", () => {
    const { updates } = buildPostUpserts("Instagram", "recBrand", [{ id: "recP1", key: "ig:AAA", contentIds: [], brandIds: ["recBrand"], caption: "Saved caption" }], [{ ...s("ig:AAA", 100), caption: "Different caption" }], [], "now");
    expect("Caption" in updates[0].fields).toBe(false);
  });
  test("updates existing posts by key and creates missing ones linked to the brand", () => {
    const { updates, creates } = buildPostUpserts("Instagram", "recBrand", [{ id: "recP1", key: "ig:AAA", contentIds: [], brandIds: ["recBrand"] }], [s("ig:AAA", 100), s("ig:BBB", 5)], [], "now");
    expect(updates.length).toBe(1);
    expect(updates[0].fields.Views).toBe(100);
    expect(creates.length).toBe(1);
    expect(creates[0].fields.Brand).toEqual(["recBrand"]);
    expect(creates[0].fields["Post Key"]).toBe("ig:BBB");
    expect("Content" in creates[0].fields).toBe(false);
  });
  test("links a planner piece with the same live link", () => {
    const { creates } = buildPostUpserts("Instagram", "recBrand", [], [s("ig:CCC", 1)], [{ id: "recContent", url: "https://instagram.com/reel/CCC/" }], "now");
    expect(creates[0].fields.Content).toEqual(["recContent"]);
  });
  test("never writes blank stats, keeps real zero", () => {
    const { creates } = buildPostUpserts("Instagram", "recBrand", [], [s("ig:DDD", null, 0)], [], "now");
    expect("Views" in creates[0].fields).toBe(false);
    expect(creates[0].fields.Likes).toBe(0);
  });
});
