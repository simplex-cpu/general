// @ts-nocheck -- Bun provides this module to its test runner.
import { expect, test } from "bun:test";
import {
  completeRequestStatus,
  editingPreferences,
  initialRequestStatus,
  requestStyleFields,
  safeRequestStyleFields,
  stablePlannerRequestId,
  workingRequestStatus,
} from "./productionRequest";

test("video and design requests use distinct lifecycle statuses", () => {
  expect(initialRequestStatus("BROLL")).toBe("To Edit");
  expect(workingRequestStatus("Talking Video")).toBe("Editing");
  expect(initialRequestStatus("Graphic")).toBe("To Design");
  expect(workingRequestStatus("Carousel")).toBe("Designing");
  expect(completeRequestStatus("Carousel")).toBe("Designed");
});

test("request style stores exact colors, opacity and a versioned snapshot", () => {
  const fields = requestStyleFields(
    {
      hookFont: "Anton, weight 400",
      captionFont: "Open Sans, weight 700",
      hookColor: "#ffffff",
      captionColor: "#112233",
      hookBacking: "#44556680",
      captionBacking: "transparent",
    },
    { talking: true, textPosition: "top" },
  );
  expect(fields["Hook backing opacity"]).toBe(50);
  expect(fields["Caption backing opacity"]).toBe(0);
  expect(fields["Text position"]).toBe("top");
  expect(JSON.parse(String(fields["Style snapshot"])).version).toBe(1);
});

test("planner request IDs are stable for retries", () => {
  expect(stablePlannerRequestId("rec123")).toBe("planner:rec123");
});

test("Talking Video keeps hook and caption preferences independent", () => {
  const preferences = editingPreferences(
    {
      hookFont: "Anton, weight 900",
      captionFont: "Poppins, weight 500",
      hookColor: "#ffffff",
      captionColor: "#ffff00",
      hookBacking: "#00000080",
      captionBacking: "#112233b3",
    },
    true,
  );
  expect("hook" in preferences && preferences.hook.font_family).toBe("Anton");
  expect("hook" in preferences && preferences.hook.font_size).toBe(8);
  expect("captions" in preferences && preferences.captions.font_family).toBe("Poppins");
  expect("captions" in preferences && preferences.captions.font_size).toBe(5);
  expect("captions" in preferences && preferences.captions.background_opacity).toBe(70);
});

test("BROLL uses the flat preference contract and transparent backing", () => {
  const preferences = editingPreferences(
    {
      hookFont: "Anton, weight 900",
      captionFont: "Inter, weight 700",
      hookColor: "#ffffff",
      captionColor: "#123456",
      hookBacking: "#000000",
      captionBacking: "transparent",
    },
    false,
  );
  expect("font_family" in preferences && preferences.font_family).toBe("Inter");
  expect("font_size" in preferences && preferences.font_size).toBe(6);
  expect("background_color" in preferences && preferences.background_color).toBe("none");
  expect("background_opacity" in preferences && preferences.background_opacity).toBe(0);
});

test("request styling drops unknown Airtable fields", () => {
  expect(
    safeRequestStyleFields(
      { "Editing preferences": JSON.stringify({ font_family: "Inter", font_weight: 700, font_size: 6, text_color: "#FFFFFF", background_color: "none", background_opacity: 0 }), Status: "Edited" },
      "BROLL",
    ),
  ).toEqual({ "Editing preferences": JSON.stringify({ font_family: "Inter", font_weight: 700, font_size: 6, text_color: "#FFFFFF", background_color: "none", background_opacity: 0 }) });
});

test("video request preferences are required and deeply validated", () => {
  expect(() => safeRequestStyleFields({}, "Talking Video")).toThrow("required");
  expect(() => safeRequestStyleFields({ "Editing preferences": JSON.stringify({ hook: {}, captions: {} }) }, "Talking Video")).toThrow("font family");
  expect(() => safeRequestStyleFields({ "Editing preferences": JSON.stringify({ font_family: "Inter", font_weight: 750, font_size: 6, text_color: "#FFFFFF", background_color: "none", background_opacity: 0 }) }, "BROLL")).toThrow("steps of 100");
});