export class LovableTextError extends Error {
  constructor(message: string, public status: number, public terminal = false) { super(message); }
}
export async function generateLovableText(input: string, effort: "low" | "medium" = "low", schema?: Record<string, unknown>): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      input,
      stream: true,
      store: false,
      reasoning: { effort, summary: "auto" },
      include: ["reasoning.encrypted_content"],
      ...(schema ? { text: { format: { type: "json_schema", name: "viral_angles", strict: true, schema } } } : {}),
    }),
  });
  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    let message = detail;
    try { const d = JSON.parse(detail); message = d.message || d.error?.message || detail; } catch { /* preserve safe upstream text */ }
    throw new LovableTextError(message || `AI gateway ${response.status}`, response.status, [401,402,403,404].includes(response.status));
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6);
        if (raw === "[DONE]") continue;
        const data = JSON.parse(raw);
        if (data.type === "response.output_text.delta") output += String(data.delta || "");
        if (data.type === 'response.refusal.delta' || data.type === 'response.refusal.done') throw new LovableTextError(data.refusal || data.delta || 'The provider declined this request.', 403, true);
        if (data.type === 'response.failed' || data.type === "error") throw new LovableTextError(data.response?.error?.message || data.error?.message || "AI generation failed", data.status || data.error?.status || 502, true);
      }
    }
    if (done) break;
  }
  if (!output.trim()) throw new LovableTextError("AI returned no text. This request has stopped.", 403, true);
  return output;
}