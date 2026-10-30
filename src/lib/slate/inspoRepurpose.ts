import type { Format, Brief } from "../simplex/types";
import type { ScriptDoc } from "./scriptChat";
import { normalizeDesignSlides, validateDesignCopy } from "./designTemplates";
import { formatTalkingVideoParagraphs, completeVideoScript } from "./scriptCta";

export const REPURPOSE_TITLE = "Repurpose";

/** The generated wire object is validated before it can enter the live writer. */
export function parseRepurposeScript(raw: string, format: Format, topic: string): ScriptDoc {
  const clean = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const value = JSON.parse(clean);
  if (format === "graphic" || format === "carousel") {
    if (!Array.isArray(value.slides) || !value.slides.length)
      throw new Error("The AI returned incomplete slide copy.");
    const subtype = value.designSubtype === "quote" ? "quote" : "insightful";
    const slides = normalizeDesignSlides(format, subtype, value.slides, topic, "");
    const issues = validateDesignCopy(format, subtype, slides);
    if (issues) throw new Error(issues);
    return { format, kind: "carousel", topic, designSubtype: subtype, slides };
  }
  if (typeof value.script !== "string" || !value.script.trim())
    throw new Error("The AI returned an empty script.");
  const doc: ScriptDoc = {
    format,
    kind: "video",
    topic,
    visualHook: "",
    spokenHook: format === "talkingVideo" ? String(value.spokenHook || "") : undefined,
    script: value.script.trim(),
    onScreenCta: "",
  };
  return format === "talkingVideo"
    ? { ...doc, script: formatTalkingVideoParagraphs(completeVideoScript(doc)) }
    : doc;
}

export function repurposeTranscript(
  script: ScriptDoc,
  source: string,
  context: { brandId: string; brandName: string; brief: Brief; cta?: string },
) {
  return [
    {
      id: "repurpose-context",
      role: "user",
      kind: "text",
      content: `Repurpose “${source}”.`,
      repurposeContext: context,
    },
    {
      id: "repurpose-script",
      role: "ai",
      kind: "script",
      index: 0,
      total: 1,
      topic: script.topic || source,
      script,
      status: "sample",
      scriptType: "fleshed",
      editCount: 0,
      variantGroup: 0,
    },
  ];
}
