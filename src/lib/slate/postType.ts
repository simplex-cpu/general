/**
 * Single source of truth for post categorisation.
 *
 * Order of decisions (deliberate):
 *   1. Media kind from the platform metadata: carousel / still graphic / video.
 *   2. Videos only: transcript evidence decides talking vs B-roll.
 *   3. Duration + audio metadata are tiebreakers, never the primary signal.
 *
 * The transcript is the only reliable signal for "a person is speaking", so it
 * outranks duration and audio flags. The catch is that Whisper happily
 * transcribes background music into confident-looking sentences, so anything
 * that smells like song lyrics is pushed back to B-roll.
 */

export type PostType = "talking" | "broll" | "carousel" | "graphic";
export type MediaKind = "video" | "carousel" | "graphic";

export const POST_TYPE_LABEL: Record<PostType, string> = {
  talking: "Talking video",
  broll: "B-roll",
  carousel: "Carousel",
  graphic: "Still graphic",
};

export interface PostTypeResult {
  type: PostType;
  reason: string;
}

const FIRST_SECOND_PERSON = /\b(i|i'm|i've|i'll|my|me|we|our|you|your|you're|let me|here's)\b/i;
const DIRECT_ADDRESS = /\b(why|how|what|when|isn't|don't|didn't|did you|imagine|think about|listen|look)\b/i;
const SPOKEN_FILLER = /\b(actually|literally|honestly|seriously|basically|obviously|right\?|okay|so)\b/i;

/** Song lyrics repeat lines and hooks far more than speech does. */
function repetitionRatio(text: string): number {
  const words = text.toLowerCase().match(/[a-z']+/g) || [];
  if (words.length < 12) return 0;
  const phrases = new Map<string, number>();
  for (let i = 0; i + 3 <= words.length; i++) {
    const k = words.slice(i, i + 3).join(" ");
    phrases.set(k, (phrases.get(k) || 0) + 1);
  }
  let repeated = 0;
  for (const n of phrases.values()) if (n > 1) repeated += n - 1;
  return repeated / Math.max(1, phrases.size);
}

/**
 * True when the transcript looks like music rather than someone talking:
 * heavy repetition, no first/second person, or an implausibly slow word rate
 * for speech.
 */
export function looksLikeMusic(transcript: string, duration?: number): boolean {
  const text = transcript.trim();
  if (!text) return false;
  const words = text.split(/\s+/).filter(Boolean).length;

  if (repetitionRatio(text) > 0.35) return true;
  // Missing pronouns alone is far too blunt: plenty of educational talking
  // videos are written in the third person. Only treat it as music when the
  // clip also shows no other sign of speech.
  if (words >= 15 && !FIRST_SECOND_PERSON.test(text) && speechScore(text) === 0) return true;
  if (typeof duration === "number" && duration >= 8) {
    const wps = words / duration;
    // Conversational speech sits around 2-3.5 words/sec. Well under 1 means
    // sparse lyrics or ambient audio over visuals.
    if (wps < 0.5) return true;
  }
  return false;
}


/** Score how much the transcript reads like a person speaking to camera. */
function speechScore(transcript: string): number {
  let score = 0;
  if (FIRST_SECOND_PERSON.test(transcript)) score++;
  if ((transcript.match(/[.!?]/g) || []).length >= 3) score++;
  if (DIRECT_ADDRESS.test(transcript)) score++;
  if (SPOKEN_FILLER.test(transcript)) score++;
  return score;
}

export function classifyPostType(input: {
  mediaKind?: MediaKind;
  transcript?: string;
  duration?: number;
  usesOriginalAudio?: boolean;
}): PostTypeResult {
  const kind = input.mediaKind || "video";
  if (kind === "carousel") return { type: "carousel", reason: "media_carousel" };
  if (kind === "graphic") return { type: "graphic", reason: "media_still_image" };

  const transcript = (input.transcript || "").trim();
  const words = transcript.split(/\s+/).filter(Boolean).length;
  const duration = input.duration;

  // No usable audio at all -> nothing is being said.
  if (words < 12) return { type: "broll", reason: "no_speech_in_audio" };

  if (looksLikeMusic(transcript, duration)) {
    return { type: "broll", reason: "audio_looks_like_music" };
  }

  const score = speechScore(transcript);

  // Substantive, speech-shaped transcript: talking video.
  if (words >= 40 && score >= 2) return { type: "talking", reason: "transcript_substantial_speech" };
  if (words >= 20 && score >= 3) return { type: "talking", reason: "transcript_speech_patterns" };

  // Borderline: fall back to the metadata tiebreakers.
  if (input.usesOriginalAudio === false) {
    return { type: "broll", reason: "borderline_nonoriginal_audio" };
  }
  if (typeof duration === "number" && duration < 12 && score < 2) {
    return { type: "broll", reason: "borderline_short_and_sparse" };
  }
  if (score >= 2) return { type: "talking", reason: "borderline_speech_patterns" };
  return { type: "broll", reason: "borderline_no_speech_patterns" };
}
