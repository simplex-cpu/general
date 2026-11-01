// ONE universal command structure for every scripting AI call.
//
// Every call, topics, hooks, script bodies, slide copy, text overlay, captions —
// is sent as a single message built from the same envelope:
//
//   You are: ... Your objective is: ...
//   For context: inputs / what the output is used for / what to consider
//   To provide a good quality output: adhere to the guidelines + brand tone
//   Warning: run the QA checklist before sending
//
//   INPUTS:
//     Scripting guidelines
//     Brand details
//     Output structure
//     QA Checklist
//     This task
//
// What changes per call is ONLY the objective/context lines and which admin
// fields feed the four INPUT blocks. The role is always a scriptwriter.

import type { Prompts, PromptKey, Format } from "@/lib/simplex/types";

export type DeliverableKey =
  | "topics"
  | "hookTalking"
  | "hookCarousel"
  | "hookGraphic"
  | "talkingFleshed"
  | "talkingFramework"
  | "broll"
  | "carousel"
  | "graphic"
  | "productionMeta"
  | "captions";

type GuidelineBlock = { label: string; key: PromptKey };

type DeliverableSpec = {
  objective: string;
  inputs: string;
  outputUse: string;
  considerations: string;
  guidelinesLabel: string;
  guidelineBlocks: GuidelineBlock[];
  outputKey: PromptKey;
  qaKey: PromptKey;
};

export const DELIVERABLES: Record<DeliverableKey, DeliverableSpec> = {
  topics: {
    objective: "select the topics this brand should post about next, each with a short rationale",
    inputs:
      "the brand details (session brief, expertise, audience, recommended strategy, topics already used) and the number of topics required",
    outputUse:
      "a strategist picks which topics move forward, and every hook, script and caption in this batch is written from the topic that is chosen",
    considerations:
      "each topic must sit inside the brand's expertise, speak to that exact audience, avoid anything already covered, and be written in plain everyday language",
    guidelinesLabel: "Topic Research",
    guidelineBlocks: [{ label: "TOPIC RESEARCH GUIDELINES", key: "topicResearch" }],
    outputKey: "outputTopics",
    qaKey: "qaChecklistTopics",
  },
  hookTalking: {
    objective:
      "write the spoken opening line for Talking Video pieces, the first thing said on camera, and nothing else",
    inputs: "the brand details and the approved topics for this batch",
    outputUse:
      "the brand owner picks one opening line per topic, the on-screen text is derived from that line later, and the script body is written to pay off exactly what that line promised",
    considerations:
      "the line has to be specific to this brand's audience, and it must promise something the script can actually deliver in full",
    guidelinesLabel: "Talking Video Hook",
    guidelineBlocks: [{ label: "TALKING VIDEO HOOK GUIDELINES", key: "hookTalking" }],
    outputKey: "outputHookTalking",
    qaKey: "qaChecklistHookTalking",
  },
  hookCarousel: {
    objective: "write the hook slide (slide 1) for carousel pieces",
    inputs: "the brand details and the approved topics for this batch",
    outputUse:
      "slide 1 stops the scroll and earns the swipe to slide 2, then the remaining slides are written to deliver on it",
    considerations:
      "the hook must promise a payoff that later slides can actually deliver, and stay specific to this brand's audience",
    guidelinesLabel: "Carousel Hook",
    guidelineBlocks: [{ label: "CAROUSEL HOOK GUIDELINES", key: "hookCarousel" }],
    outputKey: "outputHookCarousel",
    qaKey: "qaChecklistHookCarousel",
  },
  hookGraphic: {
    objective: "write the hook copy for single-image graphic pieces",
    inputs: "the brand details and the approved topics for this batch",
    outputUse: "the hook is the whole graphic, there is no slide 2 to complete the thought",
    considerations:
      "the hook must be the payoff itself, quotable on its own, and specific to this brand's audience",
    guidelinesLabel: "Graphic Hook",
    guidelineBlocks: [{ label: "GRAPHIC HOOK GUIDELINES", key: "hookGraphic" }],
    outputKey: "outputHookGraphic",
    qaKey: "qaChecklistHookGraphic",
  },
  talkingFleshed: {
    objective: "write the full, ready-to-record spoken script body for a Talking Video",
    inputs: "the brand details, the approved topic and the approved hook",
    outputUse:
      "the brand owner records these words verbatim on camera, so anything unnatural to say out loud fails",
    considerations:
      "the script must continue from the approved hook rather than restate it, take one idea deeper, and land a single clear takeaway",
    guidelinesLabel: "Talking Script · Fleshed",
    guidelineBlocks: [
      { label: "TALKING SCRIPT GUIDELINES (FLESHED)", key: "talkingScriptFleshed" },
    ],
    outputKey: "outputTalkingFleshed",
    qaKey: "qaChecklistTalking",
  },
  talkingFramework: {
    objective:
      "write a Talking Video script framework, fully written opening with bracketed placeholders in the body for the brand owner's own stories",
    inputs: "the brand details, the approved topic and the approved hook",
    outputUse:
      "the brand owner fills the placeholders with their own examples and records the result on camera",
    considerations:
      "placeholders belong only in the body; the opening must be fully written and every placeholder must name exactly what goes in it",
    guidelinesLabel: "Talking Script · Framework",
    guidelineBlocks: [
      { label: "TALKING SCRIPT GUIDELINES (FRAMEWORK)", key: "talkingScriptFramework" },
    ],
    outputKey: "outputTalkingFramework",
    qaKey: "qaChecklistTalking",
  },

  broll: {
    objective:
      "write the B-roll text overlay, the single on-screen line laid over background footage",
    inputs: "the brand details and the approved topic",
    outputUse:
      "the overlay is read muted in the feed and is the only copy on the video; the insight itself is paid off in the caption",
    considerations:
      "it must work as one standalone scroll-stopping line with no footage cues, no beats and no spoken dialogue",
    guidelinesLabel: "B-roll Text Overlay",
    guidelineBlocks: [{ label: "B-ROLL TEXT OVERLAY GUIDELINES", key: "brollScript" }],
    outputKey: "outputBroll",
    qaKey: "qaChecklistBroll",
  },
  carousel: {
    objective:
      "write the carousel slide copy, the content slides between the hook slide and the CTA slide, plus the CTA slide",
    inputs: "the brand details, the approved topic and the approved hook slide",
    outputUse: "each slide is designed and published as an image the audience swipes through",
    considerations:
      "the slide count follows content density, the arc must build across slides, and every slide has to earn the next swipe",
    guidelinesLabel: "Carousel Slides",
    guidelineBlocks: [
      { label: "CAROUSEL SLIDE GUIDELINES", key: "carouselSlides" },
      { label: "CTA SLIDE GUIDELINES", key: "carouselCta" },
    ],
    outputKey: "outputCarousel",
    qaKey: "qaChecklistCarousel",
  },
  graphic: {
    objective: "write the copy for a single-image graphic post, including its CTA",
    inputs: "the brand details, the approved topic and the approved hook",
    outputUse: "a designer lays this copy out as one image that has to work in a single glance",
    considerations:
      "keep it minimal and thumbnail-readable; if the idea genuinely needs unfolding, recommend a carousel instead",
    guidelinesLabel: "Graphic Copy",
    guidelineBlocks: [
      { label: "GRAPHIC COPY GUIDELINES", key: "graphicCopy" },
      { label: "CTA GUIDELINES", key: "graphicCta" },
    ],
    outputKey: "outputGraphic",
    qaKey: "qaChecklistGraphic",
  },
  productionMeta: {
    objective: "write practical creative direction for the person producing this finished script",
    inputs: "the brand details, approved topic, and final approved script or slide copy",
    outputUse:
      "an editor or designer uses these notes to produce the content card accurately without guessing the visual treatment",
    considerations:
      "the instructions must be short, concrete, brand-aware, and separated into inspiration, filming needs when applicable, and creative execution notes",
    guidelinesLabel: "Production Creative Instructions",
    guidelineBlocks: [
      { label: "PRODUCTION CREATIVE INSTRUCTIONS", key: "productionCreativeInstructions" },
    ],
    outputKey: "outputProductionMeta",
    qaKey: "qaChecklistProductionMeta",
  },
  captions: {
    objective:
      "write the platform captions for a finished content piece, Instagram, Facebook, TikTok and YouTube",
    inputs:
      "the brand details, the approved topic with its research rationale, and the approved script or slide copy",
    outputUse:
      "the captions are published alongside the piece and carry the payoff, the context and the next step",
    considerations:
      "each platform reads differently, so the four captions must not be copies of each other, and none may restate the on-screen copy word for word",
    guidelinesLabel: "Platform Captions",
    guidelineBlocks: [
      { label: "INSTAGRAM CAPTION GUIDELINES", key: "captionInstagram" },
      { label: "FACEBOOK CAPTION GUIDELINES", key: "captionFacebook" },
      { label: "TIKTOK CAPTION GUIDELINES", key: "captionTiktok" },
      { label: "YOUTUBE CAPTION GUIDELINES", key: "captionYoutube" },
    ],
    outputKey: "outputCaptions",
    qaKey: "qaChecklistCaptions",
  },
};

export function hookDeliverable(format: Format): DeliverableKey {
  if (format === "carousel") return "hookCarousel";
  if (format === "graphic") return "hookGraphic";
  return "hookTalking";
}

export function scriptDeliverable(
  format: Format,
  scriptType: "fleshed" | "framework",
): DeliverableKey {
  if (format === "broll") return "broll";
  if (format === "carousel") return "carousel";
  if (format === "graphic") return "graphic";
  return scriptType === "framework" ? "talkingFramework" : "talkingFleshed";
}

function block(title: string, body: string): string {
  const t = (body || "").trim();
  return `${title}:\n${t || "(none provided)"}`;
}

// Hard-coded, non-negotiable human-voice rules. These are appended to EVERY
// scripting AI call (topics, hooks, scripts, slide copy, overlays, captions,
// hook variants) and are not editable from the admin panel on purpose: they
// are the floor, not a preference.
export const ANTI_SLOP_RULES = `HUMAN VOICE RULES (NON-NEGOTIABLE, THESE OVERRIDE EVERY OTHER GUIDELINE)

This copy must read like one specific person talking, not like a language model. Any output that breaks a rule below is a failed output, rewrite it before sending.

BANNED CONSTRUCTIONS
1. Never use "It's not X, it's Y", "This isn't X, it's Y", "Not only ... but also", or any mirrored contrast built for drama.
2. Never use the rule of three: no three stacked adjectives, no three-item lists of ideas, no triple rhythm sentences. If you have three, cut to two or expand to four with different weights.
3. Never use the "stapled sentence": two independent clauses glued with "and" (or "but") purely to vary length. Split them or subordinate one properly.
4. Never open with engagement filler: "Here's the thing", "Here's what no one talks about", "The best part is", "Let that sink in", "And that's the point", "Plot twist", "Truth is", "The reality is".
5. Never end on a summarising moral or a neat mirrored callback to the opening line.

BANNED VOCABULARY
Do not use: delve, dive into, unpack, quietly, honestly, truly, genuinely, simply put, essentially, fundamentally, elevate, unlock, harness, leverage, seamless, robust, journey, landscape, realm, testament, resonate, navigate (figurative), transformative, game-changer, powerful, crucial, vital, ever-evolving, in today's world, at the end of the day. No thesaurus-grade or pseudo-intellectual substitutes for plain words.

PUNCTUATION
6. Never use an em dash or an en dash. Use a comma, a full stop, a colon, or parentheses.
7. Punctuate like a careful human writer: use commas, semicolons, colons and parentheses where the sentence actually needs them. Under-punctuated, comma-light prose is the strongest AI tell, so do not strip punctuation to sound punchy.
8. No emojis unless the brand details explicitly ask for them. No decorative ellipses. No rhetorical question stacked on rhetorical question.

RHYTHM AND FORMAT
9. Vary sentence length genuinely: mix a short blunt line with a longer clause-carrying one. Do not alternate short/long in a predictable pattern.
10. No bolding for emphasis, no uniform bullet lists, no headers inside the copy unless the required output structure demands them. Never bold every other sentence.
11. Use concrete, specific nouns, numbers, names and situations from the brand details instead of abstract summary language. Specificity is what makes it sound human.
12. Contractions are fine. Slight asymmetry is fine. Perfectly balanced, polished, symmetrical copy is the failure state.`;

export function buildEnvelope(
  deliverable: DeliverableKey,
  prompts: Prompts,
  args: { brandDetails: string; task: string },
): string {
  const spec = DELIVERABLES[deliverable];

  const guidelineParts: string[] = [];
  const global = (prompts.framework || "").trim();
  if (global) guidelineParts.push(`GLOBAL VOICE & TONE:\n${global}`);
  for (const g of spec.guidelineBlocks) {
    const v = (prompts[g.key] || "").trim();
    if (v) guidelineParts.push(`${g.label}:\n${v}`);
  }

  const header = [
    `You are: a scriptwriter writing short-form social content for one specific client brand.`,
    `Your objective is: ${spec.objective}.`,
    `For context: The inputs you receive will be ${spec.inputs}, the output you provide will be used for ${spec.outputUse}, therefore you must consider ${spec.considerations}.`,
    `To provide a good quality output: You must adhere to the guidelines named "${spec.guidelinesLabel}" below, and write in the tone of voice aligned with the brand details provided. Your output must be structured according to the output structure guidelines below.`,
    `Follow every instruction, length limit, word-count target, format rule, and banned-construction rule in the guidelines and output structure below strictly. Do not ignore length requirements or improvise beyond what is specified.`,
    `Warning: Before sending the output, run your proposed deliverable through the QA checklist below AND through the HUMAN VOICE RULES. If any line breaks a human voice rule, rewrite that line before sending. Never mention the guidelines, the checklist or this instruction in the output.`,
  ].join("\n");

  return [
    header,
    `INPUTS:`,
    block("SCRIPTING GUIDELINES", guidelineParts.join("\n\n")),
    block("BRAND DETAILS", args.brandDetails),
    block("OUTPUT STRUCTURE", prompts[spec.outputKey] || ""),
    block("QA CHECKLIST", prompts[spec.qaKey] || ""),
    block("THIS TASK", args.task),
    AUDIENCE_RULE,
    PLACEHOLDER_RULE,
    ...(deliverable === "topics" ? [TOPIC_RULE] : []),
    ANTI_SLOP_RULES,
    `FINAL CHECK: reread your output once as a picky human editor. Delete any em dash, any "it's not X it's Y", any group of three, any banned word, any stapled "and" sentence, and add back the commas and colons a human would use. Only then send it.`,
  ].join("\n\n");
}


// Hook angles used for B-roll text overlays. The model must pick 3 different
// angles from this list before writing, one per overlay version.
export const BROLL_ANGLES = `- Direct call-out (short or medium). Name the exact person in the exact situation. Example: "Founders whose business stops if they take a week off."
- Scene (medium). Put them in the moment, with time pressure or stakes. Example: "Third night this week you've reopened the laptop after the kids are down."
- Failed attempt (medium). Name what they have tried. Example: "You've done the kegels for 6 months and still leak when you sneeze."
- Numbers + proof (medium or long). A real count from the brief or a [SPECIFIC METRIC] placeholder. Example: "I've reviewed 35 funnels this year. The same 3 mistakes were in nearly all of them."
- Authority + specificity (long). Credential plus a precise claim. Example: "As a trichologist I can tell which blood tests you need from where you're losing hair."
- Contradiction / gotcha (long, stacked). Two true things that seem to conflict. Example: "Ferritin 40. Labs say normal. Hair still coming out in the shower. Those two things are not a contradiction."
- Before / after or then / now (medium, stacked). Example: "Minoxidil grew it back. Stopped for 6 weeks. Gone again."
- Numbered list with teaser (medium or long). Example: "4 things we learned feeding people in war zones. Number 2 is the one that matters."
- Non-negotiables / checklist (medium). Example: "My non-negotiables for a first client call, after 200 of them."
- Nobody talks about (long). Only when the caption genuinely delivers the missing angle. Example: "Nobody talks about how terrifying it is driving through rocket fire knowing your van is the only food some families see this week."
- POV / recognition (medium). Example: "POV: you just realised your lead magnet attracts everyone except the people who buy."
- Question (short). Example: "Still posting daily and stuck under 1,000 followers?"
- Warning / loss (short or medium). Example: "Don't book another discovery call until you've read this." Only where the stakes are real.
- Myth vs reality (medium). Example: "More hashtags means more reach. Says who?"
- Plain correction (short). Example: "You're pricing by the hour. That's the problem."`;

/** Structured version of the angle list: the app picks 3 before any AI call. */
export const BROLL_ANGLE_LIST: { name: string; guide: string }[] = BROLL_ANGLES.split("\n")
  .map((line) => line.replace(/^-\s*/, "").trim())
  .filter(Boolean)
  .map((guide) => ({ name: guide.split(/\s*\(/)[0].trim(), guide }));

/**
 * Angle families. Each family delivers the value in a structurally different
 * way, so picking one angle per family guarantees three genuinely different
 * overlays instead of three rewordings of the same idea.
 */
const BROLL_ANGLE_FAMILIES: string[][] = [
  // Speak straight to the person / recognition
  ["Direct call-out", "Scene", "POV / recognition", "Question"],
  // Evidence, authority, structure
  ["Numbers + proof", "Authority + specificity", "Numbered list with teaser", "Non-negotiables / checklist"],
  // Tension, correction, reversal
  [
    "Failed attempt",
    "Contradiction / gotcha",
    "Before / after or then / now",
    "Myth vs reality",
    "Plain correction",
    "Warning / loss",
    "Nobody talks about",
  ],
];

const pickOne = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Pick n angles in code, never by the model. One angle per family (shuffled
 * order) so the three overlays differ in structure, length and delivery.
 */
export function pickBrollAngles(n = 3): { name: string; guide: string }[] {
  const families = [...BROLL_ANGLE_FAMILIES].sort(() => Math.random() - 0.5);
  const out: { name: string; guide: string }[] = [];
  const taken = new Set<string>();
  for (const family of families) {
    if (out.length >= n) break;
    const candidates = family.filter((name) => !taken.has(name));
    if (!candidates.length) continue;
    const name = pickOne(candidates);
    const found = BROLL_ANGLE_LIST.find((a) => a.name === name);
    if (found) {
      taken.add(name);
      out.push(found);
    }
  }
  // Top up from anywhere if n exceeds the family count.
  const pool = BROLL_ANGLE_LIST.filter((a) => !taken.has(a.name));
  while (pool.length && out.length < n) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

export const AUDIENCE_RULE = `WHO YOU ARE TALKING TO: the reader or viewer is the brand's TARGET AUDIENCE from the brand details. Address that person directly as "you". Never refer to the audience in the third person or as someone else's possession ("your founder", "your clients' founders", "your team's owner"). Before sending, ask: who is "you" in this piece? It must be the target audience. If not, rewrite.`;

export const PLACEHOLDER_RULE = `FILL-IN PLACEHOLDERS: use one only when the piece genuinely cannot work without a personal fact the brand details do not contain. If the sentence works without it, rewrite the sentence instead (write "Every founder answers the same pricing objection on sales calls", not "on [SPECIFIC METRIC] sales calls"). Never use square brackets. A placeholder is curly braces holding a clear instruction of what to add, e.g. {Add the date you did this} or {Add one client result in numbers}. Maximum two per piece; zero is preferred.`;

export const TOPIC_RULE = `WHAT A TOPIC IS: a topic is a matter worth discussing that gives the audience value: a problem, belief, mistake, insight, trend or question they have. A topic is NEVER an instruction, a task, an exercise or a content idea ("Turn one sales-call answer into next week's content", "Share your morning routine"), and never depends on the speaker telling a personal story. Write the title as the subject itself (e.g. "Why pricing objections repeat on every sales call"). How it is delivered (story, list, reframe) is decided later by the hook and script. The rationale explains the value this topic gives the audience.`;
