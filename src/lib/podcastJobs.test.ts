// @ts-nocheck -- Bun provides the test runner.
import { describe, expect, test } from "bun:test";
import { buildJobRequest, callbackProblems, contractSpeakers, finishedEvent, piecesFromResult, requestProblems, studioMarker } from "./podcastJobs.server";
import { normalizeRequest } from "./__fixtures__/podcast/normalize-request.mjs";
import completed from "./__fixtures__/podcast/completed.json";

const long: any = {
  id: "recAAAAAAAAAAAAAA1",
  name: "Episode",
  url: "https://youtube.com/watch?v=x",
  transcript: ["[0:10-0:15] A: Second line here.", "[0:02-0:08] B: First line here.", "[0:20-0:25] A: Third line."].join("\n"),
  speakerNames: { A: "Kash", B: "Guest" },
  speakerBios: "Kash: Host and coach\nGuest: Founder of a studio",
  clipCta: "",
  footageFile: "",
};
const jobId = "c53da83e-182d-4c63-86c9-53347310ae03";

describe("podcast studio request", () => {
  test("built request passes the package's own validation", () => {
    const body = buildJobRequest(long, { BROLL: 1, "Talking Video": 1 }, { jobId });
    expect(normalizeRequest(body).valid).toBe(true);
    expect(requestProblems(body)).toEqual([]);
  });
  test("transcript lines are sent in chronological order", () => {
    const body = buildJobRequest(long, { BROLL: 1, "Talking Video": 0 }, { jobId });
    expect(body.transcript.segments.map((s) => s.start_ms)).toEqual([2000, 10000, 20000]);
  });
  test("carousel and graphic are always zero", () => {
    const body = buildJobRequest(long, { BROLL: 2, "Talking Video": 3 }, { jobId });
    expect(body.counts).toEqual({ broll: 2, talking_clip: 3, carousel: 0, graphic: 0 });
  });
  test("a speaker without a bio gets a minimal factual fallback, never a made-up one", () => {
    const sp = contractSpeakers({ ...long, speakerBios: "Kash: Host" });
    const other = sp.find((s) => s.name !== "Kash");
    expect(other?.bio).toBe(`${other?.name} is a speaker in this recording.`);
    expect(sp.find((s) => s.name === "Kash")?.bio).toBe("Host");
  });
  test("audience and CTA reach campaign context", () => {
    const body = buildJobRequest(long, { BROLL: 1, "Talking Video": 0 }, { jobId, audience: "Founders", cta: "Comment GUIDE to get my guide" });
    expect(body.campaign_context.audience).toBe("Founders");
    expect(body.campaign_context.approved_cta).toBe("Comment GUIDE to get my guide");
  });
});

describe("podcast studio callback", () => {
  const body = finishedEvent.parse(completed);
  test("package example matches a job asking 1 + 1", () => {
    expect(callbackProblems(body, { BROLL: 1, "Talking Video": 1 })).toEqual([]);
  });
  test("requested counts that differ from the job are rejected", () => {
    expect(callbackProblems(body, { BROLL: 2, "Talking Video": 1 }).length).toBe(1);
  });
  test("delivered count must equal the scripts returned", () => {
    const bad = { ...body, results: { ...body.results, broll: { ...body.results.broll, delivered_count: 2 } } };
    expect(callbackProblems(bad, { BROLL: 1, "Talking Video": 1 }).length).toBe(1);
  });
  test("pieces keep timestamps and direction out of the script", () => {
    const [b] = piecesFromResult("BROLL", body.results.broll, body.job_id);
    const [t] = piecesFromResult("Talking Video", body.results.talking_clip, body.job_id);
    expect(b.sourceNotes).toBeUndefined();
    expect(t.sourceNotes).toBeUndefined();
    expect(b.textOverlay).toBe("Your first client just priced your entire weekend.");
    for (const l of t.timestamps.split("\n")) expect(l).toMatch(/^\d\d:\d\d:\d\d-\d\d:\d\d:\d\d$/);
    expect(t.script || "").not.toMatch(/\d\d:\d\d/);
    expect(t.creativeDirection).not.toMatch(/\d\d:\d\d:\d\d/);
  });
});

import { submitToN8n } from "./podcastJobs.server";
test("submit sends the shared X-Scripting-Callback-Key header", async () => {
  const orig = globalThis.fetch;
  let headers: any = null;
  globalThis.fetch = (async (_u: any, init: any) => { headers = init.headers; return new Response(JSON.stringify({ execution_id: "e1" }), { status: 202 }); }) as any;
  try { await submitToN8n("https://x.test/hook", "k", { job_id: "j" }); } catch {}
  globalThis.fetch = orig;
  expect(headers["X-Scripting-Callback-Key"]).toBe("k");
  expect(headers["X-Scripting-Key"]).toBeUndefined();
});

import { piecesFromResult as pieces33 } from "./podcastJobs.server";
import { formatPostCopy as fmt33, boardScript as board33 } from "./slate/longFormClipper";
test("v3.3 B-roll keeps fields separate and mirrors YouTube caption", () => {
  const [p] = pieces33("BROLL", { status: "generated", requested_count: 1, delivered_count: 1, review_status: "", scripts: [{ topic: "T", visual_hook: "Line one\nLine two", text_overlay: "Line one\nLine two", timestamps: "00:03:40-00:03:48; 00:04:02-00:04:12", creative_direction: "Slow push in.", captions: { instagram: "IG", facebook: "FB", tiktok: "TT" } }] } as any, "job");
  expect(p.textOverlay).toBe("Line one\nLine two");
  expect(p.creativeDirection).toBe("Slow push in.");
  expect(p.captions).toEqual({ instagram: "IG", facebook: "FB", tiktok: "TT", youtube: "TT" });
  const b: any = board33("BROLL", fmt33("BROLL", p));
  expect(b.script).toBe("Line one\nLine two");
  expect(b.captions.youtube).toBe("TT");
});
