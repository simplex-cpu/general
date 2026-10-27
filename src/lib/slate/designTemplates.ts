export type DesignSubtype = "quote" | "insightful";
/** Independent podcast narrative template; never change the standard writing templates. */
export const PODCAST_DESIGN_RULES = { carouselSlides: 8, graphicSubtitleRequired: false } as const;

export type DesignTopic = {
  title: string;
  rationale?: string;
  designSubtype?: DesignSubtype;
};

export type StructuredDesignSlide = {
  position: number;
  role: "hook" | "content" | "cta";
  headline: string;
  /** Optional small line (cover label / slide subtitle). */
  subtitle?: string;
  /** Supporting copy, or the invitation to act on the final carousel slide. */
  body?: string;
  actionLabel?: string;
};

export const GENERIC_CTAS = [
  { headline: "Share this with a friend who needs it.", actionLabel: "Share" },
  { headline: "Follow for more practical insights like this.", actionLabel: "Follow" },
  { headline: "Comment with what you have experienced.", actionLabel: "Comment" },
] as const;

export const DESIGN_RULES = {
  carousel: {
    quote: { slideCount: 6, contentCount: 4, coverTitleWords: 9, contentWords: 20 },
    insightful: {
      slideCount: 10,
      contentCount: 8,
      coverTitleWords: 8,
      coverSubtitleWords: 10,
      contentTitleWords: 6,
      contentBodyWords: 15,
    },
  },
  graphic: {
    quote: { slideCount: 1, contentWords: 20 },
    insightful: { slideCount: 1, titleWords: 6, bodyWords: 15 },
  },
  safeInset: 0.1,
} as const;

const INSIGHTFUL_SIGNALS = [
  /\bwhy\b/i,
  /\bhow\b/i,
  /\breason(s)?\b/i,
  /\bguide\b/i,
  /\bsteps?\b/i,
  /\bways?\b/i,
  /\btips?\b/i,
  /\bmistakes?\b/i,
  /\bappearing\b/i,
  /\bexplain/i,
  /\bprocess\b/i,
  /\bstrategy\b/i,
];

const QUOTE_SIGNALS = [
  /\bbelie(f|ve|ves|ving)\b/i,
  /\bmindset\b/i,
  /\btruth\b/i,
  /\bchallenge\b/i,
  /\bstop\b/i,
  /\bpermission\b/i,
  /\bcourage\b/i,
  /\bmotivat/i,
  /\binspir/i,
];

export function carouselInsightScore(topic: DesignTopic): number {
  const text = `${topic.title} ${topic.rationale || ""}`;
  const suggested = topic.designSubtype === "insightful" ? 1 : topic.designSubtype === "quote" ? -1 : 0;
  return suggested
    + INSIGHTFUL_SIGNALS.reduce((score, signal) => score + (signal.test(text) ? 2 : 0), 0)
    - QUOTE_SIGNALS.reduce((score, signal) => score + (signal.test(text) ? 2 : 0), 0);
}

/** Assigns a meaning-led type while keeping every carousel batch within one of a 50/50 split. */
export function assignBalancedCarouselSubtypes<T extends DesignTopic>(topics: T[]): Array<T & { designSubtype: DesignSubtype }> {
  if (!topics.length) return [];
  const ranked = topics
    .map((topic, index) => ({ index, score: carouselInsightScore(topic) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const exactHalf = Math.floor(topics.length / 2);
  const extraFitsInsight = topics.length % 2 === 1 && ranked[exactHalf]?.score > 0;
  const insightfulCount = exactHalf + (extraFitsInsight ? 1 : 0);
  const insightful = new Set(ranked.slice(0, insightfulCount).map((entry) => entry.index));
  return topics.map((topic, index) => ({
    ...topic,
    designSubtype: insightful.has(index) ? "insightful" : "quote",
  }));
}

export function wordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export function validateDesignCopy(
  format: "carousel" | "graphic",
  subtype: DesignSubtype,
  slides: Partial<StructuredDesignSlide>[],
): string | null {
  const expected = format === "graphic" ? 1 : DESIGN_RULES.carousel[subtype].slideCount;
  if (slides.length !== expected) return `${format === "graphic" ? "Graphic" : "Carousel"} requires exactly ${expected} ${expected === 1 ? "design" : "slides"}.`;
  const missing = slides.findIndex((slide) => !String(slide.headline || "").trim());
  if (missing >= 0) return `${format === "graphic" ? "Graphic" : `Slide ${missing + 1}`} needs a title.`;
  if (format === "graphic") {
    if (!String(slides[0]?.body || slides[0]?.subtitle || "").trim()) return "Graphic needs a subtitle.";
    return null;
  }
  if (subtype === "insightful") {
    const missingBody = slides.slice(1, -1).findIndex((slide) => !String(slide.body || "").trim());
    if (missingBody >= 0) return `Slide ${missingBody + 2} needs body copy.`;
  }
  const cta = slides.at(-1);
  if (!String(cta?.body || "").trim() || !String(cta?.actionLabel || "").trim()) return `Slide ${expected} needs an invitation and CTA button.`;
  return null;
}

export function limitWords(value: unknown, max: number): string {
  return String(value || "").trim().split(/\s+/).filter(Boolean).slice(0, max).join(" ");
}

function genericCta(topic: string) {
  const seed = Array.from(topic || "").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return GENERIC_CTAS[seed % GENERIC_CTAS.length];
}

function preservesRequestedCta(candidate: string, requested: string): boolean {
  const clean = (value: string) => value.toLowerCase().replace(/[“”"']/g, "").trim();
  const wanted = clean(requested);
  const proposed = clean(candidate);
  if (!wanted || !proposed) return false;
  const action = wanted.split(/\s+/)[0];
  if (!proposed.includes(action)) return false;
  const keyword = requested.match(/[“"]([^”"]+)[”"]/)?.[1];
  if (keyword && !proposed.includes(clean(keyword))) return false;
  const reward = wanted.match(/\bto get\s+(.+)$/)?.[1];
  return !reward || proposed.includes(reward);
}

function closingStatement(candidate: unknown, topic: string): string {
  const clean = String(candidate || "").trim();
  if (clean) return limitWords(clean, 10);
  const subject = limitWords(topic, 5);
  return limitWords(subject ? `${subject} starts with your next move.` : "Make your next move count.", 10);
}

export function normalizeDesignSlides(
  format: "carousel" | "graphic",
  subtype: DesignSubtype,
  rawSlides: Partial<StructuredDesignSlide>[],
  topic = "",
  requestedCta = "",
): StructuredDesignSlide[] {
  const raw = Array.isArray(rawSlides) ? rawSlides : [];
  if (format === "graphic") {
    const first = raw[0] || {};
    const headlineLimit = subtype === "quote" ? 20 : 6;
    const bodyLimit = subtype === "quote" ? 12 : 15;
    const headline = limitWords(first.headline || first.body, headlineLimit);
    let body = first.headline ? limitWords(first.body || first.subtitle, bodyLimit) : "";
    // Single graphics always carry a subtitle; fall back to the topic when the model omits it.
    if (!body.trim() || body.trim() === headline.trim()) {
      const fromTopic = limitWords(topic, bodyLimit);
      body = fromTopic && fromTopic.trim() !== headline.trim() ? fromTopic : limitWords("Save this for when you need it.", bodyLimit);
    }
    return [{ position: 1, role: "content", headline, body }];
  }

  const contentCount = subtype === "quote" ? 4 : 8;
  const coverRaw = raw.find((slide) => slide.role === "hook") || raw[0] || {};
  const contentRaw = raw.filter((slide) => slide.role === "content");
  const ctaRaw = raw.find((slide) => slide.role === "cta") || {};
  const fallback = genericCta(topic);
  const slides: StructuredDesignSlide[] = [{
    position: 1,
    role: "hook",
    headline: limitWords(coverRaw.headline, subtype === "quote" ? 9 : 8),
    ...(subtype === "insightful" ? { subtitle: limitWords(coverRaw.subtitle || coverRaw.body, 10) } : {}),
  }];
  for (let index = 0; index < contentCount; index++) {
    const source = contentRaw[index] || raw[index + 1] || {};
    slides.push({
      position: index + 2,
      role: "content",
      headline: limitWords(source.headline, subtype === "quote" ? 20 : 6),
      ...(subtype === "insightful" ? { body: limitWords(source.body, 15) } : {}),
    });
  }
  const explicit = requestedCta.trim();
  const rawHeadline = String(ctaRaw.headline || "").trim();
  const rawBody = String(ctaRaw.body || "").trim();
  const headlineIsInvite = explicit && preservesRequestedCta(rawHeadline, explicit);
  const bodyIsInvite = explicit && preservesRequestedCta(rawBody, explicit);
  const invite = explicit
    ? bodyIsInvite
      ? rawBody
      : headlineIsInvite
        ? rawHeadline
        : explicit
    : rawBody || fallback.headline;
  slides.push({
    position: contentCount + 2,
    role: "cta",
    headline: closingStatement(explicit && !headlineIsInvite && !bodyIsInvite ? "" : headlineIsInvite ? "" : rawHeadline, topic),
    body: limitWords(invite, 12),
    actionLabel: limitWords(explicit ? explicit.split(/\s+/)[0] : ctaRaw.actionLabel || fallback.actionLabel, 1),
  });
  return slides;
}

export function designStructurePrompt(format: "carousel" | "graphic", subtype: DesignSubtype): string {
  if (format === "carousel" && subtype === "quote") return `QUOTE CAROUSEL — use only for inspiration, motivation, a direct challenge, or a belief-changing angle. Never compress a broader explanation into short statements and call it a quote carousel. Return exactly 6 slides: slide 1 hook with headline only (max 9 words); slides 2-5 content with headline only (max 20 words each, sentence/body style); slide 6 CTA with a powerful closing statement in headline (max 10 words), the natural invitation to act in body (max 12 words), and a one-word actionLabel. The four quotes must advance one coherent challenge or belief shift from slide to slide, never read like unrelated quotations. Never place structural labels such as hook, content, title, body, or CTA inside the copy. No subtitle or label on the cover.`;
  if (format === "carousel") return `INSIGHTFUL CAROUSEL — use for an explanation, diagnosis, process, reasons, recommendations, or any topic that promises a deeper answer. A topic such as “Why is my website not appearing in ChatGPT?” must use this structure. Return exactly 10 slides: slide 1 hook with headline (max 8 words) and optional cover label in subtitle (max 10 words), never body; slides 2-9 content with headline (max 6 words) and body (max 15 words); slide 10 CTA with a powerful closing statement in headline (max 10 words), the natural invitation to act in body (max 12 words), and a one-word actionLabel. Never place structural labels such as hook, content, title, body, or CTA inside the copy.`;
  if (subtype === "quote") return `QUOTE GRAPHIC — return exactly one content slide with headline only, max 20 words. No cover and no CTA.`;
  return `INSIGHTFUL GRAPHIC — return exactly one content slide with headline max 6 words and body max 15 words. No cover and no CTA.`;
}