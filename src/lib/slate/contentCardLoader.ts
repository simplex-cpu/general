/** One loader for opening a single content card, shared by Planner and Home. */
export type CardLoadError = "busy" | "notFound" | "timeout" | "failed";

export class ContentCardError extends Error {
  constructor(public kind: CardLoadError, message: string) { super(message); }
}

export function cardErrorKind(status: number, aborted = false): CardLoadError {
  if (aborted) return "timeout";
  if (status === 503 || status === 429) return "busy";
  if (status === 404) return "notFound";
  return "failed";
}

const MESSAGES: Record<CardLoadError, string> = {
  busy: "Airtable is busy. Try again in a moment.",
  notFound: "This card could not be found.",
  timeout: "This card took too long to load.",
  failed: "Couldn't load this card's details.",
};

export async function loadContentCard<T = any>(id: string, accessCode: string, signal?: AbortSignal): Promise<{ item: T; data: any }> {
  const ctl = new AbortController();
  const onAbort = () => ctl.abort();
  signal?.addEventListener("abort", onAbort);
  const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(`/api/dwy-client-content?id=${encodeURIComponent(id)}`, { headers: { "x-access-code": accessCode }, signal: ctl.signal });
    const data = await res.json().catch(() => ({}));
    const item = data?.items?.[0];
    if (!res.ok || !item) { const k = cardErrorKind(res.ok ? 404 : res.status); throw new ContentCardError(k, MESSAGES[k]); }
    return { item, data };
  } catch (e: any) {
    if (e instanceof ContentCardError) throw e;
    const k = cardErrorKind(0, e?.name === "AbortError");
    throw new ContentCardError(k, MESSAGES[k]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

/** Starter data shows instantly; loaded fields win, starter fills only what's missing. */
export function mergeCard<T extends Record<string, any>>(starter: Partial<T> | undefined, loaded: T): T {
  const out: Record<string, any> = { ...loaded };
  for (const [k, v] of Object.entries(starter || {})) if (out[k] === undefined || out[k] === null) out[k] = v;
  return out as T;
}
