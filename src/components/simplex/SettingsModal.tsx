import { useEffect, useMemo, useState } from "react";
import {
  X, RotateCcw, Check, Lock, ChevronDown, ChevronRight,
  Lightbulb, Database,
} from "lucide-react";
import { DEFAULT_PROMPTS } from "@/lib/simplex/prompts";
import type { Prompts, PromptKey } from "@/lib/simplex/types";
import { BrandBriefDatabase } from "./BrandBriefDatabase";

type Category =
  | "Global"
  | "Hooks"
  | "Video scripts"
  | "Carousel & graphic"
  | "Captions"
  | "Output structure"
  | "QA Checklist";

type Section = {
  id: PromptKey;
  number: string;
  label: string;
  category: Category;
  eyebrow: string;
  title: string;
  description: string;
  covers: string[];
  hint: string;
};

const SECTIONS: Section[] = [
  { id: "framework", number: "01", label: "Global Voice & Tone", category: "Global",
    eyebrow: "Foundation · runs before every prompt",
    title: "Global Voice & Tone",
    description: "The voice and tone bible. Runs before every other prompt — hook, script, caption, the whole batch. Edit this to shift the brand's overall feel: more direct vs warmer, more clinical vs more conversational. Doesn't control format or structure — those live in the per-step sections.",
    covers: ["Voice rules and energy", "Do / don't language", "The read-aloud test", "Anti-jargon and anti-template rules"],
    hint: "Edits here ripple through every output. Test with a small batch before deploying broadly." },
  { id: "briefReader", number: "02", label: "Session Brief Builder", category: "Global",
    eyebrow: "Onboarding · transforms brand brief files into the session brief",
    title: "Session Brief Builder",
    description: "Controls how the AI reads ALL attached brand brief files (in the Brand briefs field) plus the last 30 posts and produces the single editable Session Brief shown to the strategist. Defines the structure (Brand snapshot, Do's, Don'ts, Audience pain points, Brand expertise, Topics we've used before) and the rules for inferring audience pain points when the brief omits them. Downstream sections (Topic Research, Hooks, Scripts, Captions) consume the approved session brief verbatim — they do not need separate 'how to read it' instructions.",
    covers: ["Treat multiple brief files as one combined source", "Required session brief sections and order", "Audience pain points: inferred vs from brief, [INFERRED-NOTICE] / [INFERRED] rules", "Topics-we've-used-before labeling rules"],
    hint: "Be specific about each section's structure — this prompt directly shapes what the strategist sees and approves." },
  { id: "topicResearch", number: "03", label: "Topic Research", category: "Global",
    eyebrow: "Discovery · step 5",
    title: "Topic Research",
    description: "How the AI selects topics for the batch. Controls the trending-vs-evergreen split, what makes a high-resonance topic, what to avoid, and how to lean on the analysis report when one is attached. Doesn't affect hook style or script body — only topic selection.",
    covers: ["Trending vs core split (50/50 by default)", "Trending-topic sourcing rules", "High-resonance signals to favor", "Low-resonance signals to avoid", "How to use the analysis report"],
    hint: "The analysis report (when attached) is the strongest signal — keep instructions for leaning on it." },
  { id: "hookTalking", number: "04", label: "Talking Video Hook", category: "Hooks",
    eyebrow: "Hooks · step 7 · Talking Video only",
    title: "Talking Video Hook",
    description: "Rules for the two hooks the AI writes for every Talking Video script — a visual hook (text overlay in the first 3 seconds) and a spoken hook (the first line the speaker says). Edit to change hook style, length, or what feels on-brand. Doesn't affect B-roll, Carousel, or Graphic hooks.",
    covers: ["Visual hook rules (overlay, max 10 words)", "Spoken hook rules (read-aloud, 2-3 seconds)", "Patterns that work", "Phrases never to start with"],
    hint: "Talking Videos are the only format with both visual and spoken hooks. Keep both pieces covered." },
  // B-roll has a single combined panel below (text overlay). No separate hook panel.
  { id: "hookCarousel", number: "06", label: "Carousel Hook", category: "Hooks",
    eyebrow: "Hooks · step 7 · Carousel only",
    title: "Carousel Hook",
    description: "Rules for the cover slide (slide 1) of a carousel — a carousel is a MULTI-slide post made of a cover, several copy slides and a CTA slide. Has to stop the scroll AND give a reason to swipe to slide 2 — a different job than a video hook. Doesn't affect any other format.",
    covers: ["Headline length (3-8 words)", "Optional supporting body line", "Swipe-promise patterns", "Patterns to avoid"],
    hint: "Carousel hooks must tease the payoff coming in later slides. Watch for prompts that drop this." },
  { id: "hookGraphic", number: "07", label: "Graphic Hook", category: "Hooks",
    eyebrow: "Hooks · step 7 · Graphic only",
    title: "Graphic Hook",
    description: "Rules for the main copy on a graphic — a graphic is ONE single slide image with a text overlay, no swiping. There's no slide 2 to bail you out — the hook IS the payoff. Doesn't affect any other format.",
    covers: ["Headline length (5-12 words)", "Optional supporting line", "Quotable / shareable patterns", "Patterns that don't fit single-image"],
    hint: "Graphics live or die on the hook. Don't let the prompt borrow from video hook patterns." },
  { id: "talkingScriptFleshed", number: "08", label: "Talking Script · Fleshed", category: "Video scripts",
    eyebrow: "Scripting · step 9 · Talking, fleshed",
    title: "Talking Script · Fleshed",
    description: "Full, ready-to-record scripts for Talking Video. The AI writes complete spoken dialogue the speaker records verbatim. The section markers (── VISUAL HOOK ──, ── SCRIPT ──, ── ON-SCREEN CTA ──) are system-locked — your guidelines shape what goes INSIDE each section. Doesn't affect B-roll, Carousel, or Graphic.",
    covers: ["How to structure the body", "Length target (30-45 seconds, 100-180 words)", "Voice rules for scripted dialogue", "How to land the CTA naturally"],
    hint: "Section markers are locked in code. Edit what goes BETWEEN them, not the structure itself." },
  { id: "talkingScriptFramework", number: "09", label: "Talking Script · Framework", category: "Video scripts",
    eyebrow: "Scripting · step 9 · Talking, framework",
    title: "Talking Script · Framework",
    description: "Same as Fleshed but with [PLACEHOLDERS] in the body for the client to fill in with their own stories. Hook and closing CTA stay fully written — only the middle uses brackets. Doesn't affect any other format or Fleshed mode.",
    covers: ["How to write placeholders", "Which bracket styles to use", "Which parts to fully write vs leave open"],
    hint: "Placeholders only live in the BODY. If the hook or CTA uses them, the script feels half-written." },
  { id: "brollScript", number: "10", label: "B-roll Text Overlay", category: "Video scripts",
    eyebrow: "Scripting · step 9 · B-roll only",
    title: "B-roll Text Overlay",
    description: "",
    covers: ["What a B-roll overlay is (single line, no sequence)", "Length and specificity rules", "Hook patterns that work muted", "Format examples (DO / DON'T)"],
    hint: "B-roll is ONE overlay line — no beats, no footage cues, no separate hook prompt. Everything lives here." },
  { id: "videoOnScreenCta", number: "11", label: "Video On-Screen CTA", category: "Video scripts",
    eyebrow: "CTA · used in every video script",
    title: "Video On-Screen CTA",
    description: "The 3-5 word CTA graphic shown in the final 3 seconds of any video (Talking or B-roll). If the batch has a CTA / lead magnet set, the AI ties to it automatically. Doesn't affect Carousel or Graphic CTAs.",
    covers: ["Length (3-5 words max)", "Action verb / imperative tone rule", "How to tie to the batch's lead magnet"],
    hint: "Shared between Talking and B-roll. Don't write rules specific to either format alone." },
  { id: "carouselSlides", number: "12", label: "Carousel Slides", category: "Carousel & graphic",
    eyebrow: "Slide content · step 9 · Carousel only",
    title: "Carousel Slides",
    description: "The copy slides between the cover slide and the CTA slide of a carousel. Each slide carries its own copy. Slide count is variable (4-10 slides total) — your prompt tells the AI when to push for more vs fewer. Doesn't affect the hook slide, CTA slide, or Graphic format.",
    covers: ["When to use few slides (3-5) vs many (6-9)", "Headline / body length per slide", "Narrative arc across slides", "What kinds of content don't fit a slide"],
    hint: "The slide-count decision lives here. Be specific about when to add slides or the AI defaults to too few." },
  { id: "graphicCopy", number: "13", label: "Graphic Copy", category: "Carousel & graphic",
    eyebrow: "Single-image content · step 9 · Graphic only",
    title: "Graphic Copy",
    description: "Copy for a graphic: one single slide image with a text overlay (no slides to swipe). The hook is handled separately — this controls anything else that ends up on the image (supporting line, attribution, small captions). Doesn't affect Carousel or video formats.",
    covers: ["When to add supporting copy vs keep it minimal", "Layout-aware rules", "When the AI should recommend Carousel instead"],
    hint: "Graphics are minimalist by nature. If the AI is writing too much here, the prompt may be pushing it." },
  { id: "carouselCta", number: "14", label: "Carousel CTA", category: "Carousel & graphic",
    eyebrow: "Final slide · used in every carousel",
    title: "Carousel CTA",
    description: "The final CTA slide of a carousel — headline + body. Every carousel ships with cover, copy slides and this CTA slide. If the batch has a CTA / lead magnet set, the AI ties to it automatically. Doesn't affect any video or graphic format.",
    covers: ["Headline length (3-6 words)", "Body line explaining next step", "How to tie to the batch's lead magnet", "Match-the-brand's-actual-offer rule"],
    hint: "Keep the 'don't invent CTAs the brand can't fulfill' rule — it's the most-broken one without explicit guidance." },
  { id: "graphicCta", number: "15", label: "Graphic CTA", category: "Carousel & graphic",
    eyebrow: "CTA · integrated into graphics",
    title: "Graphic CTA",
    description: "The CTA element of a single-image graphic — usually a small strip at the bottom or integrated into the design. Must be readable at thumbnail size. Doesn't affect video or carousel CTAs.",
    covers: ["Length (under 7 words total)", "Readability at thumbnail size", "Tone-matching to the rest of the image"],
    hint: "Graphic CTAs must work at thumbnail size. Length rule matters more than tone here." },
  { id: "productionCreativeInstructions", number: "16", label: "Production Creative Instructions", category: "Carousel & graphic",
    eyebrow: "Production notes · extra AI call after each script",
    title: "Production Creative Instructions",
    description: "Controls the extra AI call that creates Inspo, Filming Guidelines and Creative Instructions from the finished script. These notes travel with the script into production.",
    covers: ["Inspo direction", "Filming Guidelines for video", "Creative execution notes", "No invented assets"],
    hint: "Keep this practical for editors and designers — it should not rewrite the script." },
  { id: "captionInstagram", number: "17", label: "Instagram Caption", category: "Captions",
    eyebrow: "Captions · step 11 · Instagram",
    title: "Instagram Caption",
    description: "Rules for the Instagram caption on every piece of content. All 4 caption platforms generate together in one API call — your guidelines apply only to the Instagram slice. Doesn't affect Facebook, TikTok, or YouTube.",
    covers: ["Hook-body-conclusion shape", "Hashtag count (max 5)", "Link policy ('link in bio' only)", "Length (3-8 lines)", "Emoji rules"],
    hint: "Instagram's bio-link constraint matters — keep the 'link in bio' rule explicit." },
  { id: "captionFacebook", number: "18", label: "Facebook Caption", category: "Captions",
    eyebrow: "Captions · step 11 · Facebook",
    title: "Facebook Caption",
    description: "Rules for the Facebook caption. Facebook audiences read more than Instagram audiences, so longer-form is fine. All 4 caption platforms generate together in one API call — your guidelines apply only to the Facebook slice.",
    covers: ["Hook-body-conclusion shape (no labels)", "No hashtags rule", "Link policy (direct URLs OK)", "Length (longer than IG)", "Conversational tone"],
    hint: "Don't carry Instagram's 'link in bio' rule into Facebook. Direct URLs work here." },
  { id: "captionTiktok", number: "19", label: "TikTok Caption", category: "Captions",
    eyebrow: "Captions · step 11 · TikTok",
    title: "TikTok Caption",
    description: "Rules for the TikTok caption. Short, raw, less produced than Instagram. All 4 caption platforms generate together in one API call — your guidelines apply only to the TikTok slice.",
    covers: ["Length (1-3 lines max)", "Hashtag count (2-4)", "Link policy (caption links OK)", "Raw / unpolished tone", "Emoji rules"],
    hint: "TikTok rewards authenticity. Don't let the prompt make captions feel produced or marketing-y." },
  { id: "captionYoutube", number: "20", label: "YouTube Caption", category: "Captions",
    eyebrow: "Captions · step 11 · YouTube",
    title: "YouTube Caption",
    description: "Rules for the YouTube Shorts caption. YouTube truncates aggressively — the first 1-2 visible lines do all the work. All 4 caption platforms generate together in one API call — your guidelines apply only to the YouTube slice.",
    covers: ["Visible-line strategy (above-the-fold)", "Lead-line rule (most important claim first)", "Hashtag count (2-4)", "SEO-keyword awareness", "Length and closing"],
    hint: "The lead-line rule is the most important one here. Don't weaken it." },
  { id: "outputTopics", number: "21", label: "Topics · Output", category: "Output structure",
    eyebrow: "Output structure · block 3 of the command prompt",
    title: "Topics — Output structure",
    description: "The exact output structure the AI must return for Topics. Sent as the OUTPUT STRUCTURE block of the single command prompt for this deliverable. The app parses this output, so changing section markers or JSON keys will break parsing.",
    covers: ["Section markers or JSON shape", "Field names and order", "Counts and limits"],
    hint: "Only edit if you also expect the app to parse the new shape." },
  { id: "outputHookTalking", number: "22", label: "Talking Video Hook · Output", category: "Output structure",
    eyebrow: "Output structure · block 3 of the command prompt",
    title: "Talking Video Hook — Output structure",
    description: "The exact output structure the AI must return for Talking Video Hook. Sent as the OUTPUT STRUCTURE block of the single command prompt for this deliverable. The app parses this output, so changing section markers or JSON keys will break parsing.",
    covers: ["Section markers or JSON shape", "Field names and order", "Counts and limits"],
    hint: "Only edit if you also expect the app to parse the new shape." },
  { id: "outputHookCarousel", number: "23", label: "Carousel Hook · Output", category: "Output structure",
    eyebrow: "Output structure · block 3 of the command prompt",
    title: "Carousel Hook — Output structure",
    description: "The exact output structure the AI must return for Carousel Hook. Sent as the OUTPUT STRUCTURE block of the single command prompt for this deliverable. The app parses this output, so changing section markers or JSON keys will break parsing.",
    covers: ["Section markers or JSON shape", "Field names and order", "Counts and limits"],
    hint: "Only edit if you also expect the app to parse the new shape." },
  { id: "outputHookGraphic", number: "24", label: "Graphic Hook · Output", category: "Output structure",
    eyebrow: "Output structure · block 3 of the command prompt",
    title: "Graphic Hook — Output structure",
    description: "The exact output structure the AI must return for Graphic Hook. Sent as the OUTPUT STRUCTURE block of the single command prompt for this deliverable. The app parses this output, so changing section markers or JSON keys will break parsing.",
    covers: ["Section markers or JSON shape", "Field names and order", "Counts and limits"],
    hint: "Only edit if you also expect the app to parse the new shape." },
  { id: "outputTalkingFleshed", number: "25", label: "Talking Script · Fleshed · Output", category: "Output structure",
    eyebrow: "Output structure · block 3 of the command prompt",
    title: "Talking Script · Fleshed — Output structure",
    description: "The exact output structure the AI must return for Talking Script · Fleshed. Sent as the OUTPUT STRUCTURE block of the single command prompt for this deliverable. The app parses this output, so changing section markers or JSON keys will break parsing.",
    covers: ["Section markers or JSON shape", "Field names and order", "Counts and limits"],
    hint: "Only edit if you also expect the app to parse the new shape." },
  { id: "outputTalkingFramework", number: "26", label: "Talking Script · Framework · Output", category: "Output structure",
    eyebrow: "Output structure · block 3 of the command prompt",
    title: "Talking Script · Framework — Output structure",
    description: "The exact output structure the AI must return for Talking Script · Framework. Sent as the OUTPUT STRUCTURE block of the single command prompt for this deliverable. The app parses this output, so changing section markers or JSON keys will break parsing.",
    covers: ["Section markers or JSON shape", "Field names and order", "Counts and limits"],
    hint: "Only edit if you also expect the app to parse the new shape." },
  { id: "outputBroll", number: "27", label: "B-roll Text Overlay · Output", category: "Output structure",
    eyebrow: "Output structure · block 3 of the command prompt",
    title: "B-roll Text Overlay — Output structure",
    description: "The exact output structure the AI must return for B-roll Text Overlay. Sent as the OUTPUT STRUCTURE block of the single command prompt for this deliverable. The app parses this output, so changing section markers or JSON keys will break parsing.",
    covers: ["Section markers or JSON shape", "Field names and order", "Counts and limits"],
    hint: "Only edit if you also expect the app to parse the new shape." },
  { id: "outputCarousel", number: "28", label: "Carousel Slides · Output", category: "Output structure",
    eyebrow: "Output structure · block 3 of the command prompt",
    title: "Carousel Slides — Output structure",
    description: "The exact output structure the AI must return for Carousel Slides. Sent as the OUTPUT STRUCTURE block of the single command prompt for this deliverable. The app parses this output, so changing section markers or JSON keys will break parsing.",
    covers: ["Section markers or JSON shape", "Field names and order", "Counts and limits"],
    hint: "Only edit if you also expect the app to parse the new shape." },
  { id: "outputGraphic", number: "29", label: "Graphic Copy · Output", category: "Output structure",
    eyebrow: "Output structure · block 3 of the command prompt",
    title: "Graphic Copy — Output structure",
    description: "The exact output structure the AI must return for Graphic Copy. Sent as the OUTPUT STRUCTURE block of the single command prompt for this deliverable. The app parses this output, so changing section markers or JSON keys will break parsing.",
    covers: ["Section markers or JSON shape", "Field names and order", "Counts and limits"],
    hint: "Only edit if you also expect the app to parse the new shape." },
  { id: "outputProductionMeta", number: "30", label: "Production Creative Instructions · Output", category: "Output structure",
    eyebrow: "Output structure · production-note call",
    title: "Production Creative Instructions — Output structure",
    description: "The exact output structure the AI must return for the extra production-note call. The app parses this JSON into Inspo, Filming Guidelines and Creative Instructions.",
    covers: ["JSON shape", "Field names", "Video vs design rules"],
    hint: "Changing JSON keys here will break parsing unless the app is updated too." },
  { id: "outputCaptions", number: "31", label: "Captions · Output", category: "Output structure",
    eyebrow: "Output structure · block 3 of the command prompt",
    title: "Captions — Output structure",
    description: "The exact output structure the AI must return for Captions. Sent as the OUTPUT STRUCTURE block of the single command prompt for this deliverable. The app parses this output, so changing section markers or JSON keys will break parsing.",
    covers: ["Section markers or JSON shape", "Field names and order", "Counts and limits"],
    hint: "Only edit if you also expect the app to parse the new shape." },
  { id: "qaChecklistTopics", number: "32", label: "Topics · QA", category: "QA Checklist",
    eyebrow: "QA · block 4 of the command prompt",
    title: "Topics — QA checklist",
    description: "The final-pass checklist the AI runs its own Topics draft against before returning it. Sent as the QA CHECKLIST block of the single command prompt for this deliverable.",
    covers: ["Non-negotiable standards", "Rewrite-and-recheck rules", "Brand do's / don'ts enforcement"],
    hint: "Add an item here whenever a recurring miss shows up in output." },
  { id: "qaChecklistHookTalking", number: "33", label: "Talking Video Hook · QA", category: "QA Checklist",
    eyebrow: "QA · block 4 of the command prompt",
    title: "Talking Video Hook — QA checklist",
    description: "The final-pass checklist the AI runs its own Talking Video Hook draft against before returning it. Sent as the QA CHECKLIST block of the single command prompt for this deliverable.",
    covers: ["Non-negotiable standards", "Rewrite-and-recheck rules", "Brand do's / don'ts enforcement"],
    hint: "Add an item here whenever a recurring miss shows up in output." },
  { id: "qaChecklistHookCarousel", number: "34", label: "Carousel Hook · QA", category: "QA Checklist",
    eyebrow: "QA · block 4 of the command prompt",
    title: "Carousel Hook — QA checklist",
    description: "The final-pass checklist the AI runs its own Carousel Hook draft against before returning it. Sent as the QA CHECKLIST block of the single command prompt for this deliverable.",
    covers: ["Non-negotiable standards", "Rewrite-and-recheck rules", "Brand do's / don'ts enforcement"],
    hint: "Add an item here whenever a recurring miss shows up in output." },
  { id: "qaChecklistHookGraphic", number: "35", label: "Graphic Hook · QA", category: "QA Checklist",
    eyebrow: "QA · block 4 of the command prompt",
    title: "Graphic Hook — QA checklist",
    description: "The final-pass checklist the AI runs its own Graphic Hook draft against before returning it. Sent as the QA CHECKLIST block of the single command prompt for this deliverable.",
    covers: ["Non-negotiable standards", "Rewrite-and-recheck rules", "Brand do's / don'ts enforcement"],
    hint: "Add an item here whenever a recurring miss shows up in output." },
  { id: "qaChecklistTalking", number: "36", label: "Talking Video Script · QA", category: "QA Checklist",
    eyebrow: "QA · block 4 of the command prompt",
    title: "Talking Video Script — QA checklist",
    description: "The final-pass checklist the AI runs its own Talking Video Script draft against before returning it. Sent as the QA CHECKLIST block of the single command prompt for this deliverable.",
    covers: ["Non-negotiable standards", "Rewrite-and-recheck rules", "Brand do's / don'ts enforcement"],
    hint: "Add an item here whenever a recurring miss shows up in output." },
  { id: "qaChecklistBroll", number: "37", label: "B-roll Text Overlay · QA", category: "QA Checklist",
    eyebrow: "QA · block 4 of the command prompt",
    title: "B-roll Text Overlay — QA checklist",
    description: "The final-pass checklist the AI runs its own B-roll Text Overlay draft against before returning it. Sent as the QA CHECKLIST block of the single command prompt for this deliverable.",
    covers: ["Non-negotiable standards", "Rewrite-and-recheck rules", "Brand do's / don'ts enforcement"],
    hint: "Add an item here whenever a recurring miss shows up in output." },
  { id: "qaChecklistCarousel", number: "38", label: "Carousel Slides · QA", category: "QA Checklist",
    eyebrow: "QA · block 4 of the command prompt",
    title: "Carousel Slides — QA checklist",
    description: "The final-pass checklist the AI runs its own Carousel Slides draft against before returning it. Sent as the QA CHECKLIST block of the single command prompt for this deliverable.",
    covers: ["Non-negotiable standards", "Rewrite-and-recheck rules", "Brand do's / don'ts enforcement"],
    hint: "Add an item here whenever a recurring miss shows up in output." },
  { id: "qaChecklistGraphic", number: "39", label: "Graphic Copy · QA", category: "QA Checklist",
    eyebrow: "QA · block 4 of the command prompt",
    title: "Graphic Copy — QA checklist",
    description: "The final-pass checklist the AI runs its own Graphic Copy draft against before returning it. Sent as the QA CHECKLIST block of the single command prompt for this deliverable.",
    covers: ["Non-negotiable standards", "Rewrite-and-recheck rules", "Brand do's / don'ts enforcement"],
    hint: "Add an item here whenever a recurring miss shows up in output." },
  { id: "qaChecklistProductionMeta", number: "40", label: "Production Creative Instructions · QA", category: "QA Checklist",
    eyebrow: "QA · production-note call",
    title: "Production Creative Instructions — QA checklist",
    description: "The final-pass checklist for production notes generated after each script.",
    covers: ["Practicality", "Format-specific directions", "No invented production details"],
    hint: "Add recurring editor/designer misses here." },
  { id: "qaChecklistCaptions", number: "41", label: "Captions · QA", category: "QA Checklist",
    eyebrow: "QA · block 4 of the command prompt",
    title: "Captions — QA checklist",
    description: "The final-pass checklist the AI runs its own Captions draft against before returning it. Sent as the QA CHECKLIST block of the single command prompt for this deliverable.",
    covers: ["Non-negotiable standards", "Rewrite-and-recheck rules", "Brand do's / don'ts enforcement"],
    hint: "Add an item here whenever a recurring miss shows up in output." },
];

const CATEGORY_ORDER: Category[] = [
  "Global",
  "Hooks",
  "Video scripts",
  "Carousel & graphic",
  "Captions",
  "Output structure",
  "QA Checklist",
];

function wordCount(s: string) {
  const t = s.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export function SettingsModal({
  open,
  onClose,
  prompts,
  setPrompts,
  onLockAdmin,
  accessCode = "",
}: {
  open: boolean;
  onClose: () => void;
  prompts: Prompts;
  setPrompts: (p: Prompts) => void;
  onLockAdmin?: () => void;
  accessCode?: string;
}) {
  const [activeKey, setActiveKey] = useState<PromptKey | "__brandBriefs__">("framework");
  const [drafts, setDrafts] = useState<Prompts>(prompts);
  // Keep drafts in sync if the parent's prompts reference changes (e.g. after default updates).
  useEffect(() => { setDrafts(prompts); }, [prompts]);
  const [editedAt, setEditedAt] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveVerified, setSaveVerified] = useState<string | null>(null);
  const [openCats, setOpenCats] = useState<Record<Category, boolean>>(() => {
    const initialCat = SECTIONS.find((s) => s.id === "framework")!.category;
    return {
      Global: initialCat === "Global",
      Hooks: initialCat === "Hooks",
      "Video scripts": initialCat === "Video scripts",
      "Carousel & graphic": initialCat === "Carousel & graphic",
      Captions: initialCat === "Captions",
      "Output structure": initialCat === "Output structure",
      "QA Checklist": initialCat === "QA Checklist",
    };
  });

  const grouped = useMemo(() => {
    const map: Record<Category, Section[]> = {
      Global: [], Hooks: [], "Video scripts": [],
      "Carousel & graphic": [], Captions: [], "Output structure": [], "QA Checklist": [],
    };
    for (const s of SECTIONS) map[s.category].push(s);
    return map;
  }, []);

  if (!open) return null;

  const isBrandBriefs = activeKey === "__brandBriefs__";
  const current = !isBrandBriefs ? SECTIONS.find((s) => s.id === activeKey)! : null;
  const value = !isBrandBriefs ? drafts[activeKey as PromptKey] ?? "" : "";
  const editedTs = !isBrandBriefs ? editedAt[activeKey as PromptKey] : undefined;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    setSaveVerified(null);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts: drafts, accessCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Prompt save failed");
      if (!data.verified) throw new Error("Prompt save could not be verified. Please try again.");
      setPrompts(data.prompts || drafts);
      setSaveVerified(`Saved and verified ${Number(data.saved || 0)} prompt version${Number(data.saved || 0) === 1 ? "" : "s"}.`);
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Prompt save failed");
    } finally {
      setSaving(false);
    }
  };
  const handleResetOne = () => {
    if (isBrandBriefs) return;
    const key = activeKey as PromptKey;
    setDrafts({ ...drafts, [key]: DEFAULT_PROMPTS[key] });
    setEditedAt({ ...editedAt, [key]: Date.now() });
  };
  const handleResetAll = () => {
    if (confirm("Reset ALL prompt sections to defaults? This cannot be undone.")) {
      setDrafts(DEFAULT_PROMPTS);
      setEditedAt({});
    }
  };
  const pickSection = (id: PromptKey) => {
    setActiveKey(id);
    const cat = SECTIONS.find((s) => s.id === id)!.category;
    setOpenCats((c) => ({ ...c, [cat]: true }));
  };
  const toggleCat = (c: Category) =>
    setOpenCats((s) => ({ ...s, [c]: !s[c] }));

  const editedLabel = (() => {
    if (!editedTs) return "no edits this session";
    const m = Math.max(1, Math.round((Date.now() - editedTs) / 60000));
    if (m < 60) return `edited ${m}m ago`;
    const h = Math.round(m / 60);
    return `edited ${h}h ago`;
  })();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-6 overflow-y-auto">
      <div className="bg-[#1A1A1D] border border-[#F6F6F7]/10 w-full max-w-6xl my-auto rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F6F6F7]/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0c0d1a] flex flex-col items-center justify-center gap-[2px] ring-1 ring-[#F6F6F7]/10">
              <span className="block h-[2px] w-[16px] bg-[#4F6BFF] rounded-full" />
              <span className="block h-[2px] w-[10px] bg-[#4F6BFF] opacity-70 rounded-full" />
              <span className="block h-[2px] w-[16px] bg-[#4F6BFF] opacity-40 rounded-full" />
            </div>
            <div>
              <h3
                className="text-[#F6F6F7] text-base tracking-tight"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800 }}
              >
                Admin · Slate
              </h3>
              <p className="text-[11px] text-[#F6F6F7]/45 mt-0.5">
                {SECTIONS.length} prompt sections · {editedLabel}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#F6F6F7]/55 hover:text-[#F6F6F7] p-1.5 rounded-md hover:bg-[#F6F6F7]/[0.05]">
            <X size={18} />
          </button>
        </div>

        {/* Body grid */}
        <div className="grid grid-cols-12 max-h-[640px]">
          {/* Sidebar */}
          <aside className="col-span-4 border-r border-[#F6F6F7]/10 bg-[#F6F6F7]/[.015] max-h-[640px] overflow-y-auto">
            {CATEGORY_ORDER.map((cat) => {
              const items = grouped[cat];
              const isOpen = openCats[cat];
              return (
                <div key={cat}>
                  <button
                    onClick={() => toggleCat(cat)}
                    className="w-full flex items-center justify-between px-5 py-3 text-[10px] uppercase tracking-[.22em] text-[#F6F6F7]/40 font-semibold hover:text-[#F6F6F7]/70 transition"
                  >
                    <span>{cat}</span>
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                  {isOpen && items.map((s) => {
                    const active = s.id === activeKey;
                    return (
                      <button
                        key={s.id}
                        onClick={() => pickSection(s.id)}
                        className={`w-full text-left px-5 py-3.5 border-b border-[#F6F6F7]/[.06] border-l-2 transition ${
                          active
                            ? "border-l-[#4F6BFF] bg-[#4F6BFF]/[.06]"
                            : "border-l-transparent hover:bg-[#F6F6F7]/[.03]"
                        }`}
                      >
                        <div
                          className={`text-xs tracking-tight ${
                            active ? "text-[#4F6BFF]" : "text-[#F6F6F7]"
                          }`}
                          style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
                        >
                          {s.number} · {s.label}
                        </div>
                        <div className="text-[11px] text-[#F6F6F7]/50 font-light leading-snug mt-1">
                          {s.description.replace(/<[^>]+>/g, "")}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* Brand brief database (admin tool) */}
            <div className="mt-2">
              <div className="px-5 py-3 text-[10px] uppercase tracking-[.22em] text-[#F6F6F7]/40 font-semibold">
                Strategist tools
              </div>
              <button
                onClick={() => setActiveKey("__brandBriefs__")}
                className={`w-full text-left px-5 py-3.5 border-b border-[#F6F6F7]/[.06] border-l-2 transition ${
                  isBrandBriefs
                    ? "border-l-[#4F6BFF] bg-[#4F6BFF]/[.06]"
                    : "border-l-transparent hover:bg-[#F6F6F7]/[.03]"
                }`}
              >
                <div
                  className={`text-xs tracking-tight flex items-center gap-2 ${
                    isBrandBriefs ? "text-[#4F6BFF]" : "text-[#F6F6F7]"
                  }`}
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
                >
                  <Database size={12} /> Brand Brief Database
                </div>
                <div className="text-[11px] text-[#F6F6F7]/50 font-light leading-snug mt-1">
                  Upload a PDF brief per client. Auto-loaded when scripting.
                </div>
              </button>
            </div>

            {/* Phase 2 placeholder */}
            <div className="mt-2">
              <div className="px-5 py-3 text-[10px] uppercase tracking-[.22em] text-[#F6F6F7]/25 font-semibold">
                Analyze workflow
              </div>
              <div className="px-5 py-3.5 border-l-2 border-l-transparent text-[#F6F6F7]/30 cursor-not-allowed">
                <div className="text-xs flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}>
                  Analysis prompts
                  <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-[#F6F6F7]/15">phase 2</span>
                </div>
                <div className="text-[11px] font-light leading-snug mt-1">
                  Currently hardcoded in /api/analyse.ts
                </div>
              </div>
            </div>
          </aside>

          {isBrandBriefs ? (
            <BrandBriefDatabase />
          ) : current ? (
          /* Editor */
          <section className="col-span-8 p-6 flex flex-col max-h-[640px] overflow-y-auto">
            <div className="pb-5 border-b border-[#F6F6F7]/10 mb-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[13px] text-[#4F6BFF] mb-2">{current.eyebrow}</p>
                  <h2
                    className="text-2xl text-[#F6F6F7] tracking-tight"
                    style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800 }}
                  >
                    {current.title}
                  </h2>
                  <p
                    className="text-[13px] text-[#F6F6F7]/60 font-light mt-2 max-w-xl"
                    dangerouslySetInnerHTML={{
                      __html: current.description.replace(
                        /<strong>/g,
                        '<strong class="text-[#F6F6F7] font-medium">',
                      ),
                    }}
                  />
                </div>
                <button
                  onClick={handleResetOne}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 border border-[#F6F6F7]/15 hover:border-[#4F6BFF]/40 text-[#F6F6F7]/70 hover:text-[#4F6BFF] text-[11px] rounded-lg px-3 py-1.5 transition"
                >
                  <RotateCcw size={11} /> Reset to default
                </button>
              </div>
              <div className="mt-4 text-[11px] text-[#F6F6F7]/40">
                {editedTs ? editedLabel : "Unchanged this session"} · {wordCount(value)} words
              </div>
            </div>

            {current.covers && current.covers.length > 0 && (
              <div className="px-4 py-3 bg-[#F6F6F7]/[.03] border border-[#F6F6F7]/10 rounded-xl mb-4">
                <div className="text-[10px] uppercase tracking-[.2em] text-[#F6F6F7]/40 font-semibold mb-2">
                  What this prompt usually covers
                </div>
                <ul className="space-y-1 text-[#F6F6F7]/65 text-[12px] leading-relaxed">
                  {current.covers.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[#F6F6F7]/30">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-[#F6F6F7]/35 text-[11px] mt-2 italic">
                  Edit freely — but if you remove an element, the AI may drop it from the output.
                </div>
              </div>
            )}

            {(saveError || saveVerified) && (
              <div className={`mb-4 px-4 py-3 rounded-xl border text-[12px] ${
                saveError
                  ? "bg-[#9b2c2c]/10 border-[#9b2c2c]/30 text-[#ff9a9a]"
                  : "bg-[#2f7d45]/10 border-[#2f7d45]/30 text-[#9be7ad]"
              }`}>
                {saveError || saveVerified}
              </div>
            )}

            <textarea
              value={value}
              onChange={(e) => {
                setDrafts({ ...drafts, [activeKey]: e.target.value });
              }}
              onBlur={() => setEditedAt({ ...editedAt, [activeKey]: Date.now() })}
              className="flex-1 mb-4 bg-[#0c0d1a] border border-[#F6F6F7]/10 rounded-xl text-[#F6F6F7]/90 text-[13px] leading-[1.7] px-5 py-4 focus:outline-none focus:border-[#4F6BFF]/40 placeholder:text-[#F6F6F7]/30 resize-none min-h-[300px]"
              style={{ fontFamily: "'Poppins', sans-serif" }}
              placeholder="Plain-English guidelines for this stage…"
            />

            <div className="flex items-start gap-3 px-4 py-3 bg-[#F6F6F7]/[.03] border border-[#F6F6F7]/10 rounded-xl mb-4">
              <Lightbulb size={14} className="text-[#4F6BFF] mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-[#F6F6F7]/55 leading-relaxed">{current.hint}</p>
            </div>

          </section>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#F6F6F7]/10 bg-[#F6F6F7]/[.02] flex justify-between items-center">
          <div className="flex items-center gap-5">
            <button
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#F6F6F7]/55 hover:text-[#4F6BFF] transition"
            >
              <RotateCcw size={11} /> Reset all to defaults
            </button>
            {onLockAdmin && (
              <button
                onClick={onLockAdmin}
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#F6F6F7]/55 hover:text-[#4F6BFF] transition"
              >
                <Lock size={11} /> Lock admin
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="border border-[#F6F6F7]/15 rounded-lg px-4 py-2 text-[12px] text-[#F6F6F7]/70 hover:text-[#F6F6F7] hover:border-[#F6F6F7]/30 font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-[#4F6BFF] text-white rounded-lg px-4 py-2 text-[12px] font-semibold hover:bg-[#6C7BFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={13} /> {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
