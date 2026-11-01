// One place to choose the AI model for each job. Change a model here and every
// call for that job follows; nothing else in the code names a model.
//
// Two routes reach the models:
// - Direct jobs call Anthropic's API (ANTHROPIC_API_KEY) and use plain Claude ids.
// - Gateway jobs call Lovable's AI gateway (LOVABLE_API_KEY); ids carry the
//   provider prefix ("anthropic/", "google/", "openai/").
//
// Before moving a job marked "forced tool call" to Claude Opus 5.5, Sonnet 5.5 or
// Fable 5.1: those models reject forced tool calls, so switch that request to
// structured outputs (output_config.format) first.
export const AI_MODELS = {
  // Script tab (direct)
  topics: "claude-opus-4-8",
  hooks: "claude-fable-5-1",
  script: "claude-fable-5-1",
  captions: "claude-sonnet-4-5-20250929", // forced tool call

  // Briefs, analysis and strategy (direct)
  analysis: "claude-opus-4-8",
  brandStrategy: "claude-opus-4-8", // forced tool call
  parseBrief: "claude-opus-4-8",
  parseScript: "claude-opus-4-8",
  divideScripts: "claude-sonnet-4-5-20250929", // forced tool call

  // Lovable gateway
  design: "anthropic/claude-opus-5-5",
  inspoRepurpose: "anthropic/claude-fable-5-1",
  ownPostRepurpose: "anthropic/claude-opus-5-5",
  sessionBrief: "google/gemini-3-flash-preview",
  adminBrandContext: "google/gemini-3-flash-preview",
  generalText: "openai/gpt-6-astra", // generateLovableText: post names, short rewrites
  inspoAnalysis: "openai/gpt-6-astra",
  inspoVideoText: "google/gemini-3.8-flash",
  slideText: "openai/gpt-6-astra",
  postVision: "google/gemini-3.6-flash",
  postVisionFallback: "google/gemini-2.5-flash",
  postTranscription: "openai/gpt-4o-transcribe",
  inspoTranscription: "openai/gpt-transcribe",
} as const;

export type AiJob = keyof typeof AI_MODELS;
