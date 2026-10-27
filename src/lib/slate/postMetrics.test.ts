// @ts-ignore Bun supplies its test runner at runtime.
import { describe, expect, test } from "bun:test";
import { readableTitle, refreshSummary, topTopics, analyzePostMetrics, metricFields, metricNumber, readPostMetrics, type MetricsPost } from "./postMetrics";
import { attentionReason } from "./plannerStatus";
import { ownsRecord } from "../owner.server";

const post = (id: string, fields: Record<string, unknown>): MetricsPost => ({ id, postName: id, postType: "Graphic", clientStatus: "Posted", postingDate: "", platforms: [], previewUrl: "", metrics: readPostMetrics(fields) });
describe("stored platform statistics", () => {
  test("content ownership rejects another client and unresolved owners", () => {
    expect(ownsRecord(["recClientA"], "recClientA")).toBe(true);
    expect(ownsRecord(["recClientA"], "recClientB")).toBe(false);
    expect(ownsRecord([], null)).toBe(false);
  });
  test("five metrics remain separate for each platform on one content record", () => {
    const result = readPostMetrics({ "Instagram Views": 500, "Instagram Likes": 12, "Instagram Comments": 3, "Instagram Saves": 8, "Instagram Shares": 4, "TikTok Views": 900 });
    expect(result.Instagram).toMatchObject({ views: 500, likes: 12, comments: 3, saves: 8, shares: 4 });
    expect(result.TikTok.views).toBe(900);
    expect(metricFields("TikTok").url).toBe("TikTok Posted link");
  });
  test("missing metrics are null while genuine zero is preserved", () => {
    expect(metricNumber(undefined)).toBeNull(); expect(metricNumber(0)).toBe(0);
    expect(metricNumber(-1)).toBeNull(); expect(metricNumber(1.2)).toBeNull();
    expect(readPostMetrics({ "Instagram Likes": 0 }).Instagram.saves).toBeNull();
  });
  test("last 30 days use publication dates and do not infer them from scheduling", () => {
    const posts = [post("recent", { "Instagram Posted link": "https://instagram.com/p/new", "Instagram Published At": "2026-10-10", "Instagram Views": 500 }), post("old", { "Instagram Posted link": "https://instagram.com/p/old", "Instagram Published At": "2026-08-01", "Instagram Views": 900 }), post("missing", { "Instagram Posted link": "https://instagram.com/p/missing", "Instagram Views": 800 })];
    const analysis = analyzePostMetrics(posts, "Instagram", 30, new Date("2026-10-14"));
    expect(analysis.publishedCount).toBe(1); expect(analysis.totals.views.value).toBe(500);
  });
  test("ranking deduplicates records and never mixes platforms or missing values", () => {
    const first = post("a", { "Instagram Posted link": "https://instagram.com/p/a", "Instagram Published At": "2026-10-10", "Instagram Views": 500, "TikTok Views": 2000 });
    const second = post("b", { "Instagram Posted link": "https://instagram.com/p/b", "Instagram Published At": "2026-10-11", "Instagram Views": 800 });
    const result = analyzePostMetrics([first, first, second], "Instagram", 30, new Date("2026-10-14"));
    expect(result.measuredCount).toBe(2); expect(result.totals.views.value).toBe(1300); expect(result.top[0]?.post.id).toBe("b"); expect(result.totals.saves.value).toBeNull();
  });
  test("pending footage and approval are actionable, production/redo are not client tasks", () => {
    expect(attentionReason("Prepare footage")?.action).toBe("Add footage"); expect(attentionReason("Approve")?.action).toBe("Review");
    expect(attentionReason("Approved")?.label).toBe("Ready to publish");
    expect(attentionReason("Editing")).toBeNull(); expect(attentionReason("Risevoice Redo")).toBeNull(); expect(attentionReason("Posted")).toBeNull();
  });
});
describe("top performing topic", () => {
  test("highest average views wins, ties go to more posts, blanks ignored", () => {
    const r = topTopics([{ topic: "Sleep", views: 100 }, { topic: "sleep", views: 300 }, { topic: "Money", views: 200 }, { topic: "", views: 9999 }, { topic: "Diet", views: null }, { topic: "Focus", views: 200 }, { topic: "Focus", views: 200 }]);
    expect(r[0]).toEqual({ topic: "Sleep", averageViews: 200, count: 2 });
    expect(r[1].topic).toBe("Focus");
    expect(r.map((x) => x.topic)).not.toContain("Diet");
  });
});

describe("readableTitle", () => {
  test("strips brackets, dates and brand", () => expect(readableTitle("[Kash] 2026-10-03 – Why PR matters", ["Kash"])).toBe("Why PR matters"));
  test("falls back to hook", () => expect(readableTitle("[Kash] 10/03/2026", ["Kash"], ["", "Stop posting daily\nmore"])).toBe("Stop posting daily"));
});
describe("refreshSummary", () => {
  test("reports new posts", () => expect(refreshSummary("Instagram", 24, 4, 20)).toBe("Updated 4 posts · added 20 new posts"));
  test("explains no posts", () => expect(refreshSummary("Instagram", 0, 0, 0)).toContain("Check the handle"));
});
