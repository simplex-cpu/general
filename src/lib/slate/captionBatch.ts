import type { Caption, ScriptDoc } from "./scriptChat";

export const captionBatchSchema = {
  type: "object",
  additionalProperties: false,
  required: ["captions"],
  properties: {
    captions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["instagram", "facebook", "tiktok", "youtube", "visualHook"],
        properties: {
          ...Object.fromEntries(
            ["instagram", "facebook", "tiktok", "youtube", "visualHook"].map((key) => [
              key,
              { type: "string" },
            ]),
          ),
          visualHookOptions: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

/** Accepts the common shapes models return: stringified arrays, a bare array, or one bare object. */
export function normalizeCaptionList(value: unknown): unknown[] | null {
  let v: any = value;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      return null;
    }
  }
  if (Array.isArray(v)) return v;
  if (!v || typeof v !== "object") return null;
  let list: any = v.captions;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      return null;
    }
  }
  if (Array.isArray(list)) return list;
  if (list && typeof list === "object") return [list];
  if (typeof v.instagram === "string") return [v];
  return null;
}

export function validateCaptionBatch(
  value: unknown,
  count: number,
): (Caption & { visualHook: string; visualHookOptions: string[] })[] {
  const list = normalizeCaptionList(value);
  if (!list || list.length < count) {
    throw new Error(
      "Caption generation returned an incomplete batch. Your script has been preserved.",
    );
  }
  return list.slice(0, count).map((caption: unknown) => {
    if (!caption || typeof caption !== "object")
      throw new Error("Caption generation returned an invalid caption.");
    const fields = caption as Record<string, unknown>;
    for (const platform of ["instagram", "facebook", "tiktok", "youtube"]) {
      if (typeof fields[platform] !== "string" || !String(fields[platform]).trim()) {
        throw new Error(
          `Caption generation did not return the ${platform} caption. Your script has been preserved.`,
        );
      }
    }
    return {
      instagram: String(fields.instagram),
      facebook: String(fields.facebook),
      tiktok: String(fields.tiktok),
      youtube: String(fields.youtube),
      visualHook: String(fields.visualHook || ""),
      visualHookOptions: cleanHookOptions(fields.visualHookOptions, fields.visualHook),
    };
  });
}

/** Up to three distinct, non-empty visual hook options (falls back to the single hook). */
export function cleanHookOptions(options: unknown, fallback?: unknown): string[] {
  const raw = Array.isArray(options) ? options : [];
  const out: string[] = [];
  for (const o of [...raw, fallback]) {
    const v = String(o ?? "").replace(/^["'“”]+|["'“”]+$/g, "").trim();
    if (v && !out.some((x) => x.toLowerCase() === v.toLowerCase())) out.push(v);
    if (out.length === 3) break;
  }
  return out;
}

/** A Talking Video with hook options cannot go to the planner until one is chosen. */
export function needsVisualHookChoice(doc: ScriptDoc | undefined): boolean {
  if (!doc || doc.kind !== "video" || doc.format !== "talkingVideo") return false;
  return !!doc.visualHookOptions?.length && !doc.visualHook?.trim();
}
