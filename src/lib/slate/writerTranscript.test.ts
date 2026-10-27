// @ts-nocheck -- Bun provides this module to its test runner.
import { test, expect } from "bun:test";
import { savedTranscript, serializeSessionArray, createSessionSaveQueue } from "./writerTranscript";

test("History preserves bubbles, decisions, script variants and captions in conversation order", () => {
  const messages = [{ kind: "text", role: "ai", content: "Pick a format" }, { kind: "pills", pickedValue: "carousel", options: ["carousel"] }, { kind: "text", role: "user", content: "Carousel" }, { kind: "topicList", selected: [1], approved: true }, { kind: "script", script: { slides: [{ headline: "Original" }] }, captions: { instagram: "Saved caption" } }];
  expect(JSON.parse(serializeSessionArray(savedTranscript(messages)))).toEqual(messages);
});
test("only temporary typing and writing placeholders are excluded", () => {
  expect(savedTranscript([{ kind: "typing" }, { kind: "error" }, { kind: "scriptWriting" }, { kind: "script" }])).toEqual([{ kind: "error" }, { kind: "script" }]);
});
test("oversized History never silently becomes an empty conversation", () => {
  expect(() => serializeSessionArray([{ content: "x".repeat(100) }], 50)).toThrow("previous saved conversation has been preserved");
});
test("later transcript saves finish after earlier saves", async () => {
  const queue = createSessionSaveQueue();
  const order: number[] = [];
  await Promise.all([queue(async () => { await new Promise((r) => setTimeout(r, 10)); order.push(1); }), queue(async () => { order.push(2); })]);
  expect(order).toEqual([1, 2]);
});