/** One brand-reality block shared by angle suggestions and both repurpose writers. */
import type { StoryPlan } from "./repurposeAngles";
const FIELDS: [string, string][] = [
  ["My Brand in Nutshell", "What the brand is and sells"],
  ["My Competitive Edge", "Competitive edge / expertise"],
  ["My Target Audience", "Target audience"],
  ["Pain Points", "Audience pain points"],
  ["Topics", "Content pillars / topics"],
  ["My Tone of Voice", "Tone of voice"],
];

export const AUDIENCE_REALITY_RULE = `AUDIENCE REALITY (hard rule):
- Assume the audience already uses today's common tools and shortcuts (including AI). Never build an angle around a problem they have already solved or a question nobody asks anymore (e.g. "without hiring anyone").
- The angle must speak to a present, specific tension drawn from the pain points above, in words the audience uses about themselves.
- Stay inside the brand's real expertise; never claim results or offers not stated in the brand reality.`;

export function brandRealityBlock(fields: Record<string, unknown>, opts: { includeFunnel?: boolean } = {}): string {
  const rows = FIELDS.map(([k, label]) => [label, String(fields[k] ?? "").trim()] as const).filter(([, v]) => v);
  if (opts.includeFunnel && String(fields["My Funnel for Monetization"] ?? "").trim()) rows.push(["Monetization funnel", String(fields["My Funnel for Monetization"]).trim()]);
  const name = String(fields["Brand Name"] ?? "").trim();
  return `BRAND REALITY${name ? ` — ${name}` : ""}\n${rows.map(([l, v]) => `${l}: ${v.slice(0, 3000)}`).join("\n")}\n\n${AUDIENCE_REALITY_RULE}`;
}

export function brandPillars(fields: Record<string, unknown>): string[] {
  return String(fields.Topics ?? "").split(/\n|,|;|•/).map((s) => s.replace(/^[-*\d.\s]+/, "").trim()).filter((s) => s.length > 2 && s.length < 120).slice(0, 8);
}

export const ANGLE_KINDS = ["suggested", "trending", "pillar", "custom", "keep"] as const;
export type AngleKind = (typeof ANGLE_KINDS)[number];
export type Angle = { text: string; kind: AngleKind; storyPlan?: StoryPlan };

/** Instruction injected into the writers for the user-confirmed angle. */
export function angleInstruction(angle: Angle | undefined, source: "viral" | "own"): string {
  if (!angle || angle.kind === "keep" || !angle.text.trim()) return source === "own" ? "ANGLE: Keep the original post's angle, topic and main idea unchanged." : "";
  const text = angle.text.trim().slice(0, 600);
  return source === "viral"
    ? `CONFIRMED ANGLE (the user chose this; it IS the new topic and stance — do not pick another): ${text}\nApply it inside the locked hook template and beats.`
    : `CONFIRMED ANGLE (the user chose this): ${text}\nKeep the original post's delivery and structure rules, but express the message through this angle.`;
}
