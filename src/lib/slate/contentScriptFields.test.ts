// @ts-nocheck -- Bun supplies its test runner.
import { test, expect } from "bun:test";
import { contentScriptFields, readContentScript, editScriptFields, legacyScriptParts } from "./contentScriptFields";

const parts = { script: "The full spoken script. A natural spoken closing.", visualHook: "Why your scripts stall", textOverlay: "One concise overlay", visualCta: "Comment GUIDE", timestamps: "5:33-5:35\n7:10-7:42", creativeDirection: "Cut to the close-up." };
test("talking copy keeps spoken script, visual hook and visual CTA separate", () => {
  const f = contentScriptFields("Talking Video", parts);
  expect(f["Script Text"]).toBe(parts.script);
  expect(f["Visual Hook"]).toBe(parts.visualHook);
  expect(f["visual cta"]).toBe("Comment GUIDE");
  expect(f["Text overlay"]).toBe("");
});
test("BROLL saves only the overlay as on-screen copy, not Script Text", () => {
  const f = contentScriptFields("📹 BROLL Video", parts);
  expect(f["Text overlay"]).toBe("One concise overlay");
  expect(f["Script Text"]).toBe("");
  expect(f["Visual Hook"]).toBe("");
  expect(f["visual cta"]).toBe("");
});
test("editing receives script in Source speech with distinct hook CTA and notes", () => {
  const f = editScriptFields("Talking Video", parts);
  expect(f["Source speech"]).toBe(parts.script);
  expect(f["Visual Hook"]).toBe(parts.visualHook);
  expect(f.CTA).toBe("Comment GUIDE");
  expect(f["Text Overlay"]).toBe("");
  expect(f["Creative Direction"]).toBe("Cut to the close-up.");
});
test("timestamps preserve one padded timeline per row", () => {
  expect(contentScriptFields("talkingVideo", parts).Timestamps).toBe("00:05:33-00:05:35\n00:07:10-00:07:42");
  expect(editScriptFields("Talking Video", parts).Timestamps).toBe("00:05:33-00:05:35\n00:07:10-00:07:42");
});
test("legacy labels are split without putting CTA or instructions in speech", () => {
  const p = legacyScriptParts("Visual hook:\nOld hook\n\nScript:\nExact speech.\n\nCTA:\nOld CTA\n\nCreative Instructions:\nCamera notes");
  expect(p.script).toBe("Exact speech.");
  expect(p.visualHook).toBe("Old hook");
  expect(p.visualCta).toBe("Old CTA");
  expect(p.creativeDirection).toBe("Camera notes");
});
test("explicit fields including clears override stale legacy prose", () => {
  const p = readContentScript({ "Script Text": "Visual hook:\nOld\n\nScript:\nSpeech", "Visual Hook": "", "visual cta": "New", "Creative Direction": "New direction" }, "Talking Video");
  expect(p.visualHook).toBe("");
  expect(p.visualCta).toBe("New");
  expect(p.script).toBe("Speech");
});
test("saving and reading BROLL never loses its independent overlay", () => {
  const f = contentScriptFields("BROLL", parts);
  expect(readContentScript(f, "BROLL").textOverlay).toBe(parts.textOverlay);
});
test("legacy plain BROLL moves to overlay without copying it into spoken script", () => {
  const p = readContentScript({ "Script Text": "One concise overlay" }, "BROLL");
  expect(p.script).toBe("");
  expect(p.textOverlay).toBe("One concise overlay");
});
test("ordinary spoken words containing label-like sentences are not parsed as metadata", () => {
  const speech = "Here is the real story.\n\nCTA: is just an abbreviation, not an instruction.";
  expect(readContentScript({ "Script Text": speech, "Visual Hook": "Real hook", "visual cta": "" }, "Talking Video").script).toBe(speech);
});
test("carousel and graphic copy stay in the shared design fields untouched", () => {
  const copy = "Slide 1\nTitle: Cover\n\nSlide 2\nBody: Argument";
  for (const format of ["Carousel", "Graphic"]) expect(readContentScript({ "Script Text": copy }, format).script).toBe(copy);
});