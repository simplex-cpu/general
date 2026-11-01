// Shared types for Script chat mode.

import type { Format, CarouselSlide, DesignSubtype } from "@/lib/simplex/types";

export type Topic = { title: string; rationale: string; number?: number; designSubtype?: DesignSubtype };

export type Hook = {
  topicIndex: number;
  topicTitle: string;
  visual: string;
  spoken?: string;
  /** Short label of the angle this hook takes, e.g. "Controversial". */
  angle?: string;
};

export type Caption = {
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
};

export type Assignee = { id: string; name: string; email?: string };

export type ProductionMeta = {
  inspo?: string;
  /** Original post a repurposed script came from. */
  inspoUrl?: string;
  filmingInstructions?: string;
  creativeInstructions?: string;
  /** Editor (videos) or Designer (graphics) — Airtable collaborator(s). */
  assignees?: Assignee[];
};

export type VideoSections = {
  kind: "video";
  visualHook: string;
  /** The hook the user approved (spoken hook) — what the card shows as "Hook". */
  spokenHook?: string;
  script: string;
  onScreenCta: string;
};

export type CarouselSections = {
  kind: "carousel";
  designSubtype?: DesignSubtype;
  slides: CarouselSlide[];
};

export type ScriptDoc = {
  format: Format;
  topic?: string;
  captions?: Caption;
  /** Talking Video: three visual hook options written with the captions; user picks one into visualHook. */
  visualHookOptions?: string[];
  /** B-roll only: three text-overlay angles; the user picks one before approving. */
  hookVariants?: string[];
  /** Index into hookVariants of the picked hook. */
  selectedHookVariant?: number;
} & ProductionMeta & (VideoSections | CarouselSections);


export type ChatPhase =
  | "askFormat"
  | "askDesignSubtype"
  | "askBrief"
  | "parsingBrief"
  | "loadingBrandContext"
  | "editBriefSummary"
  | "askCount"
  | "askTopicsMode"
  | "researching"
  | "approveTopics"
  | "generatingHooks"
  | "approveHooks"
  | "askCta"
  | "askSlides"
  | "askScriptType"
  | "writingSample"
  | "approveTone"
  | "writingBatch"
  | "offerCaptions"
  | "writingCaptions"
  | "offerPdf"
  | "pickVariation"
  | "addToPlanner"
  | "sessionDone"
  | "done";

export type { CarouselSlide };

/** Turn a free-form single-script idea into a short, readable topic label. */
export function deriveSingleScriptTopic(idea: string): string {
  const normalized = idea.replace(/\s+/g, " ").trim();
  if (!normalized) return "Untitled script";

  const firstThought = normalized.split(/(?<=[.!?])\s+/)[0] || normalized;
  const withoutPreamble = firstThought
    .replace(
      /^(?:i\s+(?:want|would like|need)\s+to\s+(?:talk|write|create|share)\s+about|this\s+(?:script|video|post)\s+is\s+about)\s+/i,
      "",
    )
    .replace(/^[\s:–—-]+|[\s.!?]+$/g, "")
    .trim();
  const words = (withoutPreamble || firstThought).split(/\s+/).filter(Boolean);
  return words.slice(0, 12).join(" ").slice(0, 100).trim() || "Untitled script";
}

/** Legacy parser kept for back-compat. */
export function parseTopicList(raw: string): Topic[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: Topic[] = [];
  for (const line of lines) {
    const m = line.match(/^(\d+)[\.\)]\s*(.+?)\s*[—–-]\s*(.+)$/);
    if (m) out.push({ number: Number(m[1]), title: m[2].trim(), rationale: m[3].trim() });
    else {
      const m2 = line.match(/^(\d+)[\.\)]\s*(.+)$/);
      if (m2) out.push({ number: Number(m2[1]), title: m2[2].trim(), rationale: "" });
    }
  }
  return out;
}

/** Parse ── HEADER ── sectioned script output (video format). */
export function parseVideoScriptOutput(raw: string): { visualHook: string; script: string; onScreenCta: string } {
  const re = /─{2,}\s*([^─\n]+?)\s*─{2,}/g;
  const matches: { label: string; index: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    matches.push({ label: m[1].trim().toLowerCase(), index: m.index, end: m.index + m[0].length });
  }
  const sections: Record<string, string> = {};
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].end;
    const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
    sections[matches[i].label] = raw.slice(start, end).trim();
  }
  const pick = (substr: string) => {
    const key = Object.keys(sections).find((k) => k.includes(substr));
    return key ? sections[key] : "";
  };
  return {
    visualHook: pick("visual hook"),
    script: pick("script"),
    onScreenCta: pick("cta"),
  };
}

/** Extract first JSON block from a model response, with repair for truncation. */
export function extractJSON<T = any>(raw: string): T | null {
  if (!raw) return null;
  let s = raw.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const tryParse = (str: string): T | null => {
    try { return JSON.parse(str) as T; } catch { return null; }
  };
  let parsed = tryParse(s);
  if (parsed) return parsed;
  // Scan for the first balanced JSON object/array, ignoring surrounding prose.
  const scanBalanced = (str: string): T | null => {
    for (let start = 0; start < str.length; start++) {
      const open = str[start];
      if (open !== "{" && open !== "[") continue;
      const close = open === "{" ? "}" : "]";
      let depth = 0;
      let inString = false;
      let escaped = false;
      for (let i = start; i < str.length; i++) {
        const ch = str[i];
        if (escaped) { escaped = false; continue; }
        if (ch === "\\") { escaped = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === open) depth++;
        else if (ch === close) {
          depth--;
          if (depth === 0) {
            const candidate = tryParse(str.slice(start, i + 1));
            if (candidate) return candidate;
            break;
          }
        }
      }
    }
    return null;
  };
  parsed = scanBalanced(s);
  if (parsed) return parsed;
  // Grab the largest brace/bracket span
  const first = s.search(/[\[{]/);
  const last = Math.max(s.lastIndexOf("]"), s.lastIndexOf("}"));
  if (first >= 0 && last > first) {
    parsed = tryParse(s.slice(first, last + 1));
    if (parsed) return parsed;
    s = s.slice(first);
  } else if (first >= 0) {
    s = s.slice(first);
  } else {
    return null;
  }
  // Repair truncated JSON: drop trailing incomplete token, balance brackets.
  let repaired = s.replace(/,\s*$/, "");
  // If we end mid-string, close it
  const quotes = (repaired.match(/(?<!\\)"/g) || []).length;
  if (quotes % 2 === 1) repaired += '"';
  // Balance } and ]
  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  for (const ch of repaired) {
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" && stack[stack.length - 1] === "{") stack.pop();
    else if (ch === "]" && stack[stack.length - 1] === "[") stack.pop();
  }
  // Drop trailing comma/partial key before closing
  repaired = repaired.replace(/,\s*("[^"]*"\s*:?\s*)?$/, "");
  while (stack.length) {
    const open = stack.pop();
    repaired += open === "{" ? "}" : "]";
  }
  return tryParse(repaired);
}

