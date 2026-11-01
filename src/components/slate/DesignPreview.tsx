import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  familyOf,
  frameBackgroundCss,
  blockWeight,
  fittedBlockSize,
  PHOTO_VEIL_OPACITY,
  SAFE_INSET,
  type DesignFrame,
} from "@/lib/slate/designFrames";

/** One frame drawn with CSS, matching the exported PNG layout. */
export const DesignFrameView = memo(function DesignFrameView({
  frame,
  width: maxWidth = 300,
  hint,
}: {
  frame: DesignFrame;
  width?: number;
  /** Shown only in the preview when this frame has no copy yet. */
  hint?: string;
}) {
  const hasCopy = frame.blocks.some((b) => (b.text || "").trim());
  // Shrink to the available space on narrow screens so the frame never overflows.
  const holder = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(maxWidth);
  const sizes = useMemo(() => frame.blocks.map((block) => fittedBlockSize(block, width)), [frame.blocks, width]);
  useEffect(() => {
    const el = holder.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const avail = el.clientWidth;
      setWidth(avail > 0 ? Math.min(maxWidth, avail) : maxWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxWidth]);

  return (
    <div ref={holder} className="flex w-full justify-center">
    <div
      className="relative overflow-hidden rounded-lg shadow-design-frame"
      style={{ width, height: (width * 1350) / 1080, background: frameBackgroundCss(frame) }}
    >

      {frame.photoUrl && (
        <>
          <img
            src={frame.photoUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-navy" style={{ opacity: PHOTO_VEIL_OPACITY }} />
        </>
      )}
      <div
        className={`absolute inset-0 flex flex-col ${
          frame.verticalAlign === "top"
            ? "justify-start"
            : frame.verticalAlign === "bottom"
              ? "justify-end"
              : "justify-center"
        } ${frame.align === "center" ? "items-center text-center" : frame.align === "right" ? "items-end text-right" : "items-start text-left"}`}
        style={{ padding: width * SAFE_INSET }}
      >
        {frame.blocks.map((block, i) => {
          const text = block.uppercase ? (block.text || "").toUpperCase() : block.text || "";
          if (!text.trim()) return null;
          return (
            <div
              key={i}
              className={`break-words whitespace-pre-wrap ${block.pill ? `${frame.align === "right" ? "ml-auto" : frame.align === "left" ? "mr-auto" : "mx-auto"} w-fit max-w-full rounded-full px-[1em] py-[.55em]` : "w-full"}`}
              style={{
                fontFamily: `${familyOf(block.font)}, sans-serif`,
                fontWeight: blockWeight(block),
                color: block.color,
                fontSize: sizes[i],
                lineHeight: block.lineHeight,
                marginTop: width * (block.gap ?? 0),
                letterSpacing: 0,
                maxHeight: block.maxHeightRatio ? (width * 1350 * block.maxHeightRatio) / 1080 : undefined,
                backgroundColor: block.pill ? block.pillBackground : undefined,
                overflow: "hidden",
              }}
            >
              {text}
            </div>
          );
        })}
        {!hasCopy && hint && (
          <div
            className="w-full text-center opacity-50"
            style={{
              fontFamily: `${familyOf(frame.blocks[0]?.font || "")}, sans-serif`,
              color: frame.blocks[0]?.color || "#FFFFFF",
              fontSize: width * 0.05,
              lineHeight: 1.3,
            }}
          >
            {hint}
          </div>
        )}
      </div>
    </div>
    </div>
  );
});

/** Frame viewer with slide navigation for carousels. */
export default function DesignPreview({
  frames,
  width = 300,
  index,
  onIndexChange,
}: {
  frames: DesignFrame[];
  width?: number;
  index?: number;
  onIndexChange?: (i: number) => void;
}) {
  const [internal, setInternal] = useState(0);
  const total = frames.length;
  const active = Math.min(Math.max(index ?? internal, 0), Math.max(0, total - 1));
  const setActive = (i: number) => {
    const next = total ? ((i % total) + total) % total : 0;
    setInternal(next);
    onIndexChange?.(next);
  };

  useEffect(() => {
    setInternal((prev) => Math.min(prev, Math.max(0, total - 1)));
  }, [total]);

  if (!total) return null;
  const frame = frames[active];
  const multi = total > 1;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <DesignFrameView
        frame={frame}
        width={width}
        hint={multi ? `${frame.label} copy goes here` : "Your copy goes here"}
      />
      <div className="flex items-center gap-3 text-[#4A4A52]">
        {multi && (
          <Button variant="outline" size="icon-sm"
            type="button"
            onClick={() => setActive(active - 1)}
            aria-label="Previous slide"
            className="border-brand-line bg-brand-surface text-brand-ink hover:bg-brand-wash"
          >
            <ChevronLeft size={14} />
          </Button>
        )}
        <span className="text-[10px] uppercase tracking-[.16em]">
          {frame.label}
          {multi ? ` · ${active + 1}/${total}` : ""}
        </span>
        {multi && (
          <Button variant="outline" size="icon-sm"
            type="button"
            onClick={() => setActive(active + 1)}
            aria-label="Next slide"
            className="border-brand-line bg-brand-surface text-brand-ink hover:bg-brand-wash"
          >
            <ChevronRight size={14} />
          </Button>
        )}
      </div>
      {multi && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {frames.map((_, i) => (
            <Button variant="outline" size="icon-sm"
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === active ? "step" : undefined}
              className={`border-brand-line ${i === active ? "border-brand-accent bg-brand-accent text-brand-surface hover:bg-brand-blue-mid" : "bg-brand-surface text-brand-ink hover:bg-brand-wash"}`}
            >{i + 1}</Button>
          ))}
        </div>
      )}
    </div>
  );
}
