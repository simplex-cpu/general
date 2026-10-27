import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { graphicFrameStyle } from "@/lib/slate/brandVisualStyle";
import { buildCarouselFrames, buildGraphicFrame } from "@/lib/slate/designFrames";
import { DesignFrameView } from "./DesignPreview";

export type PhonePreviewStyle = {
  hookFont: string; captionFont: string; hookColor: string; captionColor: string; hookBacking: string; captionBacking: string;
  carouselCoverBackground?: string; carouselCoverBackground2?: string; carouselSlidesBackground?: string;
  carouselCoverAlign?: string; carouselSlidesAlign?: string; carouselTitleColor?: string; carouselSubtitleColor?: string; carouselTextColor?: string;
};
export type PreviewMode = "hook" | "captions" | "carousel" | "graphic";
const SAMPLE_HOOK = "Stop posting content nobody saves";
const SAMPLE_CAPTION = "Create something useful. Give your audience one clear idea worth keeping.";
const SAMPLE_SLIDES = [
  { position: 1, role: "hook" as const, headline: "Create content worth saving", subtitle: "Make every idea count" },
  { position: 2, role: "content" as const, headline: "Lead with one clear idea", subtitle: "Keep it focused", body: "Share a useful insight your audience can put into practice today." },
  { position: 3, role: "content" as const, headline: "Make the next step simple", subtitle: "Build real momentum", body: "One meaningful action is more powerful than a long list of possibilities." },
];
export default function StylePhonePreview({ style, editableSample: _editableSample, className = "", allowedModes = ["hook", "captions"], hookText, captionText, captionPlacement = "bottom", compact = false, headerLabel, showHeaderLabel: _showHeaderLabel = true, backingOpacity, mode: controlledMode, onModeChange, graphicFields, fitViewport = false, carouselIndex, onCarouselIndexChange }: {
  style: PhonePreviewStyle; editableSample?: boolean; className?: string; allowedModes?: PreviewMode[]; hookText?: string; captionText?: string;
  captionPlacement?: "top" | "center" | "bottom"; compact?: boolean; headerLabel?: ReactNode; showHeaderLabel?: boolean; backingOpacity?: number;
  mode?: PreviewMode; onModeChange?: (m: PreviewMode) => void; graphicFields?: Record<string, string>; fitViewport?: boolean;
  carouselIndex?: number; onCarouselIndexChange?: (index: number) => void;
}) {
  const [internalMode, setInternalMode] = useState<PreviewMode>(allowedModes[0] || "hook");
  const mode = allowedModes.includes(controlledMode ?? internalMode) ? controlledMode ?? internalMode : allowedModes[0] || "hook";
  const [index, setIndex] = useState(0);
  useEffect(() => { if (carouselIndex !== undefined) setIndex(carouselIndex); }, [carouselIndex]);
  const setMode = (m: PreviewMode) => { setInternalMode(m); onModeChange?.(m); };
  const fields = graphicFields || {
    "Captions style primary": style.hookFont, "Captions style secondary": style.captionFont,
    "Carousel Cover Background": style.carouselCoverBackground || "", "Carousel Cover Background 2": style.carouselCoverBackground2 || "",
    "Carousel Slides Background": style.carouselSlidesBackground || "", "Carousel Cover Text Align": style.carouselCoverAlign || "",
    "Carousel Slides Text Align": style.carouselSlidesAlign || "", "Carousel Title Color": style.carouselTitleColor || "",
    "Carousel Slides Subtitle Color": style.carouselSubtitleColor || "", "Carousel Slides Text Color": style.carouselTextColor || "",
  };
  const fs = graphicFrameStyle(fields, mode === "graphic");
  const frames = buildCarouselFrames(SAMPLE_SLIDES, fs, "insightful");
  const graphicFrame = buildGraphicFrame("Make your ideas matter\nOne clear message. Real impact.\nShare something useful that helps your audience take their next step with confidence.", fs, undefined, "insightful");
  const isHook = mode === "hook";
  const font = isHook ? style.hookFont : style.captionFont;
  const color = (isHook ? style.hookColor : style.captionColor) || "var(--color-brand-surface)";
  let backing = (isHook ? style.hookBacking : style.captionBacking) || "transparent";
  if (backingOpacity !== undefined && /^#[0-9a-f]{6}$/i.test(backing)) backing += Math.round(Math.max(0, Math.min(100, backingOpacity)) / 100 * 255).toString(16).padStart(2, "0");
  const changeSlide = (delta: number) => { const next = (index + delta + frames.length) % frames.length; setIndex(next); onCarouselIndexChange?.(next); };
  const graphic = mode === "carousel" || mode === "graphic";
  return <div className={`flex w-full flex-col items-center gap-4 ${className}`}>
    {headerLabel}
    <div className={`flex w-full flex-col items-center gap-4 ${compact ? "max-w-[min(220px,72vw)]" : graphic ? "max-w-[340px]" : fitViewport ? "visual-style-video-column" : "max-w-[340px]"}`}>
      {allowedModes.length > 1 && <div role="tablist" aria-label="Style previews" className="flex w-full gap-1 rounded-md bg-brand-ink-grey/10 p-1">{[["hook", "Visual Hook"], ["captions", "Transcription"], ["carousel", "Carousel"], ["graphic", "Still graphic"]].filter(([id]) => allowedModes.includes(id as PreviewMode)).map(([id, label]) => <Button key={id} type="button" variant="ghost" role="tab" aria-selected={mode === id} onClick={() => setMode(id as PreviewMode)} className={`h-9 min-w-0 flex-1 px-2 text-[11px] ${mode === id ? "bg-brand-surface text-brand-ink shadow-sm" : "text-brand-ink-soft"}`}>{label}</Button>)}</div>}
      {graphic ? <DesignFrameView frame={mode === "graphic" ? graphicFrame : frames[index] || frames[0]} width={340} /> : <div className={`relative aspect-[9/16] w-full overflow-hidden border-brand-navy bg-brand-deep ${compact ? "rounded-[22px] border-[5px]" : "rounded-[26px] border-[6px]"}`}>
        <div className={`absolute inset-x-[10%] flex justify-center ${isHook || captionPlacement === "top" ? "top-[16%]" : captionPlacement === "center" ? "top-1/2 -translate-y-1/2" : "bottom-[18%]"}`}><span className="max-w-full break-words rounded-md px-2.5 py-1.5 text-center" style={{ fontFamily: `${font.split(",")[0] || "Poppins"}, sans-serif`, fontWeight: Number(font.match(/weight\s*(\d{3})/i)?.[1] || 700), color, background: backing, lineHeight: 1.25, fontSize: compact ? isHook ? 18 : 14 : isHook ? 22 : 16, textTransform: isHook ? "uppercase" : "none" }}>{isHook ? hookText?.trim() || SAMPLE_HOOK : captionText?.trim() || SAMPLE_CAPTION}</span></div>
      </div>}
      {mode === "carousel" && <div className="flex items-center gap-4 text-brand-ink-soft"><Button type="button" variant="outline" size="icon-sm" aria-label="Previous carousel slide" onClick={() => changeSlide(-1)} className="border-brand-line bg-brand-surface text-brand-ink"><ChevronLeft size={15} /></Button><span className="min-w-20 text-center text-xs">{index === 0 ? "Cover" : "Slide"} · {index + 1}/{frames.length}</span><Button type="button" variant="outline" size="icon-sm" aria-label="Next carousel slide" onClick={() => changeSlide(1)} className="border-brand-line bg-brand-surface text-brand-ink"><ChevronRight size={15} /></Button></div>}
    </div>
  </div>;
}
