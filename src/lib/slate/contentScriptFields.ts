import { normalizeTimestamps, splitLegacySourceNotes } from "./longFormClipper";
import { parseVideoScriptOutput } from "./scriptChat";

/** Exact Client Content field contract. Only legacy reads interpret labeled prose. */
export const CONTENT_SCRIPT_FIELDS = {
  script: "Script Text", visualHook: "Visual Hook", textOverlay: "Text overlay",
  visualCta: "visual cta", timestamps: "Timestamps", creativeDirection: "Creative Direction",
} as const;
export type ContentScript = { script: string; visualHook: string; textOverlay: string; visualCta: string; timestamps: string; creativeDirection: string };
const text = (v: unknown) => typeof v === "string" ? v.trim() : "";
export const isBroll = (format: string) => /broll|b-roll|story/i.test(format);
export const isTalking = (format: string) => /talking/i.test(format);

export function legacyScriptParts(raw: string) {
  if (!/^(?:\s*(?:visual hook|hook|text overlay|script|copy|visual cta|cta|on-screen cta)\s*:|\s*─{2,})/i.test(raw) && !/\n(?:Creative Instructions|Source notes):\s*\n/.test(raw)) {
    return { script: raw.trim(), visualHook: "", textOverlay: "", visualCta: "", timestamps: "", creativeDirection: "" };
  }
  const oldNotes = splitLegacySourceNotes(raw);
  const clean = oldNotes?.copy ?? raw;
  const sections: Record<string, string> = {};
  const re = /^[ \t]*(visual hook|hook|text overlay|script|copy|visual cta|cta|on-screen cta|creative instructions|creative direction|timestamps|source notes)[ \t]*:[ \t]*(?:\n)?/gim;
  const matches = [...clean.matchAll(re)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const start = (m.index ?? 0) + m[0].length;
    sections[m[1].toLowerCase()] = clean.slice(start, matches[i + 1]?.index ?? clean.length).trim();
  }
  const framed = parseVideoScriptOutput(clean);
  const prefix = matches.length ? clean.slice(0, matches[0].index).trim() : clean.trim();
  return {
    script: sections.script ?? sections.copy ?? (framed.script || prefix),
    visualHook: sections["visual hook"] ?? sections.hook ?? framed.visualHook,
    textOverlay: sections["text overlay"] ?? "",
    visualCta: sections["visual cta"] ?? sections["on-screen cta"] ?? sections.cta ?? framed.onScreenCta,
    timestamps: normalizeTimestamps(sections.timestamps || oldNotes?.timestamps || ""),
    creativeDirection: sections["creative direction"] ?? sections["creative instructions"] ?? oldNotes?.direction ?? "",
  };
}

export function readContentScript(fields: Record<string, unknown>, format: string): ContentScript {
  const legacy = legacyScriptParts(text(fields[CONTENT_SCRIPT_FIELDS.script]));
  const get = (key: keyof ContentScript, fallback: string) => Object.hasOwn(fields, CONTENT_SCRIPT_FIELDS[key]) ? text(fields[CONTENT_SCRIPT_FIELDS[key]]) : fallback;
  // Only legacy labeled documents are split; ordinary spoken prose is preserved.
  return {
    script: isBroll(format) ? "" : isTalking(format) ? legacy.script : text(fields[CONTENT_SCRIPT_FIELDS.script]),
    visualHook: get("visualHook", legacy.visualHook),
    textOverlay: get("textOverlay", legacy.textOverlay || (isBroll(format) ? legacy.script : "")),
    visualCta: get("visualCta", legacy.visualCta || (isTalking(format) ? text(fields["CTA Copy"]) : "")),
    timestamps: normalizeTimestamps(get("timestamps", legacy.timestamps)),
    creativeDirection: get("creativeDirection", legacy.creativeDirection),
  };
}

export function contentScriptFields(format: string, parts: Partial<ContentScript>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(CONTENT_SCRIPT_FIELDS) as (keyof ContentScript)[]) {
    if (parts[key] !== undefined) out[CONTENT_SCRIPT_FIELDS[key]] = key === "timestamps" ? normalizeTimestamps(parts[key] || "") : text(parts[key]);
  }
  if (isBroll(format)) {
    out[CONTENT_SCRIPT_FIELDS.script] = "";
    out[CONTENT_SCRIPT_FIELDS.visualHook] = "";
    out[CONTENT_SCRIPT_FIELDS.visualCta] = "";
  } else if (isTalking(format)) out[CONTENT_SCRIPT_FIELDS.textOverlay] = "";
  return out;
}

/** Existing automation contract: spoken words use Source speech, never on-screen overlay. */
export function editScriptFields(format: string, parts: ContentScript): Record<string, string> {
  return {
    "Visual Hook": isTalking(format) ? parts.visualHook : "",
    "Text Overlay": isBroll(format) ? parts.textOverlay : "",
    CTA: isTalking(format) ? parts.visualCta : "",
    "Source speech": isTalking(format) ? parts.script : "",
    Timestamps: normalizeTimestamps(parts.timestamps),
    "Creative Direction": parts.creativeDirection,
  };
}