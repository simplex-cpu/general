import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { buildBriefExtras, type BriefPayload } from "@/lib/slate/promptBuilder";
import { buildEnvelope } from "@/lib/slate/envelope";
import { extractJSON, type Caption, type ScriptDoc, type Topic } from "@/lib/slate/scriptChat";
import type { Prompts } from "@/lib/simplex/types";
import { DEFAULT_PROMPTS } from "@/lib/simplex/prompts";
import { requireAccessCode } from "@/lib/accessCode.server";
import { captionBatchSchema, validateCaptionBatch } from "@/lib/slate/captionBatch";
import { captionStructureInstruction } from "@/lib/slate/scriptCta";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

const MODEL = "claude-sonnet-4-5-20250929";
const CAPTION_CHUNK_SIZE = 4;

async function callClaude(userText: string, maxTokens = 5000) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not configured");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: userText }],
      tools: [
        {
          name: "deliver_captions",
          description:
            "Return exactly one complete four-platform caption object per supplied piece, in order.",
          input_schema: captionBatchSchema,
        },
      ],
      tool_choice: { type: "tool", name: "deliver_captions" },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Anthropic ${res.status}`);
  if (data.stop_reason === "max_tokens")
    throw new Error("The caption response was incomplete. Your script has been preserved.");
  const delivered = data.content?.find(
    (block: { type: string; name?: string }) =>
      block.type === "tool_use" && block.name === "deliver_captions",
  );
  if (delivered?.input) return JSON.stringify(delivered.input);
  return (data.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");
}

function summarizeScript(s: ScriptDoc, rationale?: string): string {
  const rationaleLine = rationale ? `\nTopic research rationale: ${rationale}` : "";
  if (s.kind === "video") {
    const needsVisualHook = s.format === "talkingVideo";
    return `Topic: ${s.topic || ""}${rationaleLine}\nFormat: ${s.format}${
      needsVisualHook
        ? `\nNEEDS VISUAL HOOK: yes (write the on-screen text overlay for this piece)`
        : `\nVisual hook: ${s.visualHook}`
    }\nScript:\n${s.script}`;
  }
  const slides = s.slides
    .map((sl) => `Slide ${sl.position} [${sl.role}] ${sl.headline}${sl.body ? ": " + sl.body : ""}`)
    .join("\n");
  return `Topic: ${s.topic || ""}${rationaleLine}\nCarousel slides:\n${slides}`;
}

function captionPromptSet(input: Partial<Prompts> | undefined): Prompts {
  return { ...DEFAULT_PROMPTS, ...(input || {}) } as Prompts;
}

async function writeCaptionChunk({
  chunk,
  offset,
  topics,
  brandDetails,
  prompts,
  cta,
}: {
  chunk: ScriptDoc[];
  offset: number;
  topics: Topic[];
  brandDetails: string;
  prompts: Prompts;
  cta?: string;
}): Promise<{ captions: Caption[]; visualHooks: string[]; visualHookOptions: string[][] }> {
  const captionCta = chunk.every(
    (script) => script.format === "broll" || script.format === "graphic",
  )
    ? cta
    : "";
  const rationaleByTitle = new Map<string, string>();
  topics.forEach((t) => {
    if (t?.title) rationaleByTitle.set(t.title.trim().toLowerCase(), t.rationale || "");
  });
  const pieces = chunk
    .map((s, localIndex) => {
      const rationale = s.topic ? rationaleByTitle.get(s.topic.trim().toLowerCase()) : undefined;
      return `Piece ${localIndex + 1} (global index ${offset + localIndex + 1})\n${summarizeScript(s, rationale)}`;
    })
    .join("\n\n---\n\n");
  const batchPrompts: Prompts = {
    ...prompts,
    outputCaptions: `Return ONLY raw JSON, no markdown fences, no preamble:

{
  "captions": [
    { "instagram": "string", "facebook": "string", "tiktok": "string", "youtube": "string", "visualHook": "string", "visualHookOptions": ["string", "string", "string"] }
  ]
}

Return exactly ${chunk.length} caption object${chunk.length === 1 ? "" : "s"}, in the same order as the pieces provided. All four platforms are required for every piece. "visualHook" is required only for pieces marked NEEDS VISUAL HOOK; leave it as an empty string for every other piece. "visualHookOptions" must contain exactly 3 distinct visual hook options (different angles) for pieces marked NEEDS VISUAL HOOK, and be an empty array for every other piece.`,
  };
  const userMsg = buildEnvelope("captions", batchPrompts, {
    brandDetails,
    task:
      `Write captions for every piece below. Return one caption object per piece, in the same order.` +
      (captionCta && captionCta.trim() ? `\n\nCTA INTENT FOR THIS BATCH: ${captionCta.trim()}` : "") +
      `\n\nVISUAL HOOK (only for pieces marked NEEDS VISUAL HOOK): write 3 distinct on-screen text overlay options (visualHookOptions) that sell the finished script, each from a different angle; put the strongest one in visualHook as well. A few words, punchy and visual, drawn from the strongest promise the approved script actually delivers. It must match the promise the caption makes. Never invent a claim the script does not pay off, never copy the whole opening line, no quotation marks, no emojis, no hashtags.` +
      `\n\n${pieces}`,
  }) + `\n\n${captionStructureInstruction(captionCta)}`;
  const budget = Math.min(16000, 4000 + chunk.length * 3000);
  let parsed: { captions: ReturnType<typeof validateCaptionBatch> };
  try {
    const text = await callClaude(userMsg, budget);
    parsed = { captions: validateCaptionBatch(extractJSON(text), chunk.length) };
  } catch (first) {
    console.warn("/api/captions retrying once:", (first as Error)?.message);
    const text = await callClaude(userMsg, 16000);
    parsed = { captions: validateCaptionBatch(extractJSON(text), chunk.length) };
  }
  return {
    captions: parsed.captions.map((caption) => ({
      instagram: String(caption?.instagram || ""),
      facebook: String(caption?.facebook || ""),
      tiktok: String(caption?.tiktok || ""),
      youtube: String(caption?.youtube || ""),
    })),
    visualHooks: parsed.captions.map((caption) =>
      String(caption?.visualHook || "")
        .replace(/^["'“”]+|["'“”]+$/g, "")
        .trim(),
    ),
    visualHookOptions: parsed.captions.map((caption, i) =>
      chunk[i]?.format === "talkingVideo" ? caption.visualHookOptions : [],
    ),
  };
}

export const Route = createFileRoute("/api/captions")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { scripts, topics, brief, prompts, cta, accessCode } = body as {
            scripts: ScriptDoc[];
            topics?: Topic[];
            brief: BriefPayload;
            prompts?: Partial<Prompts>;
            cta?: string;
            accessCode?: string;
          };
          const auth = await requireAccessCode(accessCode);
          if (!auth.ok) return auth.response;
          if (!Array.isArray(scripts) || scripts.length === 0)
            return json({ error: "No scripts provided" }, 400);
          const brandDetails = buildBriefExtras(brief, {
            slice: "scripting",
            includeRecentPosts: false,
          });
          const mergedPrompts = captionPromptSet(prompts);
          const chunks = [] as ScriptDoc[][];
          for (let i = 0; i < scripts.length; i += CAPTION_CHUNK_SIZE)
            chunks.push(scripts.slice(i, i + CAPTION_CHUNK_SIZE));
          const captionGroups = await Promise.all(
            chunks.map((chunk, chunkIndex) =>
              writeCaptionChunk({
                chunk,
                offset: chunkIndex * CAPTION_CHUNK_SIZE,
                topics: topics || [],
                brandDetails,
                prompts: mergedPrompts,
                cta,
              }),
            ),
          );
          const captions = captionGroups.flatMap((group) => group.captions);
          const visualHooks = captionGroups.flatMap((group) => group.visualHooks);
          const visualHookOptions = captionGroups.flatMap((group) => group.visualHookOptions);
          return json({ captions, visualHooks, visualHookOptions });
        } catch (e: any) {
          console.error("/api/captions", e);
          return json({ error: e?.message || String(e) }, 500);
        }
      },
    },
  },
} as any);
