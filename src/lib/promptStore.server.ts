// Loads the live AI prompts on the server: the latest saved version of each
// prompt in the Airtable "Prompt Versions" table, over the defaults in
// simplex/prompts.ts. Scripting endpoints use these instead of prompts sent by
// the browser, so a caller can't swap out the instructions.
import { DEFAULT_PROMPTS } from "./simplex/prompts";
import type { PromptKey, Prompts } from "./simplex/types";

export const AIRTABLE_API = "https://api.airtable.com";
export const PROMPT_VERSIONS_BASE = "appOttHso6hYjBXhw";
export const PROMPT_VERSIONS_TABLE = "tblKsQU7L5Vq313d0"; // Prompt Versions

export type PromptVersion = {
  id: string;
  key: PromptKey;
  version: number;
  text: string;
  hash: string;
  savedAt: string;
};

export const PROMPT_KEYS = Object.keys(DEFAULT_PROMPTS) as PromptKey[];

export async function fetchLatestVersions(headers: Record<string, string>) {
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
    const res = await fetch(
      `${AIRTABLE_API}/v0/${PROMPT_VERSIONS_BASE}/${PROMPT_VERSIONS_TABLE}?${params.toString()}`,
      { headers },
    );
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

export async function buildPromptPayload(headers: Record<string, string>) {
  const latest = await fetchLatestVersions(headers);
  const prompts = { ...DEFAULT_PROMPTS };
  const versions: Record<string, { version: number; savedAt: string; recordId: string }> = {};
  for (const [key, record] of latest) {
    prompts[key] = record.text;
    versions[key] = { version: record.version, savedAt: record.savedAt, recordId: record.id };
  }
  return { prompts, versions, latest };
}

// Cached briefly so a batch of scripting calls reads Airtable once; saving in
// Settings clears it, so new versions apply on the next call.
const CACHE_MS = 60_000;
let cache: { at: number; prompts: Prompts } | null = null;

export function clearLivePromptsCache() {
  cache = null;
}

export async function loadLivePrompts(): Promise<Prompts> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.prompts;
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return { ...DEFAULT_PROMPTS };
  try {
    const { prompts } = await buildPromptPayload({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    });
    cache = { at: Date.now(), prompts };
    return prompts;
  } catch (e) {
    // Keep generating with the last known prompts rather than failing the request.
    console.error("[prompts] live load failed; using last known prompts or defaults", e);
    return cache?.prompts ?? { ...DEFAULT_PROMPTS };
  }
}
