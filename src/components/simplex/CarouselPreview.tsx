// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, Check, Pencil, RotateCcw } from "lucide-react";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { CopyButton, EditableText } from "./ui";
import type { Carousel, CarouselSlide, CarouselEdits } from "@/lib/simplex/types";

const EXPORT_W = 1080;
const EXPORT_H = 1350;
const PREVIEW_W = 360;
const SCALE = EXPORT_W / PREVIEW_W; // 3x

type SlideContentProps = {
  slide: CarouselSlide;
  index: number;
  total: number;
  carousel: Carousel;
  scale: number;
  /** When true, render plain text (no editing) — for the export surface. */
  staticRender?: boolean;
  onEditHeadline?: (v: string) => void;
  onEditBody?: (v: string) => void;
};

function SlideContent({
  slide,
  index,
  total,
  carousel,
  scale,
  staticRender = false,
  onEditHeadline,
  onEditBody,
}: SlideContentProps) {
  const slideBg = slide.bg || carousel.palette?.bg || "#EDE7D9";
  const slideFg = slide.fg || carousel.palette?.text || "#1a1a1a";
  const slideAccent = slide.accent || carousel.palette?.accent || "#E8A547";

  const headlineLen = (slide.headline ?? "").length;
  const headlineSize = headlineLen > 40 ? 22 : headlineLen > 20 ? 30 : 36;

  return (
    <div
      className="absolute inset-0 flex flex-col justify-center items-center text-center"
      style={{
        backgroundColor: slideBg,
        color: slideFg,
        fontFamily: "'Poppins', sans-serif",
        padding: `${32 * scale}px`,
      }}
    >
      {slide.type === "hook" && (
        <div
          className="uppercase self-start"
          style={{
            color: slideAccent,
            fontFamily: "'Poppins', sans-serif",
            fontSize: `${9 * scale}px`,
            letterSpacing: "0.3em",
            marginBottom: `${16 * scale}px`,
          }}
        >
          Slide 1
        </div>
      )}

      <div
        style={{
          fontWeight: 700,
          lineHeight: 1.05,
          marginBottom: `${12 * scale}px`,
          fontSize: `${headlineSize * scale}px`,
          letterSpacing: "-0.02em",
          maxWidth: "100%",
        }}
      >
        {staticRender || !onEditHeadline ? (
          <span style={{ whiteSpace: "pre-wrap" }}>{slide.headline}</span>
        ) : (
          <EditableText
            value={slide.headline ?? ""}
            onChange={onEditHeadline}
            className="!text-current"
          />
        )}
      </div>

      {(slide.body || (!staticRender && onEditBody)) && (
        <div
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: `${14 * scale}px`,
            fontWeight: 400,
            lineHeight: 1.6,
            opacity: 0.85,
            marginTop: `${8 * scale}px`,
            maxWidth: "90%",
          }}
        >
          {staticRender || !onEditBody ? (
            <span style={{ whiteSpace: "pre-wrap" }}>{slide.body}</span>
          ) : (
            <EditableText
              value={slide.body ?? ""}
              onChange={onEditBody}
              className="!text-current"
              placeholder="(optional supporting line)"
            />
          )}
        </div>
      )}

      {index === total - 1 && (
        <div
          className="uppercase"
          style={{
            backgroundColor: slideAccent,
            color: slideBg,
            fontFamily: "'Poppins', sans-serif",
            fontSize: `${10 * scale}px`,
            fontWeight: 700,
            letterSpacing: "0.2em",
            padding: `${8 * scale}px ${16 * scale}px`,
            marginTop: `${24 * scale}px`,
            display: "inline-block",
            borderRadius: `${6 * scale}px`,
          }}
        >
          Swipe to act ↗
        </div>
      )}

      <div
        style={{
          position: "absolute",
          bottom: `${12 * scale}px`,
          right: `${16 * scale}px`,
          fontFamily: "'Poppins', sans-serif",
          fontSize: `${9 * scale}px`,
          opacity: 0.4,
        }}
      >
        {index + 1} / {total}
      </div>
    </div>
  );
}

export function CarouselPreview({ carousels }: { carousels: Carousel[] }) {
  const [activeCarousel, setActiveCarousel] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [exportState, setExportState] = useState<"idle" | "exporting" | "done">("idle");
  const [exportError, setExportError] = useState<string | null>(null);
  // Edits keyed: edits[carouselIdx][slideIdx] = { headline?, body?, caption? }
  const [allEdits, setAllEdits] = useState<Record<number, CarouselEdits>>({});
  const exportRef = useRef<HTMLDivElement | null>(null);

  // Reset slide index when changing carousel or when carousels prop changes.
  useEffect(() => {
    setActiveCarousel(0);
    setActiveSlide(0);
    setAllEdits({});
  }, [carousels]);

  const carousel = carousels?.[activeCarousel];
  const edits = allEdits[activeCarousel] || {};

  // Merge original + edits into a "view" carousel (hook MUST run before any early return)
  const merged: Carousel | null = useMemo(() => {
    if (!carousel || !carousel.slides) return null;
    const slides: CarouselSlide[] = carousel.slides.map((s, i) => {
      const e = edits[i] || {};
      return {
        ...s,
        headline: e.headline !== undefined ? e.headline : s.headline,
        body: e.body !== undefined ? e.body : s.body,
      };
    });
    const captionEdit = edits[-1]?.caption;
    return {
      ...carousel,
      slides,
      caption: captionEdit !== undefined ? captionEdit : carousel.caption,
    };
  }, [carousel, edits]);

  if (!carousels || carousels.length === 0) return null;
  if (!carousel || !carousel.slides || !merged) return null;

  const slide = merged.slides[activeSlide];
  const slideCount = merged.slides.length;
  const isEdited = Object.keys(edits).length > 0;

  const updateEdit = (slideIdx: number, patch: { headline?: string; body?: string; caption?: string }) => {
    setAllEdits((prev) => {
      const cur = { ...(prev[activeCarousel] || {}) };
      cur[slideIdx] = { ...(cur[slideIdx] || {}), ...patch };
      return { ...prev, [activeCarousel]: cur };
    });
  };

  const resetEdits = () => {
    setAllEdits((prev) => {
      const next = { ...prev };
      delete next[activeCarousel];
      return next;
    });
  };

  const handleDownload = async () => {
    if (!exportRef.current) {
      setExportError("Export surface not ready. Please try again.");
      return;
    }
    setExportState("exporting");
    setExportError(null);
    try {
      // Wait for fonts so Poppins / Satoshi are loaded into the export render
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      // Two RAFs to guarantee the export DOM has painted
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await new Promise<void>((r) => requestAnimationFrame(() => r()));

      const zip = new JSZip();
      const slideEls = exportRef.current.querySelectorAll<HTMLDivElement>("[data-export-slide]");
      if (slideEls.length === 0) {
        throw new Error("No slides found to export.");
      }

      for (let i = 0; i < slideEls.length; i++) {
        const canvas = await html2canvas(slideEls[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          logging: false,
          width: EXPORT_W,
          height: EXPORT_H,
        });
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/png")
        );
        if (!blob) throw new Error(`Could not encode slide ${i + 1}.`);
        zip.file(`slide-${i + 1}.png`, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename =
        carousels.length > 1
          ? `simplex-carousel-${activeCarousel + 1}-${ts}.zip`
          : `simplex-carousel-${ts}.zip`;

      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportState("done");
      setTimeout(() => setExportState("idle"), 2000);
    } catch (err) {
      console.error("Carousel export failed:", err);
      setExportError(err instanceof Error ? err.message : "Could not export carousel.");
      setExportState("idle");
    }
  };

  return (
    <div className="border border-[#4F6BFF]/20 bg-[#1A1A1D]/70 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#F6F6F7]/10 bg-[#F6F6F7]/[0.03]">
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#4F6BFF] font-semibold">
            Carousel Preview
          </span>
          {isEdited && (
            <span className="text-[10px] text-[#6C7BFF]">· edited</span>
          )}
          {carousels.length > 1 && (
            <div className="flex gap-1">
              {carousels.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveCarousel(i);
                    setActiveSlide(0);
                    setExportError(null);
                  }}
                  className={`px-2.5 py-0.5 text-[10px] uppercase tracking-wider transition rounded-xl ${
                    i === activeCarousel
                      ? "bg-[#4F6BFF] text-white font-semibold"
                      : "text-[#F6F6F7]/50 hover:text-[#F6F6F7]"
                  }`}
                >
                  #{i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleDownload}
            disabled={exportState === "exporting"}
            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#F6F6F7]/50 hover:text-[#4F6BFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportState === "exporting" ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Exporting...
              </>
            ) : exportState === "done" ? (
              <>
                <Check size={12} /> Downloaded
              </>
            ) : (
              <>
                <Download size={12} /> Download all slides
              </>
            )}
          </button>
          <CopyButton
            text={JSON.stringify(merged, null, 2) + "\n\nCAPTION:\n" + (merged.caption || "")}
          />
        </div>
      </div>

      <div className="p-6 bg-[#F6F6F7]/[0.02]">
        {/* Concept */}
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#F6F6F7]/50 font-semibold mb-1">
            Concept
          </div>
          <p className="text-sm text-[#F6F6F7] font-light">{merged.concept}</p>
        </div>

        {/* Slide viewer */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setActiveSlide((s) => Math.max(0, s - 1))}
            disabled={activeSlide === 0}
            className="text-[#F6F6F7]/50 hover:text-[#4F6BFF] disabled:opacity-20 disabled:cursor-not-allowed p-2"
          >
            <ChevronLeft size={20} />
          </button>

          <div
            className="relative flex-shrink-0 group rounded-xl overflow-hidden"
            style={{
              width: "min(360px, 60vw)",
              aspectRatio: "4 / 5",
            }}
          >
            <SlideContent
              slide={slide}
              index={activeSlide}
              total={slideCount}
              carousel={merged}
              scale={1}
              onEditHeadline={(v) => updateEdit(activeSlide, { headline: v })}
              onEditBody={(v) => updateEdit(activeSlide, { body: v })}
            />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[#1A1A1D]/70 text-[#F6F6F7] text-[9px] uppercase tracking-wider px-2 py-1 rounded-xl flex items-center gap-1">
              <Pencil size={9} /> click text to edit
            </div>
          </div>

          <button
            onClick={() => setActiveSlide((s) => Math.min(slideCount - 1, s + 1))}
            disabled={activeSlide === slideCount - 1}
            className="text-[#F6F6F7]/50 hover:text-[#4F6BFF] disabled:opacity-20 disabled:cursor-not-allowed p-2"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Slide dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {merged.slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === activeSlide ? "w-6 bg-[#4F6BFF]" : "w-1.5 bg-[#F6F6F7]/20 hover:bg-[#F6F6F7]/40"
              }`}
            />
          ))}
        </div>

        {/* Palette */}
        {merged.palette && (
          <div className="mt-6 pt-4 border-t border-[#F6F6F7]/10">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#F6F6F7]/50 font-semibold mb-2">
              Palette
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(merged.palette).map(([name, hex]) => (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-5 h-5 border border-[#F6F6F7]/15 rounded" style={{ backgroundColor: hex }} />
                  <span className="text-[10px] uppercase tracking-wider text-[#F6F6F7]/50">{name}</span>
                  <span className="text-[10px] text-[#F6F6F7]/70 font-mono">{hex}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Caption */}
        <div className="mt-6 pt-4 border-t border-[#F6F6F7]/10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#F6F6F7]/50 font-semibold">
              Instagram Caption
            </div>
            {merged.caption && <CopyButton text={merged.caption} />}
          </div>
          <EditableText
            value={merged.caption ?? ""}
            onChange={(v) => updateEdit(-1, { caption: v })}
            className="text-sm text-[#F6F6F7] font-light leading-relaxed"
            placeholder="(no caption — click to add)"
          />
        </div>

        {exportError && (
          <div className="mt-4 text-xs text-red-400 font-light bg-red-950/30 border border-red-900/50 px-3 py-2 rounded-xl">
            {exportError}
          </div>
        )}

        {isEdited && (
          <div className="mt-4 pt-4 border-t border-[#F6F6F7]/10">
            <button
              onClick={resetEdits}
              className="text-[10px] uppercase tracking-wider text-[#6C7BFF] hover:text-[#4F6BFF] transition inline-flex items-center gap-1.5"
            >
              <RotateCcw size={10} /> Reset to AI version
            </button>
          </div>
        )}
      </div>

      {/* Hidden full-resolution export surface — positioned off-screen, NOT display:none */}
      <div
        ref={exportRef}
        aria-hidden
        style={{
          position: "absolute",
          left: "-99999px",
          top: 0,
          width: `${EXPORT_W}px`,
          pointerEvents: "none",
        }}
      >
        {merged.slides.map((s, i) => (
          <div
            key={i}
            data-export-slide
            style={{
              position: "relative",
              width: `${EXPORT_W}px`,
              height: `${EXPORT_H}px`,
              overflow: "hidden",
            }}
          >
            <SlideContent
              slide={s}
              index={i}
              total={slideCount}
              carousel={merged}
              scale={SCALE}
              staticRender
            />
          </div>
        ))}
      </div>
    </div>
  );
}