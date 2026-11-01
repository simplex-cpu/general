// Strict "surgical" rules for repurposing. These replace the full scripting-flow
// guidelines: only the general human-voice (anti-slop) rules apply alongside them.
import type { RepurposeMode } from "./postRepurpose";

/** Repurposing the brand's OWN post: reformat or small variation, the message survives intact. */
export function ownPostInstruction(mode: RepurposeMode): string {
  const base = "This is the brand's OWN published post. Preserve its topic, main idea, stance, factual claims and natural voice. Do not invent anything.";
  if (mode === "visual") return `${base} SAME FORMAT: keep the body word for word. Change ONLY the visual hook with a small variation of the original (swap a few words, same structure and length).`;
  if (mode === "cover") return `${base} SAME FORMAT: keep every slide body word for word. Change ONLY the cover title with a small variation of the original (swap a few words, same structure and length).`;
  return `${base} NEW FORMAT: target-format limits take priority over verbatim wording, source length and opening structure. Preserve supporting points across the finished post (script/slides PLUS caption), not necessarily all in the on-screen copy. Condense and redistribute without changing meaning. Reuse the original hook/opening only when it fits the target format; never paste a transcript into a short overlay.`;
}

/** Repurposing a VIRAL post: keep its skeleton, swap in the brand's topic, idea and stance. */
export function viralPostInstruction(wordCount: number): string {
  return [
    "This is a proven VIRAL post. Rewrite it surgically for this brand:",
    "- KEEP: format, structure, the hook's wording and mechanics (almost intact), the opening line's wording and structure, the visual hook's wording and structure, and every beat in the same order, one for one.",
    `- KEEP the length: about ${wordCount} words, within 10%.`,
    "- CHANGE ONLY: the topic, main idea and stance, swapped to this brand's. Swap the topic words inside the hook and opening line; leave the rest of their wording.",
    "- Never copy the creator's personal stories, claims or numbers; replace them with the brand's equivalents in the same slot.",
  ].join("\n");
}

/** Captions and visual hook after the script: close variations of the originals. */
export const VARIATION_COPY_RULE = "CAPTION AND VISUAL HOOK: write close variations of the ORIGINAL caption and visual hook. Swap words, never the structure, length, line breaks or format. Hashtags stay in the same place and count.";

export const wordCount = (text: string) => (text.trim().match(/\S+/g) || []).length;

/** Repurposed scripts give free value; they never sell. */
export const NO_PITCH_RULE = "NO PITCH: these scripts exist to give insights and help the audience for free. Never pitch, promote or mention what the brand sells or offers (products, services, programs, calls, DMs for offers), unless selling that offer is literally what the original post is about.";

// Organic voice for every repurpose call: peer-to-peer, never a guru or a sales page.
export const ORGANIC_VOICE_RULE = `ORGANIC VOICE (NON-NEGOTIABLE):
- Write as a peer in the trenches sharing an observation, a mistake or something noticed, never as a mentor lecturing or a marketer persuading.
- No prescriptive guru directives ("You need to...", "Stop doing X, start doing Y", "If you want to scale...").
- No guru formulas: "Here's why this matters for your business", "Most people think X but the top 1% do Y", "Let's talk about why you're struggling", "The secret is", "Want to know how?".
- No hype, no promises of results, no urgency, no authority-proving, no credentials, no "we help", no offer, no DM/link/book-a-call prompts.
- Keep the original's tension, opinion or relatable friction; do not wrap it into a neat "3 easy steps" solution unless the original did exactly that.
- Plain spoken cadence, like two peers talking, not a webinar intro or LinkedIn carousel.`;
