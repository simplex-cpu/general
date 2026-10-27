// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, test as it } from "bun:test";
import { fitColumnWidths, plannerMenuActions, plannerPrimaryActions } from "./plannerPresentation";

const ids = (list: { id: string }[]) => list.map((a) => a.id);

describe("planner three-dots menu", () => {
  it("lists all nine actions when nothing is primary", () => {
    expect(plannerMenuActions("Carousel", []).length).toBe(9);
  });
  it("hides actions already shown as main buttons", () => {
    const list = plannerMenuActions("Talking Video", plannerPrimaryActions("toFilm", "Film", "Talking Video", false));
    expect(ids(list)).not.toContain("attach");
    expect(ids(list)).not.toContain("teleprompt");
  });
  it("disables Teleprompt and DIY Edit for carousels", () => {
    const list = plannerMenuActions("Carousel", []);
    expect(list.find((a) => a.id === "teleprompt")?.disabled).toBe(true);
    expect(list.find((a) => a.id === "diyEdit")?.disabled).toBe(true);
    expect(list.find((a) => a.id === "diyDesign")?.disabled).toBe(false);
  });
  it("disables DIY Design and Teleprompt for Broll", () => {
    const list = plannerMenuActions("BROLL", []);
    expect(list.find((a) => a.id === "diyDesign")?.disabled).toBe(true);
    expect(list.find((a) => a.id === "teleprompt")?.disabled).toBe(true);
    expect(list.find((a) => a.id === "diyEdit")?.disabled).toBe(false);
  });
  it("Ready to Post keeps Post out of the menu", () => {
    expect(ids(plannerMenuActions("Graphic", plannerPrimaryActions("approved", "Approved", "Graphic", false)))).not.toContain("post");
  });
});

describe("column fitting", () => {
  it("grows to fit text but caps long names and never shrinks below default", () => {
    const measure = (t: string) => t.length * 7;
    const [name, type] = fitColumnWidths(["Post name", "Type"], [["x".repeat(200)], ["Talking Video"]], measure, [250, 135]);
    expect(name).toBe(260); // post names are capped tighter than other columns
    expect(type).toBe(147);
  });
});
