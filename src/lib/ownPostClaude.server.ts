import { AI_MODELS } from "./aiModels";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayResponseHeaders } from "./lovableAiRunId.server";

export const OWN_POST_MODEL = AI_MODELS.ownPostRepurpose;
export class OwnPostAIError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export function ownPostClaudeBody(system: string, user: string, schema: Record<string, unknown>) {
  return { model: OWN_POST_MODEL, max_tokens: 32000, stream: true,
    thinking: { type: "adaptive" }, output_config: { effort: "medium", format: { type: "json_schema", schema } },
    system, messages: [{ role: "user", content: user }] };
}

/** Consume native Messages through message_stop; metadata/thinking never become script copy. */
export async function consumeOwnPostClaudeStream(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", output = "", finished = false, stop = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      buffer = buffer.replace(/\r\n/g, "\n");
      if (done && buffer.trim()) buffer += "\n\n";
      const frames = buffer.split("\n\n");
      buffer = frames.pop() || "";
      for (const frame of frames) {
        const data = frame.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("\n");
        if (!data || data === "[DONE]") continue;
        const event = JSON.parse(data);
        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") output += event.delta.text || "";
        if (event.type === "message_delta") stop = event.delta?.stop_reason || stop;
        if (event.type === "error") throw new OwnPostAIError(event.error?.message || "AI generation failed.", event.error?.type === "permission_error" ? 403 : 502);
        if (stop === "refusal") throw new OwnPostAIError("The AI declined this request. Generation has stopped.", 422);
        if (event.type === "message_stop") finished = true;
      }
      if (done || finished) break;
    }
    if (!finished) throw new OwnPostAIError("The AI response was interrupted. No script was saved.", 502);
    if (!output.trim()) throw new OwnPostAIError("The AI returned no script. This request has stopped.", 422);
    return output.trim();
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

// Called only after access-code and owned-brand checks in post-repurpose.
export async function generateOwnPostClaude(system: string, user: string, schema: Record<string, unknown>, request: Request) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: block, error: readError } = await supabaseAdmin.from("own_post_ai_access_blocks").select("reason").eq("model", OWN_POST_MODEL).maybeSingle();
  if (readError) throw new OwnPostAIError("Could not check AI access. Please try again later.", 503);
  if (block) throw new OwnPostAIError(block.reason, 403);
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new OwnPostAIError("AI is not configured.", 401);
  const gateway = createLovableAiGatewayRunIdFetch(request.headers.get("X-Lovable-AIG-Run-ID") || undefined);
  const persistDenial = async (reason: string) => {
    const { error } = await supabaseAdmin.from("own_post_ai_access_blocks").upsert({ model: OWN_POST_MODEL, reason });
    if (error) console.error("Could not persist own-post AI access block", error.code);
  };
  try {
    const response = await gateway.fetch("https://ai.gateway.lovable.dev/v1/messages", {
      method: "POST", signal: request.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify(ownPostClaudeBody(system, user, schema)),
    });
    if (!response.ok) {
      const detail = await response.text();
      let message = "The AI request failed.";
      let type = "";
      try { const data = JSON.parse(detail); message = data.message || data.error?.message || message; type = data.type || data.error?.type || ""; } catch { /* never expose an upstream HTML response */ }
      // Only provider access denials persist; refusals/region/consent/credit blocks end this request.
      if (response.status === 403 && !["provider_not_available_in_region", "model_requires_retention_consent", "model_vendor_not_enabled", "credit_limit_reached", "ai_disabled"].includes(type)) await persistDenial(message);
      throw new OwnPostAIError(message, response.status);
    }
    if (!response.body) throw new OwnPostAIError("The AI response was empty.", 502);
    let text: string;
    try { text = await consumeOwnPostClaudeStream(response.body); }
    catch (error) {
      if (error instanceof OwnPostAIError && error.status === 403) await persistDenial(error.message);
      throw error;
    }
    return { text, headers: getLovableAiGatewayResponseHeaders(response.headers) };
  } catch (error) {
    if (request.signal.aborted) throw new OwnPostAIError("Generation stopped.", 499);
    throw error;
  }
}