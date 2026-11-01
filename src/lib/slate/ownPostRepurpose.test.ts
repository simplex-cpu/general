// @ts-ignore Bun supplies its test runner at runtime.
import { describe, expect, test } from "bun:test";
import { assembleOwnPostPrompt, ownPostOutputSchema, parseOwnPostOutput } from "./ownPostRepurpose";
import { readPostCopy } from "./postCopy";

const source = readPostCopy({ Transcript: "You hired interns to scale a $10 million company using social media. Experienced directors handle content creation, data analysis and testing. Posting alone is admin work, not business growth.", "Visual Hook": "Who owns your brand's public voice?", Caption: "Hiring is a growth decision. #socialmedia" });
describe("own-post conversion contract", () => {
  test("accepts exactly 20 overlay words", () => {
    const script = Array.from({ length: 20 }, (_, i) => `word${i}`).join(" ");
    const doc = parseOwnPostOutput(JSON.stringify({ script, caption: source.transcript }), "broll", "reformat", source, "Hiring");
    expect(doc.kind === "video" && doc.script).toBe(script);
    expect(doc.captions?.instagram).toBe(source.transcript);
  });
  test("rejects a 21-word overlay rather than silently truncating", () => {
    expect(() => parseOwnPostOutput(JSON.stringify({ script: Array(21).fill("word").join(" "), caption: "Details" }), "broll", "reformat", source, "Hiring")).toThrow("exceeded 20 words");
  });
  test("B-roll has only script and caption, rejecting a competing visual hook", () => {
    expect(ownPostOutputSchema("broll", "reformat").required).toEqual(["caption", "script"]);
    expect(() => parseOwnPostOutput(JSON.stringify({ script: "Hiring for posting is not hiring for growth", caption: "Details", visualHook: "Another hook" }), "broll", "reformat", source, "Hiring")).toThrow();
  });
  test("requires a finished caption, never fallback to the old one", () => {
    expect(() => parseOwnPostOutput(JSON.stringify({ script: "Hiring for growth", caption: "" }), "broll", "reformat", source, "Hiring")).toThrow();
  });
  test("assembled conversion explicitly routes transcript detail to caption", () => {
    const prompt = assembleOwnPostPrompt({ target: "broll", mode: "reformat", sourceFormat: "Talking Video", title: "Hiring", topic: "Hiring", original: source, brand: {} });
    expect(prompt.user).toContain(`Transcript:\n${source.transcript}`);
    expect(prompt.system).toContain("maximum 20 words total");
    expect(prompt.system).toContain("Caption delivers the supporting points, examples and payoff");
    expect(prompt.system).not.toContain("opening line EXACTLY");
    expect(prompt.system).not.toContain("Do not add, drop or reorder points");
  });
  test("same-format talking video keeps its full transcript", () => {
    const doc = parseOwnPostOutput(JSON.stringify({ visualHook: "Who handles your brand's public voice?", caption: "A hiring decision. #socialmedia" }), "talkingVideo", "visual", source, "Hiring");
    expect(doc.kind === "video" && doc.script).toBe(source.transcript);
  });
});