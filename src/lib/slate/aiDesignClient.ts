// Browser side of AI slide designs: request one slide at a time, check the
// text fits the safe area, and turn an approved SVG into the final PNG.
import { FRAME_HEIGHT, FRAME_WIDTH, familyOf, type DesignFrame } from "./designFrames";
import { boxesInsideSafeArea, framePalette, withBrandBackground } from "./aiDesign";

/** Brand kit sent with every design call. */
export type AiBrandKit = { accents: string[]; lightInk?: string; darkInk?: string; name?: string; gradient?: [string, string]; photoCount?: number };

/** Swap photo:N slots for the real (data URL) images before rendering. */
export function fillPhotoSlots(svg: string, photos: string[] = []): string {
  return svg.replace(/href\s*=\s*"photo:(\d+)"/gi, (_m, n) => (photos[Number(n) - 1] ? `href="${photos[Number(n) - 1]}"` : 'href=""'));
}

export class AiDesignError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const slidePayload = (frames: DesignFrame[]) =>
  frames.map((f) => ({
    label: f.label,
    background: f.background,
    backgroundEnd: f.backgroundEnd || undefined,
    blocks: f.blocks.map((b) => ({ role: b.role, text: b.text, font: b.font, color: b.color, pill: b.pill, pillBackground: b.pillBackground })),
  }));

/** Text boxes of an SVG laid out with the page's loaded fonts. */
function textBoxes(svg: string) {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-99999px;top:0;width:1080px;height:1350px;visibility:hidden;pointer-events:none";
  host.innerHTML = svg;
  document.body.appendChild(host);
  try {
    const root = host.querySelector("svg");
    if (!root) return [];
    root.setAttribute("width", "1080");
    root.setAttribute("height", "1350");
    return Array.from(root.querySelectorAll("text")).map((t) => (t as SVGGraphicsElement).getBBox());
  } finally {
    host.remove();
  }
}

/** Design one slide. Returns null when the design can't be trusted, so the standard layout is used. */
async function post(frames: DesignFrame[], body: Record<string, unknown>, accessCode: string, brand?: AiBrandKit) {
  const res = await fetch("/api/ai-design", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-access-code": accessCode },
    body: JSON.stringify({ slides: slidePayload(frames), palette: framePalette(frames, [...(brand?.accents || []), ...(brand?.gradient || []), brand?.lightInk || "", brand?.darkInk || ""]), brand, index: 0, ...body }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new AiDesignError(res.status, data?.error || "The design could not be created right now.");
  return data;
}

/** Art direction for the whole series; null when the planner returns nothing usable. */
export async function planSeries(frames: DesignFrame[], accessCode: string, brand?: AiBrandKit): Promise<string | null> {
  const data = await post(frames, { mode: "plan" }, accessCode, brand);
  return (data?.plan as string | null) || null;
}

/** Design one slide. Returns null when the design can't be trusted, so the standard layout is used. */
export async function designSlide(frames: DesignFrame[], index: number, accessCode: string, plan?: string | null, brand?: AiBrandKit): Promise<string | null> {
  const bg = (svg: string | null) => (svg ? withBrandBackground(svg, frames[index]) : null);
  const call = async (problems?: string[]) => {
    const data = await post(frames, { index, problems, plan: plan || undefined }, accessCode, brand);
    return bg((data?.svg as string | null) || null);
  };
  await document.fonts?.ready.catch(() => undefined);
  const first = await call();
  if (!first) return null;
  let drawn: string | null = boxesInsideSafeArea(textBoxes(first)) ? first : null;
  if (!drawn) {
    const second = await call(["Some text runs outside the safe area or off the canvas. Use smaller sizes or more line breaks."]);
    drawn = second && boxesInsideSafeArea(textBoxes(second)) ? second : null;
  }
  return drawn;
}

const fontCache = new Map<string, Promise<string>>();

/** @font-face rules with the font files inlined, so the exported image uses the brand fonts. */
function embeddedFontCss(family: string): Promise<string> {
  if (!fontCache.has(family)) {
    fontCache.set(family, (async () => {
      try {
        const q = encodeURIComponent(family).replace(/%20/g, "+");
        let css = await fetch(`https://fonts.googleapis.com/css2?family=${q}:wght@300;400;500;600;700;800;900&display=swap`).then((r) => (r.ok ? r.text() : ""));
        if (!css) css = await fetch(`https://fonts.googleapis.com/css2?family=${q}&display=swap`).then((r) => (r.ok ? r.text() : ""));
        const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))];
        for (const url of urls) {
          const buf = await fetch(url).then((r) => r.arrayBuffer());
          let bin = "";
          const bytes = new Uint8Array(buf);
          for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          css = css.split(url).join(`data:font/woff2;base64,${btoa(bin)}`);
        }
        return css;
      } catch {
        return "";
      }
    })());
  }
  return fontCache.get(family)!;
}

export async function svgToPngFile(svg: string, frames: DesignFrame[], filename: string): Promise<File> {
  const families = [...new Set(frames.flatMap((f) => f.blocks.map((b) => familyOf(b.font))))];
  const css = (await Promise.all(families.map(embeddedFontCss))).join("\n");
  const withFonts = svg.replace(/<svg\b[^>]*>/i, (open) => `${open}<style>${css}</style>`);
  const url = URL.createObjectURL(new Blob([withFonts], { type: "image/svg+xml" }));
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not draw the AI design."));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = FRAME_WIDTH;
    canvas.height = FRAME_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser cannot render the designs.");
    ctx.drawImage(img, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (!blob) throw new Error("Could not export the design.");
    return new File([blob], filename, { type: "image/png" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const svgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
