// @ts-nocheck -- Bun provides this module to its test runner.
import { test, expect } from "bun:test";
import { plannerPlacement, productionActions } from "./formatFields";

test("queue goes to Prepare footage", () => {
  expect(plannerPlacement("carousel", { action: "queue" }).status).toBe("Film");
});
test("video produce-now requires footage", () => {
  expect(plannerPlacement("talkingVideo", { action: "produce", handler: "risevoice" }).error).toBeTruthy();
  expect(plannerPlacement("talkingVideo", { action: "produce", handler: "risevoice", footageLink: "https://drive.google.com/x" }).status).toBe("To Edit | To Design");
});
test("design produce-now works without footage", () => {
  const r = plannerPlacement("graphic", { action: "produce", handler: "self" });
  expect(r.error).toBeUndefined();
  expect(r.requestType).toBe("Do it Myself");
});
test("waiting production posts offer assignment choices by format", () => {
  expect(productionActions("To Edit", "Talking Video")).toEqual(["assign", "dwy-edit"]);
  expect(productionActions("To Design", "Carousel")).toEqual(["assign", "dwy-design"]);
});
test("active production posts only offer comments", () => {
  expect(productionActions("In Progress", "Carousel")).toEqual(["comment"]);
});
