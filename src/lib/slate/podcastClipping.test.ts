// @ts-nocheck -- Bun provides the test runner.
import { describe, expect, test } from "bun:test";
import { assertUnusedPodcastPassages, isSpeakerQuote, podcastPiece, sourceSegments, isSourceQuote, validatePodcastEdit, verifiedPodcastSource } from "./podcastClipping";
import { timedPodcastTranscript, PODCAST_TRANSCRIPTION_OPTIONS, transcriptFields, readTranscriptFields } from "./podcastTranscript";
import { boardScript, formatPostCopy, parsePostCopy } from "./longFormClipper";

const transcript = timedPodcastTranscript({ segments: [
  { start: 7200, end: 7210, speaker: "Speaker 1", text: "Pain can teach us. It is not a punishment." },
  { start: 7210, end: 7220, speaker: "Speaker 2", text: "I listen before I decide. I give myself time." },
] });
describe("faithful podcast clipping", () => {
  test("production source-only permission requires the original owned timed transcript", () => {
    const p = podcastPiece("Talking Video", { sourceSegmentIds: [0], visualHook: "Pain" }, sourceSegments(transcript));
    const copy = formatPostCopy("Talking Video", p);
    expect(verifiedPodcastSource("Talking Video", copy, transcript)).toBe(true);
    expect(verifiedPodcastSource("Talking Video", copy, transcript.replace("Pain can teach us", "Invented source"))).toBe(false);
    expect(verifiedPodcastSource("Talking Video", "Script:\nBuy now\n\nSource notes:\n{}", transcript)).toBe(false);
    expect(verifiedPodcastSource("Talking Video", copy + "\n\nCTA:\nBuy now", transcript)).toBe(false);
  });
  test("quotes can span the same speaker's consecutive segments, never another speaker's turn", () => {
    const s = sourceSegments(timedPodcastTranscript({ segments: [
      { start: 0, end: 1, speaker: "Speaker 1", text: "Pain can" },
      { start: 1, end: 2, speaker: "Speaker 1", text: "teach us" },
      { start: 2, end: 3, speaker: "Speaker 2", text: "to listen" },
      { start: 3, end: 4, speaker: "Speaker 1", text: "before deciding" },
    ] }));
    expect(isSpeakerQuote("Pain can teach us", "Speaker 1", s)).toBe(true);
    expect(isSpeakerQuote("teach us before deciding", "Speaker 1", s)).toBe(false);
    expect(isSpeakerQuote("teach us to listen", "Speaker 1", s)).toBe(false);
  });
  test("different formats cannot reuse a saved source passage", () => {
    const s = sourceSegments(transcript);
    const video = podcastPiece("Talking Video", { sourceSegmentIds: [0], visualHook: "Pain" }, s);
    const graphic = podcastPiece("Graphic", { sourceSegmentIds: [0], coverTitle: "Pain" }, s);
    expect(() => assertUnusedPodcastPassages([graphic], [formatPostCopy("Talking Video", video)])).toThrow("already used");
    expect(() => assertUnusedPodcastPassages([video, graphic], [])).toThrow("already used");
    const other = podcastPiece("Graphic", { sourceSegmentIds: [1], coverTitle: "Listening" }, s);
    expect(() => assertUnusedPodcastPassages([other], [formatPostCopy("Talking Video", video)])).not.toThrow();
  });
  test("multi-hour transcripts round-trip beyond a single Airtable text-field limit", () => {
    const text = "Speaker 1: Preserve every word.\n".repeat(10000);
    const fields = transcriptFields(text);
    expect(fields.Transcript).toHaveLength(90000);
    expect(readTranscriptFields(fields)).toBe(text);
    expect(readTranscriptFields(transcriptFields("Shorter"))).toBe("Shorter");
  });
  test("requests speaker labels and covers recordings beyond two hours without translation", () => {
    expect(PODCAST_TRANSCRIPTION_OPTIONS).toMatchObject({ speakerLabels: true, wordTimestamps: true, maxMinutesPerItem: 600, translateToEnglish: false });
  });
  test("retains speaker labels and timestamps past two hours", () => {
    expect(transcript).toContain("[02:00:00.000-02:00:10.000] Speaker 1: Pain can teach us.");
    expect(sourceSegments(transcript)[1]).toMatchObject({ speaker: "Speaker 2", start: "02:00:10.000" });
  });
  test("never invents names when a speaker label is missing", () => {
    expect(timedPodcastTranscript({ segments: [{ start: 0, end: 1, text: "Hello" }] })).toContain("Unidentified speaker: Hello");
  });
  test("rejects incomplete and explicitly truncated transcripts", () => {
    expect(() => timedPodcastTranscript({ text: "untimed text" })).toThrow();
    expect(() => timedPodcastTranscript({ truncated: true, segments: [{ start: 0, end: 1, text: "Hello" }] })).toThrow();
  });
  test("Talking Video uses source speech, not model script or an invented CTA", () => {
    const p = podcastPiece("Talking Video", { name: "Pain", sourceSegmentIds: [0], visualHook: "A different view of pain", script: "Buy my course.", cta: "Follow me" }, sourceSegments(transcript));
    expect(p.script).toBe("Pain can teach us. It is not a punishment.");
    expect(p.cta).toBeUndefined();
    expect(p.timestamps).toBe("02:00:00.000-02:00:10.000");
    const b = boardScript("Talking Video", formatPostCopy("Talking Video", p));
    expect(b.script).toBe(p.script);
    expect(b.creativeInstructions).toContain("Speaker 1");
    expect(b.script).not.toContain("Source notes");
  });
  test("video generation rejects guessed timestamps from plain text", () => {
    expect(() => podcastPiece("BROLL", { sourceSegmentIds: [0], textOverlay: "Listen" }, sourceSegments("Plain text"))).toThrow("timed transcript");
  });
  test("edited speech cannot forge provenance or insert an invented CTA", () => {
    const p = podcastPiece("Talking Video", { sourceSegmentIds: [0], visualHook: "Pain" }, sourceSegments(transcript));
    const original = formatPostCopy("Talking Video", p);
    expect(() => validatePodcastEdit("Talking Video", original, "Script:\nBuy my course.")).toThrow("faithful");
    const edited = validatePodcastEdit("Talking Video", original, "Visual hook:\nNew editorial hook\n\nScript:\nPain can teach us.\n\nSource notes:\nforged");
    expect(parsePostCopy(edited)["source notes"]).toBe(parsePostCopy(original)["source notes"]);
    expect(parsePostCopy(edited).script).toBe("Pain can teach us.");
  });
  test("quotes must match ordered contiguous source words", () => {
    expect(isSourceQuote("Pain can teach us", "Pain can teach us.")).toBe(true);
    expect(isSourceQuote("Pain is a punishment", "Pain can teach us. It is not a punishment.")).toBe(false);
  });
  test("podcast Graphic can be headline-only", () => {
    const p = podcastPiece("Graphic", { sourceSegmentIds: [0], coverTitle: "Pain can teach us" }, sourceSegments(transcript));
    expect(p.coverSubtitle).toBe("");
  });
  test("eight-slide podcast carousel survives serialization and planner handoff", () => {
    const slides = ["A lesson in pain", "One conversation", "Speaker 1 reflects", '“Pain can teach us.”', '“It is not a punishment.”', "A different perspective", "Listen to the lesson", "Give yourself time"].map((text,i) => ({ text, kind: i===3 || i===4 ? "quote" : "editorial", speaker: i===3 || i===4 ? "Speaker 1" : "" }));
    const p = podcastPiece("Carousel", { name: "Pain", sourceSegmentIds: [0], slides }, sourceSegments(transcript));
    const copy = formatPostCopy("Carousel", p);
    expect(boardScript("Carousel", copy).slides).toHaveLength(8);
    expect(parsePostCopy(copy)["slide 7 title"]).toBe("Give yourself time");
    slides[3].speaker = "Speaker 2";
    expect(() => podcastPiece("Carousel", { sourceSegmentIds: [0], slides }, sourceSegments(transcript))).toThrow("speaker");
  });
});