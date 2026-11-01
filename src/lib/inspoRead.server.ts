// Reads a saved-inspo URL end to end: post basics -> transcript or slide copy -> AI analysis.
import { AI_MODELS } from "./aiModels";
import { lookupInspoMetadata } from "./inspoMetadata.server";
import { PODCAST_TRANSCRIPTION_OPTIONS, timedPodcastTranscript, podcastWords, transcriptCoverage } from "./slate/podcastTranscript";
import {
  isSilentTranscript,
  isTopicFree,
  parseInspoAnalysis,
  readBranch,
  topicLeaks,
  type InspoAnalysis,
} from "./slate/inspoRead";

const MAX_AUDIO_BYTES = 24 * 1024 * 1024;
const LONG_TRANSCRIBER_ACTOR = "memo23~video-audio-transcriber";

/** Thrown when the media is too large for direct transcription and must use the long-video transcriber. */
export class LongMediaError extends Error {
  constructor() {
    super("LONG_MEDIA");
    this.name = "LongMediaError";
  }
}

export async function transcribeMedia(videoUrl: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const media = await fetch(videoUrl);
  if (!media.ok) throw new Error(`media fetch ${media.status}`);
  const blob = await media.blob();
  if (blob.size > MAX_AUDIO_BYTES) throw new LongMediaError();
  const form = new FormData();
  form.append("model", AI_MODELS.inspoTranscription);
  form.append("file", blob, "clip.mp4");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Transcription failed (${res.status})`);
  try {
    return String(JSON.parse(text)?.text || "");
  } catch {
    return "";
  }
}

/** Best-effort content-length probe; null when the server does not say. */
export async function probeContentLength(url: string): Promise<number | null> {
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    const n = Number(r.headers.get("content-length"));
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/** Starts the long-video transcriber (any URL, any length). Returns "runId:datasetId" to poll later. */
export async function startLongTranscription(url: string, podcast = false): Promise<string> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("APIFY_API_TOKEN not configured");
  const runOptions = podcast ? "?memory=8192&timeout=86400" : "";
  const r = await fetch(`https://api.apify.com/v2/acts/${LONG_TRANSCRIBER_ACTOR}/runs${runOptions}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ mediaUrls: [url], ...(podcast ? PODCAST_TRANSCRIPTION_OPTIONS : {}) }),
  });
  const d: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Apify [${r.status}]: ${JSON.stringify(d).slice(0, 200)}`);
  const run = d.data || {};
  if (!run.id || !run.defaultDatasetId) throw new Error("The transcriber did not start");
  return `${run.id}:${run.defaultDatasetId}`;
}

export type LongTranscriptionResult = { state: "running"; message?: string } | { state: "done"; text: string; title?: string; details?: any } | { state: "failed"; message: string };

/** Polls a started long transcription. */
export async function checkLongTranscription(runRef: string, podcast = false): Promise<LongTranscriptionResult> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("APIFY_API_TOKEN not configured");
  const [runId, datasetId] = runRef.split(":");
  if (!runId || !datasetId) return { state: "failed", message: "The transcription run reference is invalid" };
  const r = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, { headers: { Authorization: `Bearer ${token}` } });
  const d: any = await r.json().catch(() => ({}));
  if (!r.ok) return { state: "failed", message: "The transcription run could not be checked" };
  const status = String(d.data?.status || "");
  if (status === "RUNNING" || status === "READY") {
    let message = String(d.data?.statusMessage || "");
    if (/speaker/i.test(message)) {
      // Speaker-labelling progress is only written to the run log.
      const log = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/log`, { headers: { Authorization: `Bearer ${token}` } }).then((x) => (x.ok ? x.text() : "")).catch(() => "");
      const last = [...log.slice(-20000).matchAll(/diarization\s+(\d+)%/gi)].pop();
      if (last) message += ` diarization ${last[1]}%`;
    }
    return { state: "running", message };
  }
  if (status !== "SUCCEEDED") return { state: "failed", message: "The transcription did not finish" };
  const items = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items`, { headers: { Authorization: `Bearer ${token}` } });
  if (!items.ok) throw new Error("The completed transcript could not be retrieved. Try checking again.");
  const rows: any[] = (await items.json().catch(() => [])) as any[];
  // One input URL produces one dataset row according to the actor contract.
  // Never silently take the first row of an unexpected multipart result.
  if (!Array.isArray(rows) || rows.length !== 1) return { state: 'failed', message: 'The service did not return exactly one complete source result. Nothing was marked complete.' };
  const row = rows?.[0];
  if (podcast) {
    try {
      const text = timedPodcastTranscript(row);
      const words = podcastWords(row);
      return { state: "done", text, details: { coverage: transcriptCoverage(row), words }, title: typeof row?.title === "string" ? row.title : undefined };
    } catch (e) {
      return { state: "failed", message: e instanceof Error ? e.message : "The timed transcript could not be read" };
    }
  }
  const text = String(row?.text || "").trim();
  if (!text) return { state: "failed", message: String(row?.error || "No speech was found in this video") };
  return { state: "done", text };
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "format", "topic", "whyItWorks", "imageCopy"],
  properties: {
    title: { type: "string" },
    format: { type: "string", enum: ["Talking Video", "B-roll", "Carousel", "Graphic"] },
    topic: { type: "string" },
    whyItWorks: { type: "string" },
    imageCopy: { type: "string" },
  },
};

async function analyze(text: string, images: string[]): Promise<InspoAnalysis> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const content: any[] = [{ type: "input_text", text }];
  for (const url of images.slice(0, 10)) content.push({ type: "input_image", image_url: url });
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: AI_MODELS.inspoAnalysis,
      input: [{ role: "user", content }],
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      text: {
        format: { type: "json_schema", name: "inspo_analysis", strict: true, schema: SCHEMA },
      },
    }),
  });
  if (!res.ok || !res.body) {
    if (res.status === 402) throw new Error("AI credits have run out for this workspace.");
    if (res.status === 429) throw new Error("Too many requests right now. Try again in a minute.");
    throw new Error(`Analysis failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "",
    out = "";
  while (true) {
    const { value, done } = await reader.read();
    buf += decoder.decode(value, { stream: !done });
    const events = buf.split("\n\n");
    buf = events.pop() || "";
    for (const ev of events)
      for (const line of ev.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6);
        if (raw === "[DONE]") continue;
        const d = JSON.parse(raw);
        if (d.type === "response.output_text.delta") out += String(d.delta || "");
        if (d.type === "error") throw new Error(d.error?.message || "Analysis failed");
      }
    if (done) break;
  }
  return parseInspoAnalysis(out);
}

/** Reads on-screen text across a whole video with a video-capable model. */
export async function readVideoText(videoUrl: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const media = await fetch(videoUrl);
  if (!media.ok) throw new Error(`media fetch ${media.status}`);
  const buf = new Uint8Array(await media.arrayBuffer());
  if (buf.byteLength > 16 * 1024 * 1024) throw new Error("The video exceeds the on-screen text reader's size limit.");
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000)
    bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: AI_MODELS.inspoVideoText,
      stream: true,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Write out EVERY piece of on-screen text across the ENTIRE video, in order of appearance, preserving the complete wording, one line per text card. Start with one line beginning 'Hook:' containing ALL text visible on screen during the opening (first 0–3 seconds), complete and joined on that single line. Do not substitute the audio transcript, summarize or invent text. Then add one line starting 'Visuals:' describing the actual opening visual hook (first 0–3 seconds: action, framing, props and visible opening text). If there is no visible text, return only the Visuals line. No other commentary.",
            },
            { type: "image_url", image_url: { url: `data:video/mp4;base64,${btoa(bin)}` } },
          ],
        },
      ],
    }),
  });
  if (!res.ok || !res.body) throw new Error(`On-screen text reading failed (${res.status})`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let b = "",
    out = "";
  while (true) {
    const { value, done } = await reader.read();
    b += dec.decode(value, { stream: !done });
    const lines = b.split("\n");
    b = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
      out += JSON.parse(line.slice(6)).choices?.[0]?.delta?.content || "";
    }
    if (done) break;
  }
  return out.trim();
}

export type ReadEvent =
  | {
      step: "basics" | "content" | "analysis";
      status: "start" | "done" | "error";
      message?: string;
    }
  | { result: Record<string, string> };

export async function readInspo(url: string, emit: (e: ReadEvent) => void) {
  const result: Record<string, string> = {};
  emit({ step: "basics", status: "start" });
  let meta: Awaited<ReturnType<typeof lookupInspoMetadata>>;
  try {
    meta = await lookupInspoMetadata(url);
    for (const k of ["platform", "handle", "postedDate", "format", "views", "likes", "comments"] as const)
      if ((meta as any)[k]) result[k] = (meta as any)[k];
    if ((meta as any).imageUrls?.[0]) result.thumbnail = (meta as any).imageUrls[0];
    emit({ step: "basics", status: "done" });
    emit({ result: { ...result } });
  } catch (e: any) {
    emit({ step: "basics", status: "error", message: e?.message });
    return;
  }
  const m = meta as any;
  if (!m.copy && !m.videoUrl && !m.imageUrls?.length) return;
  const branch = readBranch(m);
  let transcript = "";
  emit({
    step: "content",
    status: "start",
    message: branch === "video" ? "Transcribing video" : "Reading slides",
  });
  if (branch === "video") {
    try {
      transcript = (await transcribeMedia(m.videoUrl)).trim();
      // A failed or empty first pass must not turn a talking video into a "no speech" B-roll.
      if (isSilentTranscript(transcript)) transcript = (await transcribeMedia(m.videoUrl).catch(() => "")).trim() || transcript;
      emit({ step: "content", status: "done" });
    } catch (e: any) {
      emit({
        step: "content",
        status: "error",
        message: e?.name === "LongMediaError" ? "This video is too long to read as inspo." : e?.message || "Transcription failed",
      });
    }
  } else emit({ step: "content", status: "done" });
  let onScreen = "";
  let visual = branch === "images";
  if (branch === "video" && isSilentTranscript(transcript)) {
    emit({ step: "content", status: "start", message: "Reading on-screen text" });
    try {
      onScreen = await readVideoText(m.videoUrl);
      visual = true;
      emit({ step: "content", status: "done" });
    } catch {
      visual = true;
      emit({
        step: "content",
        status: "error",
        message: "Only the cover and caption could be read.",
      });
    }
  }

  emit({ step: "analysis", status: "start" });
  try {
    const prompt = `You analyze a social media post that performed well so a creator can learn from it.
Platform: ${m.platform}
Caption: ${String(m.copy || "").slice(0, 4000)}
${branch === "images" ? "The attached images are the post's slides/graphic in order. Read every word on them." : onScreen ? `This video has no meaningful speech. On-screen text and visuals:\n${onScreen.slice(0, 8000)}` : visual ? "This video has no meaningful speech; the attached image is its cover." : `Video transcript: ${transcript.slice(0, 8000)}`}

Return JSON:
- title: a short brief of the post (max 10 words), no quotes.
- format: Talking Video (a person speaking to camera), B-roll (footage with text overlay, no direct speech), Carousel (multiple slides), or Graphic (one still image).${m.format ? ` A detector suggested "${m.format}".` : ""}
- topic: 2-5 words.
- whyItWorks: TOPIC-FREE, reusable in any industry. Never name the post's subject, niche, product, people or examples.
  Line 1: "Hook template: <the opening rewritten with neutral placeholders, e.g. Stop doing [common habit] if you want [desired result]>".
  Line 2: "Framework: <structure name, e.g. list, myth vs truth, before/after, mistake-fix> - <why its statements are powerful (specificity, contrast, certainty, curiosity gap)>".
  Then "Beats:" and 3-6 lines "- <beat role, e.g. pattern interrupt / tension / proof / payoff / loop>: <what this beat does psychologically, never what the post said>".
- imageCopy: ${branch === "images" ? 'all text read from the images, slide by slide ("Slide 1: ...")' : "empty string"}.`;
    const imgs =
      branch === "images" ? m.imageUrls : visual && !onScreen ? m.imageUrls.slice(0, 1) : [];
    let a = await analyze(prompt, imgs);
    const postText = [m.copy, transcript, onScreen, a.imageCopy].join(" ");
    if (!isTopicFree(a.whyItWorks, postText))
      a = await analyze(
        `${prompt}\n\nYour previous whyItWorks reused post-specific words (${topicLeaks(a.whyItWorks, postText).join(", ")}). Rewrite it fully topic-free with placeholders.`,
        imgs,
      );
    const copy =
      branch === "images" ? a.imageCopy || m.copy : onScreen || transcript || a.imageCopy || m.copy;
    Object.assign(result, {
      title: a.title,
      format: a.format,
      topic: a.topic,
      whyItWorks: a.whyItWorks,
      copy: String(copy || "").slice(0, 20000),
    });
    emit({ step: "analysis", status: "done" });
  } catch (e: any) {
    if (transcript) result.copy = transcript;
    else if (m.copy) result.copy = m.copy;
    emit({ step: "analysis", status: "error", message: e?.message });
  }
  emit({ result: { ...result } });
}
