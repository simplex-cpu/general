// Shared helpers for divide-scripts pipeline.
// Used by /api/divide-scripts/prepare and /api/divide-scripts/section.
import { AI_MODELS } from "./aiModels";

// ---------- Google Doc → markdown-ish text (tables aware) ----------
export function gdocElementsToText(elements: any[]): string {
  let out = "";
  for (const e of elements || []) {
    if (e?.textRun?.content) {
      const t: string = e.textRun.content;
      const st = e.textRun.textStyle || {};
      if (st.bold && t.trim()) out += `**${t.replace(/\n$/, "")}**${t.endsWith("\n") ? "\n" : ""}`;
      else out += t;
    } else if (e?.inlineObjectElement) {
      out += "[image]";
    }
  }
  return out;
}

export function gdocParagraphToText(para: any): string {
  const style = para?.paragraphStyle?.namedStyleType as string | undefined;
  const text = gdocElementsToText(para?.elements || []);
  if (!text.trim()) return text;
  if (style?.startsWith("HEADING_")) {
    const level = parseInt(style.slice("HEADING_".length), 10) || 2;
    return `${"#".repeat(Math.min(level, 6))} ${text}`;
  }
  return text;
}

export function gdocStructuralElementsToText(elements: any[]): string {
  const parts: string[] = [];
  for (const el of elements || []) {
    if (el?.paragraph) {
      parts.push(gdocParagraphToText(el.paragraph));
    } else if (el?.table) {
      const rows: string[] = [];
      for (const row of el.table.tableRows || []) {
        const cells: string[] = [];
        for (const cell of row.tableCells || []) {
          const cellText = gdocStructuralElementsToText(cell.content || [])
            .trim()
            .replace(/\s*\n\s*/g, " / ");
          cells.push(cellText);
        }
        rows.push(`| ${cells.join(" | ")} |`);
      }
      if (rows.length) parts.push(rows.join("\n") + "\n");
    } else if (el?.sectionBreak) {
      parts.push("");
    }
  }
  return parts.join("");
}

// ---------- Section splitter ----------
// Splits a document text into sections, one per "Script NN of MM" header.
export function splitIntoSections(text: string): string[] {
  // Match the "Script NN of MM" header anywhere — many PDF extractors strip
  // line breaks and return the doc as one big line, so we cannot rely on ^.
  // The phrase is distinctive enough to avoid false positives.
  const headerRe = /\**\s*\bScript\s*#?\s*0*\d+\s*(?:of|\/)\s*0*\d+\b/gi;
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(text)) !== null) {
    // Anchor to the start of "Script" itself, skipping leading markdown noise we matched.
    const idx = text.indexOf("Script", m.index);
    starts.push(idx === -1 ? m.index : idx);
  }
  if (starts.length === 0) return [];
  const sections: string[] = [];
  for (let i = 0; i < starts.length; i++) {
    sections.push(text.slice(starts[i], starts[i + 1] ?? text.length).trim());
  }
  return sections;
}

// ---------- "Format: <label>" declaration reader ----------
// Documents produced by Risevoice print a "Format: <label>" line directly under
// each "Script NN of MM" heading. Reading it lets the pipeline trust the document
// instead of the operator's manual pick.
export type SectionFormatKey =
  | "talkingVideo"
  | "broll"
  | "carousel"
  | "graphic"
  | "reactionRepurpose"
  | "trend"
  | "podcastClips";

const FORMAT_LABEL_PATTERNS: Array<[RegExp, SectionFormatKey]> = [
  [/^b\s*[-‑–—_]?\s*roll$/i, "broll"],
  [/^talking\s*(video|point|head)$/i, "talkingVideo"],
  [/^carousel$/i, "carousel"],
  [/^graphics?$/i, "graphic"],
  [/^reaction\s*(?:&|and|\+)\s*repurpose$/i, "reactionRepurpose"],
  [/^trend$/i, "trend"],
  [/^podcast\s*clips?$/i, "podcastClips"],
];

// Tolerant of markdown bold, a colon or a line break after the word "Format".
const FORMAT_LINE_SOURCE =
  "\\*{0,2}\\s*Format\\*{0,2}\\s*[:：]?[ \\t]*\\n?[ \\t]*\\*{0,2}([^\\n*|]{2,40})";

function formatLabelToKey(raw: string): SectionFormatKey | null {
  const label = String(raw || "")
    .replace(/\*\*/g, "")
    .replace(/[.,;:·|]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!label) return null;
  for (const [re, key] of FORMAT_LABEL_PATTERNS) if (re.test(label)) return key;
  return null;
}

/** Read the format a section declares about itself, or null when it declares none. */
export function readSectionFormat(section: string): SectionFormatKey | null {
  const text = String(section || "").replace(/\r\n/g, "\n");
  const re = new RegExp(FORMAT_LINE_SOURCE, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const key = formatLabelToKey(m[1]);
    if (key) return key;
  }
  return null;
}

/** Drop the "Format: <label>" declaration so it never leaks into an extracted field. */
function removeFormatDeclaration(text: string): string {
  const re = new RegExp(FORMAT_LINE_SOURCE, "gi");
  return String(text || "").replace(re, (full, label: string) =>
    formatLabelToKey(label) ? "" : full,
  );
}

type ExtractedScript = {
  topic: string;
  visualHook: string;
  script: string;
  inspo: string;
  filmingInstructions: string;
  creativeInstructions: string;
  onScreenCta: string;
  captions: { instagram: string; facebook: string; tiktok: string; youtube: string };
  slides: Array<{ position: number; role: string; headline: string; body: string }>;
};

type FieldName =
  | "title"
  | "textOverlay"
  | "visualHook"
  | "script"
  | "inspo"
  | "filmingInstructions"
  | "creativeInstructions"
  | "onScreenCta"
  | "captions"
  | "captionInstagram"
  | "captionFacebook"
  | "captionTiktok"
  | "captionYoutube";

const emptyCaptions = () => ({ instagram: "", facebook: "", tiktok: "", youtube: "" });

function stripScriptHeader(section: string): string {
  const withoutHeader = String(section || "")
    .replace(/\r\n/g, "\n")
    .replace(/^\s*\**\s*Script\s*#?\s*0*\d+\s*(?:of|\/)\s*0*\d+\b\**\s*/i, "");
  return removeFormatDeclaration(withoutHeader).trim();
}

function cleanFieldLabel(raw: string): string {
  return raw
    .trim()
    .replace(/^\|+|\|+$/g, "")
    .replace(/^#{1,6}\s*/, "")
    .replace(/^[-*•]\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/[─—–]+/g, " ")
    .replace(/[·|/]+/g, " ")
    .replace(/[():：]+$/g, "")
    .replace(/[–—-]?\s*0\s*3\s*s$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function canonicalField(label: string): FieldName | null {
  const l = cleanFieldLabel(label);
  if (!l) return null;
  if (
    ["title", "topic", "topic title", "script title", "post title", "event post name"].includes(l)
  )
    return "title";
  if (
    [
      "text overlay",
      "broll text overlay",
      "b roll text overlay",
      "b-roll text overlay",
      "overlay",
      "broll overlay",
    ].includes(l)
  )
    return "textOverlay";
  if (l === "visual hook" || l.startsWith("visual hook ")) return "visualHook";
  if (["script", "script body", "spoken script", "slides copy", "copy"].includes(l))
    return "script";
  if (["inspo", "inspiration", "reference", "references"].includes(l)) return "inspo";
  if (
    l.includes("filming") &&
    (l.includes("instruction") || l.includes("special") || l.includes("guideline"))
  )
    return "filmingInstructions";
  if (["filming instructions", "filming guidelines", "special instructions"].includes(l))
    return "filmingInstructions";
  if (
    [
      "creative instructions",
      "creative instruction",
      "design brief",
      "editing brief",
      "creative brief",
    ].includes(l)
  )
    return "creativeInstructions";
  if (["on screen cta", "onscreen cta", "on-screen cta", "cta", "call to action"].includes(l))
    return "onScreenCta";
  if (["captions", "caption", "social captions"].includes(l)) return "captions";
  if (["instagram", "ig", "ig captions", "instagram captions"].includes(l))
    return "captionInstagram";
  if (["facebook", "fb", "fb captions", "facebook captions"].includes(l)) return "captionFacebook";
  if (["tiktok", "tik tok", "tiktok captions", "tik tok captions"].includes(l))
    return "captionTiktok";
  if (["youtube", "you tube", "youtube captions", "you tube captions", "yt"].includes(l))
    return "captionYoutube";
  return null;
}

function cleanValue(raw: string): string {
  return String(raw || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s*[-*•]\s+/, "")
        .replace(/^\s*#{1,6}\s*/, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        .replace(/^\s*\|\s*/, "")
        .replace(/\s*\|\s*$/, "")
        .replace(/\s+$/g, ""),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function lineMarker(raw: string): { field: FieldName; rest: string } | null {
  const line = String(raw || "").trim();
  if (!line) return null;

  if (line.startsWith("|") && line.endsWith("|")) {
    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);
    const field = cells.length ? canonicalField(cells[0]) : null;
    if (field) return { field, rest: cells.slice(1).join(" / ").trim() };
  }

  const visible = line
    .replace(/^#{1,6}\s*/, "")
    .replace(/^[-*•]\s*/, "")
    .replace(/^\*\*(.*?)\*\*$/, "$1")
    .replace(/^__(.*?)__$/, "$1")
    .trim();

  const colonIndex = visible.search(/[:：]/);
  if (colonIndex > -1 && colonIndex < 80) {
    const field = canonicalField(visible.slice(0, colonIndex));
    if (field) return { field, rest: visible.slice(colonIndex + 1).trim() };
  }

  const field = canonicalField(visible);
  return field ? { field, rest: "" } : null;
}

function collectLabeledFields(section: string) {
  const body = stripScriptHeader(section);
  const lines = body.split("\n");
  const chunks: Partial<Record<FieldName, string[]>> = {};
  const preamble: string[] = [];
  let current: FieldName | null = null;
  let sawField = false;

  const add = (field: FieldName, value: string) => {
    if (field === "captions") return;
    chunks[field] ||= [];
    chunks[field]?.push(value);
  };

  for (const raw of lines) {
    const marker = lineMarker(raw);
    if (marker) {
      current = marker.field;
      sawField = true;
      if (marker.rest) add(marker.field, marker.rest);
      continue;
    }
    if (!sawField) {
      if (raw.trim()) preamble.push(raw);
      continue;
    }
    if (current && current !== "captions") add(current, raw);
  }

  const value = (field: FieldName) => cleanValue((chunks[field] || []).join("\n"));
  return { value, preamble: cleanValue(preamble.join("\n")), body };
}

function firstLine(text: string): string {
  return (
    text
      .split("\n")
      .map((line) => cleanValue(line))
      .find(Boolean) || ""
  );
}

function parseSlideMarker(line: string): { position: number; role: string } | null {
  const cleaned = cleanValue(line).replace(/[·]/g, " · ").replace(/\s+/g, " ").trim();
  const m = cleaned.match(/^Slide\s*(\d+)(?:\s*(?:·|-|:)\s*(hook|content|cta))?$/i);
  if (!m) return null;
  return { position: Number(m[1]) || 0, role: (m[2] || "").toLowerCase() };
}

function parseSlidesFromText(text: string): ExtractedScript["slides"] {
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n");
  const slides: Array<{ position: number; role: string; lines: string[] }> = [];
  let current: { position: number; role: string; lines: string[] } | null = null;

  for (const raw of lines) {
    const marker = parseSlideMarker(raw);
    if (marker) {
      if (current) slides.push(current);
      current = { position: marker.position || slides.length + 1, role: marker.role, lines: [] };
      continue;
    }
    if (current) current.lines.push(raw);
  }
  if (current) slides.push(current);

  return slides
    .map((slide, index, all) => {
      const contentLines = slide.lines.map(cleanValue).filter(Boolean);
      const role =
        slide.role || (index === 0 ? "hook" : index === all.length - 1 ? "cta" : "content");
      return {
        position: slide.position || index + 1,
        role: ["hook", "content", "cta"].includes(role)
          ? role
          : index === 0
            ? "hook"
            : index === all.length - 1
              ? "cta"
              : "content",
        headline: contentLines[0] || "",
        body: contentLines.slice(1).join("\n"),
      };
    })
    .filter((slide) => slide.headline || slide.body);
}

export function extractScriptDeterministically(
  section: string,
  requestedFormat: string,
  opts?: { trustSectionFormat?: boolean },
): ExtractedScript | null {
  // The document wins: when the section declares its own format, use that —
  // unless the caller explicitly kept their own pick.
  const format =
    opts?.trustSectionFormat === false
      ? requestedFormat
      : readSectionFormat(section) || requestedFormat;
  const fields = collectLabeledFields(section);
  const captions = {
    instagram: fields.value("captionInstagram"),
    facebook: fields.value("captionFacebook"),
    tiktok: fields.value("captionTiktok"),
    youtube: fields.value("captionYoutube"),
  };
  const base = {
    topic: fields.value("title") || firstLine(fields.preamble),
    visualHook: fields.value("visualHook"),
    script: fields.value("script"),
    inspo: fields.value("inspo"),
    filmingInstructions: fields.value("filmingInstructions"),
    creativeInstructions: fields.value("creativeInstructions"),
    onScreenCta: fields.value("onScreenCta"),
    captions,
    slides: [] as ExtractedScript["slides"],
  };

  if (format === "broll") {
    // B-roll carries a text overlay and nothing else. Never repurpose a spoken
    // script or a visual hook as the overlay — that silently invents content.
    const textOverlay = fields.value("textOverlay");
    if (!textOverlay) return null;
    return {
      ...base,
      topic: base.topic || firstLine(textOverlay).slice(0, 120),
      visualHook: textOverlay,
      script: textOverlay,
      onScreenCta: "",
    };
  }

  if (format === "talkingVideo") {
    if (!base.script && !base.visualHook) return null;
    return {
      ...base,
      topic: base.topic || firstLine(base.visualHook || base.script).slice(0, 120),
    };
  }

  if (format === "carousel" || format === "graphic") {
    const slideSource = base.script || fields.body;
    const slides = parseSlidesFromText(slideSource);
    if (!slides.length) return null;
    return {
      ...base,
      topic: base.topic || slides[0]?.headline.slice(0, 120) || "",
      script: "",
      visualHook: slides[0]?.headline || "",
      slides,
    };
  }

  if (!base.script && !base.visualHook) return null;
  return { ...base, topic: base.topic || firstLine(base.visualHook || base.script).slice(0, 120) };
}

// ---------- Content-based format detection ----------
/**
 * Read what a section actually contains and decide what format it really is,
 * using the structural rules:
 *  - Slide copy present            → carousel (2+ slides) or graphic (1 slide)
 *  - Visual hook and/or script     → talking video
 *  - Text overlay and nothing else → B-roll
 * Also reports fields that belong to a different format, so they are flagged
 * rather than forced into the picked format.
 */
export function sniffSectionFormat(section: string): SectionFormatKey | null {
  return analyzeSectionContent(section).format;
}

export type SectionAnalysis = {
  /** What the content says this is, or null when nothing identifiable is present. */
  format: SectionFormatKey | null;
  /** Labels of fields present that don't belong to `format`. */
  conflicts: string[];
};

export function analyzeSectionContent(section: string): SectionAnalysis {
  const fields = collectLabeledFields(section);
  const slideCount = parseSlidesFromText(fields.value("script") || fields.body).length;
  const hasTextOverlay = !!fields.value("textOverlay");
  const hasVisualHook = !!fields.value("visualHook");
  const hasScript = !!fields.value("script");

  const conflicts: string[] = [];

  if (slideCount >= 1) {
    if (hasTextOverlay) conflicts.push("Text overlay");
    if (hasVisualHook) conflicts.push("Visual hook");
    return { format: slideCount >= 2 ? "carousel" : "graphic", conflicts };
  }

  if (hasVisualHook || hasScript) {
    if (hasTextOverlay) conflicts.push("Text overlay");
    return { format: "talkingVideo", conflicts };
  }

  if (hasTextOverlay) return { format: "broll", conflicts };

  return { format: null, conflicts };
}

/** What a section claims to be: its declaration, or what its content shows. */
export function detectSectionFormat(
  section: string,
): { format: SectionFormatKey; source: "declared" | "inferred"; conflicts: string[] } | null {
  const content = analyzeSectionContent(section);
  const declared = readSectionFormat(section);

  if (declared) {
    const conflicts = [...content.conflicts];
    // The content contradicts the declaration: trust the content, flag the clash.
    const videoish = (f: SectionFormatKey) =>
      f === "talkingVideo" || f === "reactionRepurpose" || f === "trend" || f === "podcastClips";
    const compatible =
      !content.format ||
      content.format === declared ||
      (videoish(declared) && content.format === "talkingVideo") ||
      ((declared === "carousel" || declared === "graphic") &&
        (content.format === "carousel" || content.format === "graphic"));
    if (compatible) return { format: declared, source: "declared", conflicts };
    return { format: content.format!, source: "inferred", conflicts };
  }

  return content.format
    ? { format: content.format, source: "inferred", conflicts: content.conflicts }
    : null;
}



// ---------- Per-format JSON schemas (Claude tool_use input) ----------
const captionsSchema = {
  type: "object",
  properties: {
    instagram: { type: "string" },
    facebook: { type: "string" },
    tiktok: { type: "string" },
    youtube: { type: "string" },
  },
  required: ["instagram", "facebook", "tiktok", "youtube"],
};

// Single-script schema — returns ONE object, not an array.
export function buildSingleScriptToolSchema(format: string) {
  const isCarousel = format === "carousel" || format === "graphic";
  const isBroll = format === "broll";
  const isTalking = format === "talkingVideo";

  let props: Record<string, any>;
  let required: string[];

  if (isCarousel) {
    props = {
      topic: {
        type: "string",
        description:
          "Script title — the bold title line directly under the 'Script NN of MM' header.",
      },
      slides: {
        type: "array",
        description:
          "Every slide in the carousel, in document order. Include ALL slides — never summarize or merge.",
        items: {
          type: "object",
          properties: {
            position: {
              type: "integer",
              description: "1-based slide number as written in the doc.",
            },
            role: {
              type: "string",
              enum: ["hook", "content", "cta"],
              description: "Slide role: hook = first, cta = last, content = everything between.",
            },
            headline: {
              type: "string",
              description: "The first text line of the slide (the headline).",
            },
            body: {
              type: "string",
              description:
                "Any remaining slide body text verbatim. Empty string if the slide has only a headline.",
            },
          },
          required: ["position", "role", "headline", "body"],
        },
      },
      captions: captionsSchema,
    };
    required = ["topic", "slides", "captions"];
  } else if (isBroll) {
    props = {
      topic: { type: "string", description: "The Title field for this script." },
      inspo: { type: "string", description: "Inspo field verbatim." },
      visualHook: {
        type: "string",
        description: "Text Overlay field verbatim (this also becomes the script body).",
      },
      script: {
        type: "string",
        description: "Same content as Text Overlay verbatim, preserving line breaks with \\n.",
      },
      filmingInstructions: { type: "string", description: "Filming Instructions verbatim." },
      creativeInstructions: { type: "string", description: "Creative Instructions verbatim." },
      captions: captionsSchema,
    };
    required = ["topic", "visualHook", "script", "filmingInstructions", "captions"];
  } else if (isTalking) {
    props = {
      topic: { type: "string", description: "The Title field for this script." },
      inspo: { type: "string", description: "Inspo field verbatim." },
      visualHook: { type: "string", description: "Visual hook field verbatim." },
      script: {
        type: "string",
        description: "The full Script body verbatim. Preserve line breaks with \\n.",
      },
      filmingInstructions: { type: "string", description: "Filming Instructions verbatim." },
      onScreenCta: { type: "string", description: "On-screen CTA field verbatim." },
      captions: captionsSchema,
    };
    required = ["topic", "visualHook", "script", "filmingInstructions", "captions"];
  } else {
    props = {
      topic: { type: "string" },
      script: { type: "string" },
      captions: captionsSchema,
    };
    required = ["topic", "script", "captions"];
  }

  return {
    name: "emit_script",
    description: "Emit the single script extracted verbatim from the provided section.",
    input_schema: {
      type: "object",
      properties: props,
      required,
    },
  };
}

export function buildFormatGuide(format: string): string {
  if (format === "carousel" || format === "graphic") {
    return `THIS SECTION IS A CAROUSEL/GRAPHIC SCRIPT.

Layout:
  ## Script NN of MM
  **<Script title>**

  **Slide 1 · hook**
  <Headline line>
  <Optional body lines>

  **Slide 2 · content**
  ...

  **Slide N · cta**
  ...

  Captions
  Instagram: ...
  Facebook: ...
  TikTok: ...
  YouTube: ...

Rules:
- Emit EVERY slide that appears. Never skip, merge, or summarize slides.
- Slide role: first = "hook", last = "cta", anything in between = "content".
- "headline" is the first non-empty text line under the slide marker.
- "body" is any remaining lines for that slide joined with \\n. Empty string if none.`;
  }
  if (format === "broll") {
    return `THIS SECTION IS A BROLL SCRIPT.
Fields (in order): Title, Inspo, Text Overlay, Filming Guidelines, Creative Instructions, Captions.
Rules:
- "topic" = Title field.
- "visualHook" AND "script" are BOTH set to the Text Overlay field verbatim.
- Preserve line breaks inside multi-line fields using \\n.`;
  }
  if (format === "talkingVideo") {
    return `THIS SECTION IS A TALKING VIDEO SCRIPT.
Fields (in order): Title, Inspo, Visual hook, Script (multi-paragraph), Filming Instructions, On-screen CTA, Captions.
Rules:
- "topic" = Title field.
- "script" = the entire spoken Script body verbatim, preserving paragraph breaks with \\n\\n.
- Do NOT shorten or paraphrase the Script field — copy every line.`;
  }
  return `Extract every field verbatim.`;
}

// ---------- Claude call: extract ONE script from a single section ----------
const MODEL = AI_MODELS.divideScripts;

export async function extractOneScript(opts: {
  section: string;
  format: string;
  anthropicKey: string;
  trustSectionFormat?: boolean;
}): Promise<{ ok: true; script: any } | { ok: false; error: string; stopReason?: string | null }> {
  const trust = opts.trustSectionFormat !== false;
  // The section's own declaration, or what its fields actually show, wins over the pick.
  const effectiveFormat =
    (trust && detectSectionFormat(opts.section)?.format) || opts.format;

  const deterministic = extractScriptDeterministically(opts.section, opts.format, {
    trustSectionFormat: trust,
  });
  if (deterministic) {
    return { ok: true, script: deterministic };
  }

  const tool = buildSingleScriptToolSchema(effectiveFormat);
  const formatGuide = buildFormatGuide(effectiveFormat);

  const system = `You are a precise document extraction engine. You receive ONE script section from a content production template and emit it via the emit_script tool.

Hard rules:
- Extract every field VERBATIM. Do NOT paraphrase, summarize, shorten, rewrite, translate, or invent content.
- Preserve all line breaks inside string values as \\n. Do not collapse paragraphs.
- Strip markdown formatting characters (**, *, leading bullets like "- ") from the values themselves, but keep the original text and line breaks.
- If a field is genuinely missing in the source, use an empty string (or empty array for slides).
- Never truncate. If a field is long, include all of it.
- Never move content between fields. A field only gets the text that sits under its own heading in the source. If the source has no text overlay, leave the text overlay empty; do not use the spoken script or the visual hook for it, and vice versa.

${formatGuide}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": opts.anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      accept: "text/event-stream",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system,
      tools: [tool],
      tool_choice: { type: "tool", name: "emit_script" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract this single script section verbatim and call emit_script.\n\n--- SECTION START ---\n${opts.section}\n--- SECTION END ---`,
            },
          ],
        },
      ],
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    let errMsg = errText.slice(0, 300);
    try {
      errMsg = JSON.parse(errText)?.error?.message || errMsg;
    } catch {}
    return { ok: false, error: `Claude [${res.status}]: ${errMsg}` };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let sseBuf = "";
  const parts: string[] = [];
  let stopReason: string | null = null;
  let streamErr: string | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    sseBuf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = sseBuf.indexOf("\n\n")) !== -1) {
      const rawEvent = sseBuf.slice(0, idx);
      sseBuf = sseBuf.slice(idx + 2);
      const dataLine = rawEvent.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const payload = dataLine.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload);
        if (evt.type === "content_block_delta" && evt.delta?.type === "input_json_delta") {
          parts.push(evt.delta.partial_json || "");
        } else if (evt.type === "message_delta" && evt.delta?.stop_reason) {
          stopReason = evt.delta.stop_reason;
        } else if (evt.type === "error") {
          streamErr = evt.error?.message || "stream error";
        }
      } catch {}
    }
  }

  if (streamErr) return { ok: false, error: `Claude stream error: ${streamErr}`, stopReason };

  let parsed: any = null;
  try {
    parsed = JSON.parse(parts.join(""));
  } catch {}
  if (!parsed || typeof parsed !== "object") {
    return {
      ok: false,
      error:
        stopReason === "max_tokens"
          ? "Claude hit the max output token limit on this script."
          : "Model did not return a valid script object",
      stopReason,
    };
  }

  // Some model outputs include literal backslash-n sequences inside strings
  // instead of real newlines. Convert them so textareas/PDFs render real line breaks.
  const unesc = (v: any): string => {
    const s = String(v ?? "");
    return s
      .replace(/\r\n/g, "\n")
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t");
  };

  const isCarousel = opts.format === "carousel" || opts.format === "graphic";
  const slides =
    isCarousel && Array.isArray(parsed?.slides)
      ? parsed.slides.map((sl: any, i: number, arr: any[]) => ({
          position: Number(sl?.position) || i + 1,
          role: ["hook", "content", "cta"].includes(String(sl?.role))
            ? String(sl.role)
            : i === 0
              ? "hook"
              : i === arr.length - 1
                ? "cta"
                : "content",
          headline: unesc(sl?.headline),
          body: unesc(sl?.body),
        }))
      : [];

  return {
    ok: true,
    script: {
      topic: unesc(parsed?.topic),
      visualHook: unesc(parsed?.visualHook),
      script: unesc(parsed?.script),
      inspo: unesc(parsed?.inspo),
      filmingInstructions: unesc(parsed?.filmingInstructions),
      creativeInstructions: unesc(parsed?.creativeInstructions),
      onScreenCta: unesc(parsed?.onScreenCta),
      captions: {
        instagram: unesc(parsed?.captions?.instagram),
        facebook: unesc(parsed?.captions?.facebook),
        tiktok: unesc(parsed?.captions?.tiktok),
        youtube: unesc(parsed?.captions?.youtube),
      },
      slides,
    },
  };
}
