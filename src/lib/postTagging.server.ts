// Shared post transcription and Talking/B-roll verdicts, used by Analyze account and Refresh stats.
/** Gateway rejects bodies over 25 MiB. */
import { generateLovableText } from "./lovableResponses.server";
const MAX_AUDIO_BYTES = 24 * 1024 * 1024;

/* --------------------- Transcription --------------------- */

export async function transcribe(videoUrl: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const media = await fetch(videoUrl);
  if (!media.ok) throw new Error(`media fetch ${media.status}`);
  const blob = await media.blob();
  if (blob.size > MAX_AUDIO_BYTES) throw new Error("media too large");

  const form = new FormData();
  form.append("model", "openai/gpt-4o-transcribe");
  form.append("file", blob, "clip.mp4");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`transcribe ${res.status}: ${text.slice(0, 160)}`);
  try {
    return String(JSON.parse(text)?.text || "");
  } catch {
    return "";
  }
}

/**
 * Talking-vs-B-roll verdict for video posts.
 *
 * Audio alone cannot answer this: a voiceover over stock footage produces the
 * exact same transcript as a talking head. So the cover frame goes to a vision
 * model together with the transcript, and the two are judged as one:
 *
 *   person on camera + their own speech -> talking
 *   speech but nobody on camera         -> broll (voiceover)
 *   no meaningful speech                -> broll
 */
export type VideoVerdict = { type: "talking" | "broll"; reason: string; confidence: number };

export async function classifyVideo(input: {
  transcript: string;
  caption: string;
  duration: number;
  coverUrl: string;
  transcriptAvailable: boolean;
}): Promise<VideoVerdict | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;

  const transcript = input.transcript.trim();
  const content: any[] = [
    {
      type: "text",
      text:
        `Duration: ${input.duration || "unknown"}s\n` +
        `Caption: ${input.caption.slice(0, 400)}\n` +
        (input.transcriptAvailable
          ? `Audio transcript: ${transcript ? transcript.slice(0, 1800) : "(silent / no speech detected)"}`
          : "Audio transcript: (unavailable - the audio could not be retrieved, judge from the frame and caption)"),
    },
  ];
  if (input.coverUrl) {
    content.push({ type: "image_url", image_url: { url: input.coverUrl } });
  }

  // Reasoning tokens count against max_tokens on Gemini 3.x, so leave headroom
  // or the JSON comes back truncated.
  const ask = async (model: string, withImage: boolean): Promise<VideoVerdict | null> => {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You categorise short-form social videos as either a TALKING VIDEO or B-ROLL. You get the video's cover frame (if available), its audio transcript and its caption.\n\n" +
              "TALKING VIDEO = a person appears on camera delivering their own spoken words: piece to camera, selfie video, interview, podcast clip, vlog-style speaking. The person visible is the one talking.\n" +
              "B-ROLL = everything else. This explicitly INCLUDES voiceover over footage where nobody is shown speaking, footage set to music or a trending audio, text-on-screen videos, screen recordings, product/lifestyle footage, montages, and silent clips.\n\n" +
              "Rules:\n" +
              "1. A voiceover with no person visibly speaking on camera is B-ROLL, never talking.\n" +
              "2. Song lyrics in the transcript are never speech.\n" +
              "3. The cover frame is the FIRST frame only. A title card, text hook or product shot on frame one does not prove there is no talking head later, so when the transcript is clearly a person speaking directly (first/second person, direct address, an explanation or story in their own words) and the caption supports it, lean talking with lower confidence.\n" +
              "4. If a person's face fills the frame and the transcript is speech, that is talking with high confidence.\n" +
              "5. If the transcript is unavailable, judge from the frame: a person facing the camera mid-speech is talking, otherwise b-roll.\n\n" +
              'Reply ONLY with JSON: {"label":"talking"|"broll","personOnCamera":true|false,"speech":true|false,"confidence":0-1,"why":"max 12 words"}',
          },
          { role: "user", content: withImage ? content : content.filter((c) => c.type === "text") },
        ],
      }),
    });
    if (!res.ok) {
      console.warn("[scrape-posts] vision classify", model, res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const data: any = await res.json();
    const raw = String(data?.choices?.[0]?.message?.content || "");
    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { /* ignore */ } }
    }
    if (!parsed) return null;
    const label = String(parsed.label || "").toLowerCase();
    const type = label.includes("talk") ? "talking" : label.includes("roll") ? "broll" : null;
    if (!type) return null;
    const conf = Number(parsed.confidence);
    return {
      type,
      reason: `vision:${parsed.personOnCamera ? "person" : "noperson"}/${parsed.speech ? "speech" : "nospeech"}:${String(parsed.why || "").slice(0, 60)}`,
      confidence: Number.isFinite(conf) ? Math.max(0, Math.min(1, conf)) : 0.6,
    };
  };

  try {
    const hasImage = Boolean(input.coverUrl);
    return (
      (await ask("google/gemini-3.6-flash", hasImage)) ??
      // Cover URLs are signed CDN links the gateway sometimes cannot fetch.
      // Fall back to the transcript alone rather than losing the verdict.
      (hasImage ? await ask("google/gemini-3.6-flash", false) : null) ??
      (await ask("google/gemini-2.5-flash", hasImage))
    );
  } catch (e) {
    console.warn("[scrape-posts] vision classify failed", e);
    return null;
  }
}





/** Short topic pillar for one post; reuses an existing brand topic when it fits. */
export async function assignTopic(input: { transcript: string; caption: string; existing: string[] }): Promise<string> {
  const text = `${input.transcript}\n${input.caption}`.trim();
  if (!text) return "";
  try {
    const raw = await generateLovableText(`Name the topic pillar of this short-form social post in 2-5 words (a broad theme, not a headline). If one of the existing topics fits, return it exactly. Reply with the topic only, no quotes or punctuation.\n\nExisting topics: ${input.existing.slice(0, 30).join(" | ") || "(none)"}\n\nPost transcript and caption:\n${text.slice(0, 2000)}`);
    return raw.replace(/["*\n]+/g, " ").replace(/\s+/g, " ").trim().split(" ").slice(0, 6).join(" ").slice(0, 60);
  } catch (e) {
    console.warn("[post-tagging] topic", e);
    return "";
  }
}

/** Reads the visible text on a carousel/graphic image; "" when unreadable. */
export async function readSlideText(imageUrl: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key || !/^https:\/\//.test(imageUrl)) return "";
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST", headers: { "Lovable-API-Key": key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({ model: "openai/gpt-6-astra", stream: true, store: false, reasoning: { effort: "low" }, input: [{ role: "user", content: [
        { type: "input_text", text: "Transcribe all visible text on this social media slide exactly, top to bottom, one line per text block. Reply with the text only. If there is no text, reply with nothing." },
        { type: "input_image", image_url: imageUrl },
      ] }] }),
    });
    if (!res.ok || !res.body) { console.warn("[post-tagging] slide text", res.status); return ""; }
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "", out = "";
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        try { const ev = JSON.parse(line.slice(5)); if (ev.type === "response.output_text.delta") out += ev.delta || ""; } catch { /* keep-alive */ }
      }
    }
    return out.trim();
  } catch (e) { console.warn("[post-tagging] slide text", e); return ""; }
}
