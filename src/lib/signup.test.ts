// @ts-ignore Bun supplies its test runner at runtime.
import { describe, expect, test } from "bun:test";
import { cleanInstagram, cleanSignup, makeAccessCode, trialBrandName } from "./signup";

describe("free-trial sign-up", () => {
  test("a normal sign-up is accepted and tidied", () => {
    const r = cleanSignup({ name: "  Maya   Torres ", email: " Maya@Example.com ", instagram: "@maya.coaching" });
    expect(r).toEqual({ ok: true, value: { name: "Maya Torres", email: "maya@example.com", instagram: "maya.coaching" } });
  });
  test("Instagram links and handles both work", () => {
    expect(cleanInstagram("https://www.instagram.com/maya.coaching/?hl=en")).toBe("maya.coaching");
    expect(cleanInstagram("@maya_1")).toBe("maya_1");
    expect(cleanInstagram("")).toBe("");
  });
  test("Instagram is optional", () => expect(cleanSignup({ name: "Maya", email: "m@x.co" }).ok).toBe(true));
  test("a missing name is rejected", () => expect(cleanSignup({ email: "m@x.co" })).toEqual({ ok: false, error: "Add your name." }));
  test("a bad email is rejected", () => expect(cleanSignup({ name: "Maya", email: "maya@" }).ok).toBe(false));
  test("a bad handle is rejected", () => expect(cleanSignup({ name: "Maya", email: "m@x.co", instagram: "maya coaching!" }).ok).toBe(false));
  test("the hidden bot field blocks the sign-up", () => expect(cleanSignup({ name: "Maya", email: "m@x.co", website: "spam.com" }).ok).toBe(false));
  test("access codes look like rv- plus 8 easy-to-read characters", () => {
    for (let i = 0; i < 50; i++) expect(makeAccessCode()).toMatch(/^rv-[a-hj-km-np-z2-9]{8}$/);
  });
  test("the trial brand is the handle, or the name without one", () => {
    expect(trialBrandName({ name: "Maya", email: "m@x.co", instagram: "maya.coaching" })).toBe("@maya.coaching");
    expect(trialBrandName({ name: "Maya", email: "m@x.co", instagram: "" })).toBe("Maya");
  });
});
