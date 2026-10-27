// @ts-ignore Bun supplies its test runner at runtime.
import { describe, expect, test } from "bun:test";
import { profileBlockReason } from "./statsRefresh";
describe("profileBlockReason", () => {
  test("age-restricted Instagram profile gets the real reason", () => {
    const r = profileBlockReason("Instagram", [{ username: "drninahelps", biography: "x", error: "Restricted profile", isRestrictedProfile: true, latestPosts: [] }]);
    expect(r).toContain("age-restricted");
    expect(r).not.toContain("Check the handle");
  });
  test("normal posts are not blocked", () => expect(profileBlockReason("Instagram", [{ shortCode: "abc", type: "Video" }])).toBe(""));
  test("private TikTok profile", () => expect(profileBlockReason("TikTok", [{ authorMeta: { privateAccount: true } }])).toContain("private"));
});
import { scrapeFailureKind } from "./statsRefresh";
// @ts-ignore Bun supplies its test runner at runtime.
import { describe as d2, it as i2, expect as e2 } from "bun:test";
d2("scrape failure kind", () => {
  i2("a blocked Instagram read is not blamed on the handle", () => {
    e2(scrapeFailureKind("Instagram", [{ url: "https://www.instagram.com/kashsocialmediatips/", requestErrorMessages: ["Request blocked, retrying it again with different session"] }])).toBe("blocked");
  });
  i2("a missing profile still points at the handle", () => {
    e2(scrapeFailureKind("Instagram", [{ error: "not_found", errorDescription: "Profile not found" }])).toBe("missing");
  });
  i2("posts returned means no failure", () => {
    e2(scrapeFailureKind("Instagram", [{ shortCode: "ABC", type: "Video" }])).toBe("");
  });
});
