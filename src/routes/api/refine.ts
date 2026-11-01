import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { AI_MODELS } from "@/lib/aiModels";
import { loadLivePrompts } from "@/lib/promptStore.server";
import { buildBriefExtras, type BriefPayload } from "@/lib/slate/promptBuilder";
import {
  REFINE_LIMITS,
  buildRefinePrompt,
  cleanRefined,
  refineInstruction,
  type CaptionPlatform,
  type RefinePiece,
} from "@/lib/slate/refine";
import type { Format } from "@/lib/simplex/types";

// Rewrites one piece of a post from a short instruction ("Shorter", "More like
// me" or the user's own words). Nothing is saved here; the screen shows the
// rewrite and saves it the way it saves a manual edit.

const PIECES: RefinePiece[] = ["hook", "script", "slides", "cta", "caption"];
const FORMATS: Format[] = ["talkingVideo", "broll", "carousel", "graphic"];
const PLATFORMS: CaptionPlatform[] = ["instagram", "facebook", "tiktok", "youtube"];

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

async function callClaude(userText: string) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not configured");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "server-side-fallback-2026-07-01",
    },
    body: JSON.stringify({
      model: AI_MODELS.refine,
      max_tokens: 8000,
      output_config: { effort: "low" },
      fallbacks: "default",
      messages: [{ role: "user", content: userText }],
    }),
  });
  const data: any = await res.json();
  if (!res.ok) {
    console.error("[refine] anthropic error", res.status, JSON.stringify(data).slice(0, 500));
    throw new Error(data?.error?.message || `Anthropic ${res.status}`);
  }
  if (data.stop_reason === "refusal") return { refused: true, text: "" };
  const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
  if (data.stop_reason === "max_tokens") console.warn("[refine] output truncated at max_tokens");
  return { refused: false, text };
}

export const Route = createFileRoute("/api/refine")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { accessCode, piece, format, platform, text, preset, instruction, brief } = body as {
            accessCode?: string;
            piece?: RefinePiece;
            format?: Format;
            platform?: CaptionPlatform;
            text?: string;
            preset?: string;
            instruction?: string;
            brief?: BriefPayload;
          };
          const auth = await requireAccessCode(accessCode);
          if (!auth.ok) return auth.response;
          if (!piece || !PIECES.includes(piece)) return json({ error: "Say which part to refine." }, 400);
          const fmt: Format = format && FORMATS.includes(format) ? format : "talkingVideo";
          const plat = platform && PLATFORMS.includes(platform) ? platform : undefined;
          const original = String(text || "").trim();
          if (!original) return json({ error: "There's nothing to refine yet." }, 400);
          if (original.length > REFINE_LIMITS.text) return json({ error: "This piece is too long to refine in one go." }, 400);
          const change = refineInstruction({ preset, instruction });
          if (!change) return json({ error: "Pick a change or type what to change." }, 400);

          const prompts = await loadLivePrompts();
          const brandDetails = buildBriefExtras(brief, { slice: "scripting", includeRecentPosts: false });
          const prompt = buildRefinePrompt({ piece, format: fmt, platform: plat, text: original, instruction: change, brandDetails, prompts });
          const result = await callClaude(prompt);
          if (result.refused) return json({ error: "This change couldn't be made. Try different wording." }, 422);
          const refined = cleanRefined(result.text);
          if (!refined) return json({ error: "The rewrite came back empty. Please try again." }, 502);
          return json({ text: refined });
        } catch (e: any) {
          console.error("[refine]", e);
          return json({ error: e?.message || "Refine failed" }, 500);
        }
      },
    },
  },
});
