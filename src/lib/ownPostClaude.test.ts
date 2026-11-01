// @ts-ignore Bun supplies its test runner at runtime.
import { expect, test } from "bun:test";
import { consumeOwnPostClaudeStream, ownPostClaudeBody } from "./ownPostClaude.server";

const event = (value: unknown) => `data: ${JSON.stringify(value)}\n\n`;
function stream(parts: string[]) { return new ReadableStream<Uint8Array>({ start(c) { for (const part of parts) c.enqueue(new TextEncoder().encode(part)); c.close(); } }); }
test("own-post uses Opus 5.5 native adaptive thinking with medium effort", () => {
  const body = ownPostClaudeBody("system", "user", { type: "object" });
  expect(body.model).toBe("anthropic/claude-opus-5-5");
  expect(body.thinking).toEqual({ type: "adaptive" });
  expect(body.output_config.effort).toBe("medium");
  expect(body.stream).toBe(true);
});
test("metadata, pings, empty thinking and split text frames do not stall", async () => {
  const text = event({ type: "content_block_delta", delta: { type: "text_delta", text: '{"script":"Short hook"}' } });
  expect(await consumeOwnPostClaudeStream(stream([event({ type: "message_start" }), event({ type: "ping" }), event({ type: "content_block_delta", delta: { type: "thinking_delta", thinking: "" } }), text.slice(0, 18), text.slice(18), event({ type: "message_delta", delta: { stop_reason: "end_turn" } }), event({ type: "message_stop" })]))).toBe('{"script":"Short hook"}');
});
test("empty HTTP-success refusal stops without retry", async () => {
  await expect(consumeOwnPostClaudeStream(stream([event({ type: "message_delta", delta: { stop_reason: "refusal" } }), event({ type: "message_stop" })]))).rejects.toMatchObject({ status: 422 });
});
test("streamed permission denial preserves its reason and status", async () => {
  await expect(consumeOwnPostClaudeStream(stream([event({ type: "error", error: { type: "permission_error", message: "Access denied" } })]))).rejects.toMatchObject({ status: 403, message: "Access denied" });
});