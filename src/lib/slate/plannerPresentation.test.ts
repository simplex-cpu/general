// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, test } from "bun:test";
import { approvalGroup, displayAssignee, productionGroup } from "./plannerPresentation";

describe("planner presentation rules", () => {
  test("groups approval videos separately from carousel and graphic images", () => {
    expect(approvalGroup("Talking Video")).toBe("videos");
    expect(approvalGroup("BROLL")).toBe("videos");
    expect(approvalGroup("Carousel")).toBe("images");
    expect(approvalGroup("Graphic")).toBe("images");
  });
  test("does not assign waiting work before a production route is chosen", () => {
    expect(displayAssignee(undefined)).toBe("");
    expect(displayAssignee("")).toBe("");
  });

  test("derives the selected production assignee", () => {
    expect(displayAssignee("Do it Myself")).toBe("You");
    expect(displayAssignee("Risevoice Request")).toBe("Risevoice");
  });

  test("sorts production work into the four format-aware groups", () => {
    expect(productionGroup("To Edit | Design", "Talking Video")).toBe("to-edit");
    expect(productionGroup("To Edit | Design", "Carousel")).toBe("to-design");
    expect(productionGroup("In Progress", "BROLL")).toBe("editing");
    expect(productionGroup("In Progress", "Graphic")).toBe("designing");
  });
});
import { formatGroup } from "./plannerPresentation";
describe("planner type grouping", () => {
  test("groups Prepare Footage rows by type", () => {
    expect(formatGroup("Talking Video")).toBe("talking");
    expect(formatGroup("BROLL")).toBe("broll");
    expect(formatGroup("B-roll")).toBe("broll");
    expect(formatGroup("Carousel")).toBe("carousel");
    expect(formatGroup("Graphic")).toBe("graphic");
    expect(formatGroup("")).toBe("other");
  });
});
