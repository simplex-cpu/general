// One-item-at-a-time viewer for post media (images and videos): arrows, dots,
// counter, keyboard arrows, swipe and thumbnails, framed at the post's social size.
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, FileText, Play, Trash2 } from "lucide-react";
import { isReelRatio, type SocialShape } from "@/lib/slate/socialSizes";

type Slide = { id?: string; url: string; filename: string; type?: string };

const isVideoItem = (s: Slide) => /^video\//i.test(s.type || "") || /\.(mp4|webm|mov|m4v)(?:\?|#|$)/i.test(s.filename || s.url);
const isImageItem = (s: Slide) => /^image\//i.test(s.type || "") || /\.(png|jpe?g|webp|gif|avif)(?:\?|#|$)/i.test(s.filename || s.url) || (!isVideoItem(s) && !/\.[a-z0-9]{2,4}(?:\?|$)/i.test(s.filename || ""));

export function SlideCarousel({ slides, onRemove, shape }: { slides: Slide[]; onRemove?: (index: number) => void; shape?: SocialShape }) {
  const [i, setI] = useState(0);
  const [offRatio, setOffRatio] = useState<Record<string, boolean>>({});
  const touch = useRef<number | null>(null);
  const n = slides.length;
  const at = Math.min(i, n - 1);
  const go = (d: number) => setI((v) => (Math.min(v, n - 1) + d + n) % n);
  useEffect(() => { if (i > n - 1) setI(Math.max(0, n - 1)); }, [n, i]);
  if (!n) return null;
  const s = slides[at];
  const frame = (shape || (slides.some(isVideoItem) ? "reel" : "feed")) === "reel" ? "aspect-[9/16] max-h-[520px]" : "aspect-[4/5] max-h-[520px]";
  const video = isVideoItem(s);
  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); }}
      className="rounded-xl border border-brand-line bg-brand-surface p-3 outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
    >
      <div
        className="relative flex items-center justify-center rounded-lg bg-brand-navy"
        onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        <div className={`relative mx-auto h-full w-auto overflow-hidden ${frame}`} style={{ maxWidth: "100%" }}>
          {video ? (
            <video key={s.url} src={s.url} controls playsInline preload="metadata" aria-label={s.filename}
              onLoadedMetadata={(e) => { const v = e.currentTarget; setOffRatio((m) => ({ ...m, [s.url]: !isReelRatio(v.videoWidth, v.videoHeight) })); }}
              className="h-full w-full object-contain" />
          ) : isImageItem(s) ? (
            <img src={s.url} alt={s.filename} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-brand-cream"><FileText size={24} /><span className="px-4 text-center text-xs">{s.filename}</span></div>
          )}
        </div>
        {n > 1 && (
          <>
            <button type="button" aria-label="Previous" onClick={() => go(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-brand-line bg-brand-surface p-2 text-brand-ink shadow-sm"><ChevronLeft size={16} /></button>
            <button type="button" aria-label="Next" onClick={() => go(1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-brand-line bg-brand-surface p-2 text-brand-ink shadow-sm"><ChevronRight size={16} /></button>
          </>
        )}
        <div className="absolute right-2 top-2 flex gap-1">
          <a href={s.url} target="_blank" rel="noreferrer" title="Open" className="rounded-md border border-brand-line bg-brand-surface p-1.5 text-brand-ink-soft"><ExternalLink size={14} /></a>
          {onRemove && <button type="button" title="Remove" onClick={() => onRemove(at)} className="rounded-md border border-brand-line bg-brand-surface p-1.5 text-destructive"><Trash2 size={14} /></button>}
        </div>
        {video && offRatio[s.url] && <span className="absolute left-2 top-2 rounded-md bg-brand-surface px-2 py-1 text-[11px] font-medium text-destructive">Not 9:16</span>}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-brand-ink-soft">
        <span className="truncate">{s.filename}</span>
        <span className="shrink-0 font-semibold">{at + 1} / {n}</span>
      </div>
      {n > 1 && (
        <>
          <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
            {slides.map((x, k) => <span key={x.id || k} className={`h-1.5 rounded-full transition-all ${k === at ? "w-4 bg-brand-accent" : "w-1.5 bg-brand-line"}`} />)}
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {slides.map((x, k) => (
              <button key={x.id || k} type="button" aria-label={`Item ${k + 1}`} onClick={() => setI(k)} className={`relative h-16 w-12 shrink-0 overflow-hidden rounded-md border-2 bg-brand-navy ${k === at ? "border-brand-accent" : "border-transparent opacity-70"}`}>
                {isVideoItem(x) ? <><video src={`${x.url}#t=0.5`} preload="metadata" muted className="h-full w-full object-cover" /><Play size={12} className="absolute inset-0 m-auto text-brand-surface" /></> : <img src={x.url} alt="" className="h-full w-full object-cover" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export const MediaCarousel = SlideCarousel;
