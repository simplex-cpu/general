export type Brief = {
  text: string;
  name: string;
  summary?: string;
  topicsToPrioritize?: string;
  languageToIncorporate?: string;
  languageToAvoid?: string;
  loading: boolean;
  error?: string;
};

export type Format = "talkingVideo" | "broll" | "carousel" | "graphic";
export type DesignSubtype = "quote" | "insightful";

export type PromptKey =
  // Global
  | "framework"
  | "briefReader"
  | "topicResearch"
  // Hooks (one per format)
  | "hookTalking"
  | "hookBroll"
  | "hookCarousel"
  | "hookGraphic"
  // Video scripts
  | "talkingScriptFleshed"
  | "talkingScriptFramework"
  | "brollScript"
  | "videoOnScreenCta"
  // Carousel & Graphic (separate)
  | "carouselSlides"
  | "graphicCopy"
  | "carouselCta"
  | "graphicCta"
  | "productionCreativeInstructions"
  // Captions
  | "captionInstagram"
  | "captionFacebook"
  | "captionTiktok"
  | "captionYoutube"
  // QA checklists (final pass run by the scripting bot) — one per deliverable
  | "qaChecklistTopics"
  | "qaChecklistHookTalking"
  | "qaChecklistHookCarousel"
  | "qaChecklistHookGraphic"
  | "qaChecklistTalking"
  | "qaChecklistBroll"
  | "qaChecklistCarousel"
  | "qaChecklistGraphic"
  | "qaChecklistProductionMeta"
  | "qaChecklistCaptions"
  // Output structure (was hardcoded in formats.ts) — one per deliverable
  | "outputTopics"
  | "outputHookTalking"
  | "outputHookCarousel"
  | "outputHookGraphic"
  | "outputTalkingFleshed"
  | "outputTalkingFramework"
  | "outputBroll"
  | "outputCarousel"
  | "outputGraphic"
  | "outputProductionMeta"
  | "outputCaptions";

export type Prompts = Record<PromptKey, string>;

export type CarouselSlide = {
  position: number;
  role: "hook" | "content" | "cta";
  headline: string;
  subtitle?: string;
  body?: string;
  actionLabel?: string;
};

export type Carousel = { slides: CarouselSlide[] };

export type VideoScript = {
  visualHook: string;
  script: string;
  onScreenCta: string;
};

export type Captions = {
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
};
