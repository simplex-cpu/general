import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { DEFAULT_PROMPTS } from "@/lib/simplex/prompts";
import type { PromptKey, Prompts } from "@/lib/simplex/types";

const AIRTABLE_API = "https://api.airtable.com";
const BASE_ID = "appOttHso6hYjBXhw";
const TABLE_ID = "tblKsQU7L5Vq313d0"; // Prompt Versions
const APP_SOURCE = "Risevoice Creators Hub";

const PROMPT_META: Record<PromptKey, { label: string; category: string }> = {
  framework: { label: "Global Voice & Tone", category: "Global" },
  briefReader: { label: "Session Brief Builder", category: "Global" },
  topicResearch: { label: "Topic Research", category: "Global" },
  hookTalking: { label: "Talking Video Hook", category: "Hooks" },
  hookBroll: { label: "B-roll Text Overlay", category: "Hooks" },
  hookCarousel: { label: "Carousel Hook", category: "Hooks" },
  hookGraphic: { label: "Graphic Hook", category: "Hooks" },
  talkingScriptFleshed: { label: "Talking Script · Fleshed", category: "Video scripts" },
  talkingScriptFramework: { label: "Talking Script · Framework", category: "Video scripts" },
  brollScript: { label: "B-roll Text Overlay", category: "Video scripts" },
  videoOnScreenCta: { label: "Video On-Screen CTA", category: "Video scripts" },
  carouselSlides: { label: "Carousel Slides", category: "Carousel & graphic" },
  graphicCopy: { label: "Graphic Copy", category: "Carousel & graphic" },
  carouselCta: { label: "Carousel CTA", category: "Carousel & graphic" },
  graphicCta: { label: "Graphic CTA", category: "Carousel & graphic" },
  productionCreativeInstructions: {
    label: "Production Creative Instructions",
    category: "Carousel & graphic",
  },
  captionInstagram: { label: "Instagram Caption", category: "Captions" },
  captionFacebook: { label: "Facebook Caption", category: "Captions" },
  captionTiktok: { label: "TikTok Caption", category: "Captions" },
  captionYoutube: { label: "YouTube Caption", category: "Captions" },
  qaChecklistTopics: { label: "Topics · QA", category: "QA Checklist" },
  qaChecklistHookTalking: { label: "Talking Video Hook · QA", category: "QA Checklist" },
  qaChecklistHookCarousel: { label: "Carousel Hook · QA", category: "QA Checklist" },
  qaChecklistHookGraphic: { label: "Graphic Hook · QA", category: "QA Checklist" },
  qaChecklistTalking: { label: "Talking Video Script · QA", category: "QA Checklist" },
  qaChecklistBroll: { label: "B-roll Text Overlay · QA", category: "QA Checklist" },
  qaChecklistCarousel: { label: "Carousel Slides · QA", category: "QA Checklist" },
  qaChecklistGraphic: { label: "Graphic Copy · QA", category: "QA Checklist" },
  qaChecklistProductionMeta: {
    label: "Production Creative Instructions · QA",
    category: "QA Checklist",
  },
  qaChecklistCaptions: { label: "Captions · QA", category: "QA Checklist" },
  outputTopics: { label: "Topics · Output", category: "Output structure" },
  outputHookTalking: { label: "Talking Video Hook · Output", category: "Output structure" },
  outputHookCarousel: { label: "Carousel Hook · Output", category: "Output structure" },
  outputHookGraphic: { label: "Graphic Hook · Output", category: "Output structure" },
  outputTalkingFleshed: {
    label: "Talking Script · Fleshed · Output",
    category: "Output structure",
  },
  outputTalkingFramework: {
    label: "Talking Script · Framework · Output",
    category: "Output structure",
  },
  outputBroll: { label: "B-roll Text Overlay · Output", category: "Output structure" },
  outputCarousel: { label: "Carousel Slides · Output", category: "Output structure" },
  outputGraphic: { label: "Graphic Copy · Output", category: "Output structure" },
  outputProductionMeta: {
    label: "Production Creative Instructions · Output",
    category: "Output structure",
  },
  outputCaptions: { label: "Captions · Output", category: "Output structure" },
};

type PromptVersion = {
  id: string;
  key: PromptKey;
  version: number;
  text: string;
  hash: string;
  savedAt: string;
};

const PROMPT_KEYS = Object.keys(DEFAULT_PROMPTS) as PromptKey[];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function airtableHeaders() {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function normalisePrompts(input: unknown): Prompts {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const next = { ...DEFAULT_PROMPTS };
  for (const key of PROMPT_KEYS) {
    const value = source[key];
    if (typeof value === "string") next[key] = value;
  }
  return next;
}

async function hashText(text: string) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchLatestVersions(headers: Record<string, string>) {
  const latest = new Map<PromptKey, PromptVersion>();
  let offset: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    params.append("fields[]", "Prompt Key");
    params.append("fields[]", "Version Number");
    params.append("fields[]", "Prompt Text");
    params.append("fields[]", "Prompt Hash");
    params.append("fields[]", "Saved At ISO");
    if (offset) params.set("offset", offset);
    const res = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}?${params.toString()}`, {
      headers,
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(
        `Airtable prompt lookup failed [${res.status}]: ${JSON.stringify(data).slice(0, 500)}`,
      );
    for (const record of data.records || []) {
      const fields = record.fields || {};
      const key = String(fields["Prompt Key"] || "") as PromptKey;
      if (!PROMPT_KEYS.includes(key)) continue;
      const version = Number(fields["Version Number"] || 0);
      const savedAt = String(fields["Saved At ISO"] || "");
      const candidate: PromptVersion = {
        id: record.id,
        key,
        version,
        text: String(fields["Prompt Text"] || ""),
        hash: String(fields["Prompt Hash"] || ""),
        savedAt,
      };
      const current = latest.get(key);
      if (
        !current ||
        candidate.version > current.version ||
        (candidate.version === current.version && candidate.savedAt > current.savedAt)
      ) {
        latest.set(key, candidate);
      }
    }
    offset = data.offset;
  } while (offset);
  return latest;
}

async function fetchRecordsById(headers: Record<string, string>, ids: string[]) {
  const records: any[] = [];
  for (const id of ids) {
    const res = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}/${id}`, { headers });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(
        `Airtable prompt verification failed [${res.status}]: ${JSON.stringify(data).slice(0, 500)}`,
      );
    records.push(data);
  }
  return records;
}

async function buildPromptPayload(headers: Record<string, string>) {
  const latest = await fetchLatestVersions(headers);
  const prompts = { ...DEFAULT_PROMPTS };
  const versions: Record<string, { version: number; savedAt: string; recordId: string }> = {};
  for (const [key, record] of latest) {
    prompts[key] = record.text;
    versions[key] = { version: record.version, savedAt: record.savedAt, recordId: record.id };
  }
  return { prompts, versions, latest };
}

export const Route = createFileRoute("/api/prompts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const accessCode = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(accessCode);
        if (!auth.ok) return auth.response;
        const headers = airtableHeaders();
        if (!headers) return json({ error: "Airtable not configured" }, 500);
        try {
          const { prompts, versions } = await buildPromptPayload(headers);
          return json({ ok: true, prompts, versions });
        } catch (e: any) {
          console.error("[api/prompts] GET failed", e);
          return json({ error: e?.message || "Could not load prompts" }, 502);
        }
      },

      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }
        const auth = await requireAccessCode(body?.accessCode, { staffOnly: true });
        if (!auth.ok) return auth.response;
        const headers = airtableHeaders();
        if (!headers) return json({ error: "Airtable not configured" }, 500);

        try {
          const incoming = normalisePrompts(body?.prompts);
          const { latest } = await buildPromptPayload(headers);
          const now = new Date().toISOString();
          const batchId = `prompts-${now}-${Math.random().toString(36).slice(2, 8)}`;
          const records: { fields: Record<string, any> }[] = [];
          const expectedByKey = new Map<
            PromptKey,
            { hash: string; text: string; version: number }
          >();

          for (const key of PROMPT_KEYS) {
            const text = incoming[key] || "";
            const hash = await hashText(text);
            const previous = latest.get(key);
            if (previous && previous.hash === hash) continue;
            const meta = PROMPT_META[key];
            const version = (previous?.version || 0) + 1;
            records.push({
              fields: {
                Name: `${meta.label} v${version}`,
                "Prompt Key": key,
                "Prompt Label": meta.label,
                Category: meta.category,
                "Version Number": version,
                "Prompt Text": text,
                "Prompt Hash": hash,
                "Saved At ISO": now,
                "Saved By": auth.record.clientName || "Unknown",
                "Saved By Role": auth.record.userType || "Unknown",
                "Save Batch ID": batchId,
                "Change Summary": previous
                  ? "Updated from admin prompt settings."
                  : "Initial saved version from admin prompt settings.",
                "App Source": APP_SOURCE,
              },
            });
            expectedByKey.set(key, { hash, text, version });
          }

          const createdIds: string[] = [];
          for (let i = 0; i < records.length; i += 10) {
            const chunk = records.slice(i, i + 10);
            const res = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}`, {
              method: "POST",
              headers,
              body: JSON.stringify({ records: chunk, typecast: true }),
            });
            const data: any = await res.json().catch(() => ({}));
            if (!res.ok)
              throw new Error(
                `Airtable prompt save failed [${res.status}]: ${JSON.stringify(data).slice(0, 500)}`,
              );
            for (const record of data.records || []) createdIds.push(record.id);
          }

          let verified = true;
          if (createdIds.length) {
            const savedRecords = await fetchRecordsById(headers, createdIds);
            for (const record of savedRecords) {
              const fields = record.fields || {};
              const key = String(fields["Prompt Key"] || "") as PromptKey;
              const expected = expectedByKey.get(key);
              const savedText = String(fields["Prompt Text"] || "");
              const savedHash = String(fields["Prompt Hash"] || "");
              const recalculated = await hashText(savedText);
              if (
                !expected ||
                savedHash !== expected.hash ||
                recalculated !== expected.hash ||
                savedText !== expected.text
              ) {
                verified = false;
                break;
              }
            }
          }

          const latestPayload = await buildPromptPayload(headers);
          return json({
            ok: true,
            saved: records.length,
            verified,
            batchId,
            prompts: latestPayload.prompts,
            versions: latestPayload.versions,
          });
        } catch (e: any) {
          console.error("[api/prompts] POST failed", e);
          return json({ error: e?.message || "Could not save prompts" }, 502);
        }
      },
    },
  },
});
