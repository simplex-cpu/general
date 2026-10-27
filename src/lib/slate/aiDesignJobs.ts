// Background AI designs for planner posts. Jobs live in the browser tab (not in a
// component), so closing the card or leaving the planner doesn't stop them.
// Order per post: brand look -> art direction -> each slide drawn + reviewed ->
// all images rendered -> only then attached to Media to Post, in slide order.
import { graphicFrameStyle, readSimpleStyle } from "./brandVisualStyle";
import { buildCarouselFrames, buildGraphicFrame, renderFrameToFile, type DesignFrame } from "./designFrames";
import { fieldsToStructured, parseCarouselCopy } from "./slideFields";
import { designSlide, planSeries, svgToPngFile, fillPhotoSlots, AiDesignError, type AiBrandKit } from "./aiDesignClient";
import { uploadDirectToDrive } from "@/lib/driveDirectUpload";
import type { DesignSubtype } from "./designTemplates";

export type AiDesignPost = {
  id: string;
  postType?: string;
  postName?: string;
  script?: string;
  coverCopy?: string;
  slidesCopy?: string;
  ctaCopy?: string;
  brandIds?: string[];
  clientStatus?: string;
  /** Optional photos the user attached (URLs); the AI may place them as photo:1..N. */
  photos?: string[];
};

async function toDataUrl(url: string): Promise<string> {
  const blob = await fetch(url).then((r) => (r.ok ? r.blob() : Promise.reject(new Error("photo"))));
  return await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(blob); });
}

export type AiDesignJob = {
  id: string;
  state: "running" | "done" | "failed";
  step: string;
  current: number;
  total: number;
  error?: string;
  fallbackSlides?: number[];
  /** Run token: a retry starts a new run and the old one's results are ignored. */
  run?: number;
  /** Last time this job made progress (ms); the UI flags long silences as stalled. */
  updatedAt?: number;
};

/** No progress for this long means the run is treated as stalled and offers Retry. */
export const AI_DESIGN_STALL_MS = 4 * 60_000;
let runCounter = 0;

const jobs = new Map<string, AiDesignJob>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function subscribeAiDesign(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export const getAiDesignJob = (id: string) => jobs.get(id);
export const anyAiDesignRunning = () => [...jobs.values()].some((j) => j.state === "running");

function set(id: string, patch: Partial<AiDesignJob>) {
  jobs.set(id, { ...(jobs.get(id) as AiDesignJob), ...patch, updatedAt: Date.now() });
  emit();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (e) => {
    if (anyAiDesignRunning()) { e.preventDefault(); e.returnValue = ""; }
  });
}

/** Same frame building the template editor uses, so copy and brand input are identical. */
export function framesForPost(post: AiDesignPost, brief: Record<string, unknown>): DesignFrame[] {
  const isCarousel = /carousel/i.test(post.postType || "");
  const style = graphicFrameStyle(brief, !isCarousel);
  const marker = /design type:\s*(quote|insightful)/i.exec(post.script || "")?.[1]?.toLowerCase();
  if (isCarousel) {
    const parts = [post.coverCopy, post.slidesCopy, post.ctaCopy].filter(Boolean).join("\n\n").split(/\n\s*\n/).filter(Boolean);
    const subtype: DesignSubtype = marker === "insightful" || (!marker && parts.length >= 8) ? "insightful" : "quote";
    const slides = parseCarouselCopy(post, subtype === "insightful" ? 10 : 6);
    return buildCarouselFrames(fieldsToStructured(slides), style, subtype);
  }
  const copy = (post.slidesCopy || post.coverCopy || post.script || "").trim();
  const subtype: DesignSubtype = marker === "insightful" || (!marker && copy.split(/\n+/).filter(Boolean).length > 1) ? "insightful" : "quote";
  return [buildGraphicFrame(copy, style, undefined, subtype)];
}

type Deps = {
  accessCode: string;
  /** Moves the post's status; resolves to the saved record. */
  setStatus: (status: string) => Promise<unknown>;
  /** Called once the images are attached, with the record returned by the upload. */
  onAttached: (fields: Record<string, any>) => void;
};

export async function startAiDesign(post: AiDesignPost, deps: Deps, opts: { force?: boolean } = {}) {
  if (jobs.get(post.id)?.state === "running" && !opts.force) return;
  const run = ++runCounter;
  const alive = () => jobs.get(post.id)?.run === run;
  const step = (patch: Partial<AiDesignJob>) => { if (!alive()) throw new StaleRun(); set(post.id, patch); };
  const statusPrev = post.clientStatus || "To Edit | Design";
  const previous = /^in progress$/i.test(statusPrev) ? "To Edit | Design" : statusPrev;
  jobs.set(post.id, { id: post.id, state: "running", step: "Loading your brand", current: 0, total: 0, run, updatedAt: Date.now() });
  emit();
  try {
    await deps.setStatus("In Progress");
    const q = post.brandIds?.[0] ? `?brandId=${encodeURIComponent(post.brandIds[0])}` : "";
    const r = await fetch(`/api/my-brief${q}`, { headers: { "x-access-code": deps.accessCode } });
    const j: any = await r.json().catch(() => ({}));
    const briefFields = j?.brief?.fields || {};
    const frames = framesForPost(post, briefFields);
    const simple = readSimpleStyle(briefFields);
    const brand: AiBrandKit = { accents: simple.accents.length ? simple.accents : ["#4F6BFF"], lightInk: simple.lightInk, darkInk: "#1A1A1D", name: String(briefFields["Brand name"] || briefFields["Name"] || "") };
    if (simple.gradient.on) brand.gradient = [simple.gradient.start, simple.gradient.end];
    const photos = (await Promise.all((post.photos || []).slice(0, 10).map((u) => toDataUrl(u).catch(() => "")))).filter(Boolean);
    if (photos.length) brand.photoCount = photos.length;
    const total = frames.length;
    step({ step: "Planning the design", total });
    const plan = await planSeries(frames, deps.accessCode, brand).catch((e) => {
      if (e instanceof AiDesignError && [402, 403].includes(e.status)) throw e;
      return null;
    });
    const files: File[] = [];
    const fallbackSlides: number[] = [];
    const base = (post.postName || "design").replace(/[^\w-]+/g, "-").slice(0, 40) || "design";
    for (let i = 0; i < total; i++) {
      step({ step: `Designing slide ${i + 1} of ${total}`, current: i + 1 });
      const svg = await designSlide(frames, i, deps.accessCode, plan, brand);
      const name = `${base}-${String(i + 1).padStart(2, "0")}.png`;
      if (svg) files.push(await svgToPngFile(fillPhotoSlots(svg, photos), frames, name));
      else { fallbackSlides.push(i + 1); files.push(await renderFrameToFile(frames[i], name)); }
    }
    let fields: Record<string, any> = {};
    for (let i = 0; i < files.length; i++) {
      step({ step: `Attaching slide ${i + 1} of ${total} to Media to Post`, current: i + 1 });
      let lastError = "";
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const up = await uploadDirectToDrive(files[i], deps.accessCode, () => {});
          // A superseded run must not touch the post (a retry owns it now).
          if (!alive()) throw new StaleRun();
          const res = await fetch("/api/dwy-content-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-access-code": deps.accessCode },
            // First slide replaces whatever an earlier (failed/stalled) run attached; later slides append.
            body: JSON.stringify({ recordId: post.id, field: "Produced Files", fileId: up.fileId, filename: up.filename, multiple: total > 1 && i > 0 }),
          });
          const data: any = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.error || "Could not attach the designs.");
          fields = data.fields || fields;
          lastError = "";
          break;
        } catch (e: any) {
          if (e instanceof StaleRun) throw e;
          lastError = e?.message || "Could not attach the designs.";
        }
      }
      if (lastError) throw new Error(`${i} of ${total} slides attached. Slide ${i + 1} failed: ${lastError}`);
    }
    if (!alive()) return;
    deps.onAttached(fields);
    await deps.setStatus("Approve");
    set(post.id, { state: "done", step: "Designs attached", fallbackSlides });
  } catch (e: any) {
    if (e instanceof StaleRun || !alive()) return; // superseded by a retry
    await deps.setStatus(previous).catch(() => undefined);
    set(post.id, { state: "failed", step: "AI design failed", error: e?.message || "The design could not be created right now." });
  }
}

class StaleRun extends Error {}

export function clearAiDesignJob(id: string) {
  jobs.delete(id);
  emit();
}
