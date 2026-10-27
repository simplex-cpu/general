import type { PhonePreviewStyle } from "@/components/slate/StylePhonePreview";

export type VideoFormat = "Talking Video" | "BROLL";
export function videoBrandStyle(fields: Record<string, unknown>): PhonePreviewStyle {
  const value = (key: string, fallback: string) => String(fields[key] || fallback);
  return {
    hookFont: value("Captions style primary", "sans-serif, weight 700"),
    captionFont: value(
      "Captions style secondary",
      value("Captions style primary", "sans-serif, weight 600"),
    ),
    hookColor: value("Font color (Primary)", "var(--color-brand-surface)"),
    captionColor: value("Font color (Secondary)", "var(--color-brand-surface)"),
    hookBacking: value("Font background Color (Primary)", "transparent"),
    captionBacking: value("Font background Color (Secondary)", "transparent"),
  };
}

/** Split saved Script Text into hook and on-screen/spoken body, dropping production-only sections. */
export function videoScriptParts(saved: string): { hook: string; body: string } {
  const sections = saved.trim().split(/\n\s*\n/);
  let hook = "";
  const body: string[] = [];
  let skipping = false;
  for (const section of sections) {
    const label = section.match(/^\s*([A-Za-z -]+):\s*\n?/)?.[1]?.trim().toLowerCase();
    if (label === "creative instructions" || label === "production creative instructions") {
      skipping = true;
      continue;
    }
    if (label && label.length < 30) skipping = false;
    if (skipping) continue;
    if (label === "hook" || label === "visual hook" || label === "spoken hook") {
      hook = section.replace(/^\s*[A-Za-z -]+:\s*/, "").trim();
    } else if (label !== "on-screen cta") body.push(section.trim());
  }
  return { hook, body: body.join("\n\n").trim() };
}

export function initialVideoHook(script: string, explicit?: string) {
  if (explicit?.trim()) return explicit.trim();
  return (script.trim().split(/\n|(?<=[.!?])\s+/)[0] || "").replace(
    /^\s*(visual hook|spoken hook|hook)\s*:\s*/i,
    "",
  );
}
export function overlaySegments(text: string): string[] {
  return text.trim() ? [text.trim()] : [];
}
export function videoRequestText(format: VideoFormat, script: string, hook: string) {
  return {
    textOverlay: format === "BROLL" ? script.trim() : "",
    visualHook: format === "Talking Video" ? hook.trim() : "",
  };
}
export function videoFootageReady(
  uploadedCount: number,
  link: string,
  status: string,
  checking: boolean,
) {
  if (uploadedCount > 0) return true;
  return !!link.trim() && !checking && status === "ok";
}
export function playableVideoUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol)) return;
    if (/\.(mp4|webm|mov)(?:$)/i.test(parsed.pathname)) return parsed.href;
  } catch {
    /* A folder or invalid link is not a playable source. */
  }
}
export function safeFootageLink(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : undefined;
  } catch {
    return;
  }
}

/** One request creation per mounted editor; synchronization can be retried separately. */
export function createProductionSubmission() {
  let locked = false;
  let created = false;
  return {
    get created() {
      return created;
    },
    async run(create: () => Promise<void>, synchronize: () => Promise<void>) {
      if (locked) return false;
      locked = true;
      try {
        if (!created) {
          await create();
          created = true;
        }
        await synchronize();
        return true;
      } finally {
        locked = false;
      }
    },
  };
}

/** Inverse of videoBrandStyle: the brand brief fields the external edit reads. */
export function videoBrandFields(style: PhonePreviewStyle, talking: boolean): Record<string, string> {
  const out: Record<string, string> = {
    "Captions style secondary": style.captionFont,
    "Font color (Secondary)": style.captionColor,
    "Font background Color (Secondary)": style.captionBacking,
  };
  if (talking) {
    out["Captions style primary"] = style.hookFont;
    out["Font color (Primary)"] = style.hookColor;
    out["Font background Color (Primary)"] = style.hookBacking;
  }
  return out;
}

/** Split a colour into a 6-digit hex and opacity (0–100). Unknown values become black/100 or transparent/0. */
export function splitColor(value: string): { hex: string; opacity: number } {
  const v = (value || "").trim();
  if (!v || v === "transparent") return { hex: "#000000", opacity: 0 };
  const m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (!m) return { hex: "#000000", opacity: 100 };
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const opacity = h.length === 8 ? Math.round((parseInt(h.slice(6), 16) / 255) * 100) : 100;
  return { hex: `#${h.slice(0, 6).toLowerCase()}`, opacity };
}

/** Join hex + opacity into #RRGGBB or #RRGGBBAA. */
export function joinColor(hex: string, opacity: number): string {
  const o = Math.max(0, Math.min(100, Math.round(opacity)));
  if (o >= 100) return hex.toLowerCase();
  return `${hex.toLowerCase()}${Math.round((o / 100) * 255).toString(16).padStart(2, "0")}`;
}
