// @ts-nocheck -- Bun supplies its test runner.
import { describe, expect, it } from "bun:test";
import { accountRow, planAccountWrites, safeReturnUrl } from "./zernioAccounts";

describe("zernio accounts", () => {
  it("marks accounts needing reconnection as signed out", () => {
    expect(accountRow({ _id: "a", platform: "tiktok", needsReconnection: true })?.status).toBe("Signed out");
    expect(accountRow({ _id: "b", platform: "instagram", isActive: true, metadata: { loginMethod: "facebook_login" } })).toMatchObject({ status: "Active", via: "Facebook", platform: "Instagram" });
  });
  it("updates known accounts instead of creating duplicates and removes vanished ones", () => {
    const plan = planAccountWrites([{ _id: "a", platform: "instagram" }, { _id: "c", platform: "tiktok" }], [{ id: "rec1", zernioId: "a" }, { id: "rec2", zernioId: "gone" }]);
    expect(plan.create.map((r) => r.zernioId)).toEqual(["c"]);
    expect(plan.update.map((u) => u.recordId)).toEqual(["rec1"]);
    expect(plan.remove).toEqual(["rec2"]);
  });
  it("only allows https return addresses on the app itself", () => {
    expect(safeReturnUrl("https://risevoicetools.com", "/connected")).toBe("https://risevoicetools.com/connected");
    expect(safeReturnUrl("https://risevoicetools.com", "https://evil.example/x")).toBeNull();
  });
});
