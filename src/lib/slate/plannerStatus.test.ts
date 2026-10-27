// @ts-nocheck -- Bun test runner
import { test, expect } from "bun:test";
import { boardStage, stageDropStatus } from "./plannerStatus";

test("board stages", () => {
  expect(boardStage("Prepare Footage")).toBe("footage");
  expect(boardStage("To Edit | Design", "Talking Video")).toBe("edit");
  expect(boardStage("To Edit | Design", "Carousel")).toBe("design");
  expect(boardStage("To Design")).toBe("design");
  expect(boardStage("To Approve")).toBe("approve");
  expect(boardStage("To Post")).toBe("post");
  expect(boardStage("Editing | Designing")).toBeNull();
});

test("dropping into Ready to Post writes the To Post status", () => {
  expect(stageDropStatus("post")).toBe("To Post");
  expect(stageDropStatus("footage")).toBe("Film");
  expect(stageDropStatus("approve")).toBe("Approve");
  expect(boardStage(stageDropStatus("design"), "Graphic")).toBe("design");
  expect(boardStage(stageDropStatus("edit"), "BROLL")).toBe("edit");
});
