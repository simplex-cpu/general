// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, test } from "bun:test";
import { searchTerms, topHits, qualifies, uniqueNewPosts, parseTerms, type TikTokHit } from "./inspoFind";

const now = Date.parse("2026-10-15T00:00:00Z");
const day = 86_400_000;
const hit = (p: Partial<TikTokHit>): TikTokHit => ({
  url: "https://tiktok.com/x",
  views: 20000,
  likes: 100,
  comments: 0,
  shares: 0,
  isStatic: false,
  createdAt: now - 10 * day,
  ...p,
});

describe("search terms", () => {
  test("max five words per term", () => {
    expect(searchTerms.safeParse(["grow fast now quickly today"]).success).toBe(true);
    expect(searchTerms.safeParse(["grow fast now quickly today please"]).success).toBe(false);
    expect(searchTerms.safeParse(["grow fast"]).success).toBe(true);
  });
  test("max five terms", () => {
    expect(searchTerms.safeParse(["a", "b", "c", "d", "e", "f"]).success).toBe(false);
  });
});

describe("post selection", () => {
  test("repeat runs skip saved posts despite tracking, handle or photo URL changes", () => {
    expect(uniqueNewPosts([
      "https://www.tiktok.com/@new/photo/123?tracking=2",
      "https://www.tiktok.com/@creator/video/456",
      "https://tiktok.com/@creator/video/456?tracking=1",
    ], ["https://tiktok.com/@old/video/123?tracking=1"])).toEqual([
      "https://www.tiktok.com/@creator/video/456",
    ]);
  });
  test("duplicate hits do not consume top five slots", () => {
    const hits = Array.from({ length: 6 }, (_, i) => hit({ url: `https://tiktok.com/@c/video/${i}`, likes: 1000 - i }));
    expect(topHits([hits[0], { ...hits[0], url: hits[0].url + "?tracking=1" }, ...hits.slice(1)], now, new Set(), 5).map(h => h.url)).toEqual(hits.slice(0, 5).map(h => h.url));
  });
  test("videos need 10,000 views", () => {
    expect(qualifies(hit({ views: 9999 }), now)).toBe(false);
    expect(qualifies(hit({ views: 10000 }), now)).toBe(true);
  });
  test("static posts need 200 likes", () => {
    expect(qualifies(hit({ isStatic: true, views: 0, likes: 199 }), now)).toBe(false);
    expect(qualifies(hit({ isStatic: true, views: 0, likes: 200 }), now)).toBe(true);
  });
  test("older than 180 days is skipped", () => {
    expect(qualifies(hit({ createdAt: now - 181 * day }), now)).toBe(false);
  });
  test("keeps top 5 by engagement", () => {
    const hits = Array.from({ length: 8 }, (_, i) => hit({ url: `u${i}`, likes: i * 100 }));
    expect(topHits(hits, now, new Set(), 5).map((h) => h.url)).toEqual(["u7", "u6", "u5", "u4", "u3"]);
  });
});

import { selfLabelCount as _slc, parseSelfLabels as _psl, KEEP_PER_TERM as _K, PER_TERM_RESULTS as _P } from "./inspoFind";
test("search keeps double the posts per term", () => { expect(_K).toBe(10); expect(_P).toBe(60); });
test("at least two terms must use the audience's self-label", () => {
  const labels = _psl('{"terms":[],"selfLabels":["Founders","business owners"]}');
  expect(labels).toEqual(["founders", "business owners"]);
  expect(_slc(["content tips for founders", "business owners marketing", "brand voice"], labels)).toBe(2);
  expect(_slc(["foundersclub tips", "brand voice"], labels)).toBe(0);
});

test("reads terms when the reply also lists self-labels", () => {
  expect(parseTerms('{"terms":["agency founders content tips","small business owners marketing","content marketing mistakes","social media content strategy","turn followers into customers"],"selfLabels":["founders","owners"]}')).toHaveLength(5);
});
