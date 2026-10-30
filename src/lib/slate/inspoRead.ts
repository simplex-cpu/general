import { INSPO_FORMATS, type InspoFormat } from "./inspoBank";

export type InspoAnalysis = {
  title: string;
  format: InspoFormat;
  topic: string;
  whyItWorks: string;
  imageCopy: string;
};

/** Videos get transcribed; carousels/graphics get their images read. */
export function readBranch(m: { videoUrl?: string; imageUrls?: string[]; format?: string }) {
  if (m.format === "Carousel" || m.format === "Graphic") return "images" as const;
  if (m.videoUrl) return "video" as const;
  return m.imageUrls?.length ? ("images" as const) : ("video" as const);
}

export function parseInspoAnalysis(raw: string): InspoAnalysis {
  const d = JSON.parse(raw.trim());
  if (!INSPO_FORMATS.includes(d?.format))
    throw new Error("The analysis returned an unknown format.");
  const why = String(d.whyItWorks || "").trim();
  if (!why) throw new Error("The analysis did not explain why the post works.");
  return {
    title: String(d.title || "")
      .trim()
      .slice(0, 200),
    format: d.format,
    topic: String(d.topic || "")
      .trim()
      .slice(0, 300),
    whyItWorks: why.slice(0, 10000),
    imageCopy: String(d.imageCopy || "").trim(),
  };
}

const STOP = new Set(
  "the a an and or but if then of to in on for with at by from is are was were be been it this that these those you your i me my we our they them he she his her as not no do does did can will just so how what why when who all more most very have has had get got make about into than too also only out up".split(
    " ",
  ),
);
const words = (t: string) =>
  (t.toLowerCase().match(/[a-z\u00c0-\u024f']{4,}/g) || []).filter((w) => !STOP.has(w));

/** True when speech is too thin to carry the post; such videos get read visually. */
export function isSilentTranscript(t: string) {
  return t.trim().split(/\s+/).filter(Boolean).length < 6;
}

/** Distinctive post words that leaked into the hook template or beats (topic-specific). */
export function topicLeaks(whyItWorks: string, postText: string): string[] {
  const generic = new Set(
    "hook template beats beat viewer viewers audience attention pattern interrupt tension payoff proof story framework structure statement statements result results problem solution desired common habit mistake people".split(
      " ",
    ),
  );
  const post = new Set(words(postText));
  return Array.from(new Set(words(whyItWorks.replace(/\[[^\]]*\]/g, " ")))).filter(
    (w) => post.has(w) && !generic.has(w),
  );
}
export const isTopicFree = (why: string, post: string) => topicLeaks(why, post).length < 3;
