// Content card "Media to post" stage: a light rounded stage with the post centered at its social size.
// Video: dark 9:16 frame, center play button, duration, open icon (B-roll adds its tag + overlay text).
// Carousel/graphic: 4:5 card with "01 / 07", side arrows and numbered thumbnails.
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, ImageIcon, Play, Trash2 } from "lucide-react";

type Item = { id?: string; url: string; filename: string; type?: string };
const isVideo = (s: Item) => /^video\//i.test(s.type || "") || /\.(mp4|webm|mov|m4v)(?:\?|#|$)/i.test(s.filename || s.url);
const pad = (n: number) => String(n).padStart(2, "0");
const clock = (s: number) => (Number.isFinite(s) && s > 0 ? `${Math.floor(s / 60)}:${pad(Math.round(s % 60))}` : "");

export function mediaMeta(items: Item[], reel: boolean) {
  if (!items.length) return "";
  if (items.length > 1) return `${items.length} slides · ${reel ? "9:16" : "4:5"}`;
  return `${items[0].filename || "file"} · ${reel || isVideo(items[0]) ? "9:16" : "4:5"}`;
}

export function MediaStage({ items, reel, broll, overlay, onRemove }: { items: Item[]; reel: boolean; broll?: boolean; overlay?: string; onRemove?: (i: number) => void }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [dur, setDur] = useState(0);
  const ref = useRef<HTMLVideoElement>(null);
  const n = items.length;
  const at = Math.min(i, Math.max(0, n - 1));
  useEffect(() => { setPlaying(false); setDur(0); }, [at]);
  const go = (d: number) => setI((v) => (Math.min(v, n - 1) + d + n) % n);
  const s = items[at];
  const video = s ? isVideo(s) : reel;
  const vertical = reel || video;

  return (
    <div tabIndex={0} onKeyDown={(e) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); }}
      className="flex min-h-[420px] flex-1 flex-col items-center justify-center gap-5 rounded-2xl border border-[#EDEDF0] bg-gradient-to-b from-[#FAFAFB] to-[#F2F3F5] px-6 py-8 outline-none">
      <div className="relative flex w-full items-center justify-center">
        {n > 1 && <button type="button" aria-label="Previous" onClick={() => go(-1)} className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-[#E5E5E8] bg-white p-2.5 text-[#1A1A1D] shadow-sm hover:bg-[#F7F7F9] md:left-[6%]"><ChevronLeft size={16} /></button>}
        <div className={`relative overflow-hidden rounded-2xl shadow-[0_24px_48px_-20px_rgba(17,24,39,.35)] ${vertical ? "aspect-[9/16] h-[min(62vh,560px)] bg-gradient-to-b from-[#2B303B] to-[#12151C]" : "aspect-[4/5] h-[min(58vh,520px)] border border-[#EDEDF0] bg-white"}`}>
          {!s ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#9B9BA1]"><ImageIcon size={26} /><span className="text-xs">No media yet</span></div>
          ) : video ? (
            <>
              <video ref={ref} key={s.url} src={s.url} playsInline preload="metadata" controls={playing} aria-label={s.filename}
                onLoadedMetadata={(e) => setDur(e.currentTarget.duration)} onPause={() => setPlaying(false)}
                className="h-full w-full object-cover" />
              {!playing && (
                <>
                  <button type="button" aria-label="Play" onClick={() => { setPlaying(true); void ref.current?.play(); }} className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#1A1A1D] shadow-lg transition hover:scale-105"><Play size={18} fill="currentColor" /></button>
                </>
              )}
            </>
          ) : (
            <img src={s.url} alt={s.filename} className="h-full w-full object-cover" />
          )}
          {s && !playing && (
            <div className="absolute right-3 top-3 flex gap-1.5">
              <a href={s.url} target="_blank" rel="noreferrer" title="Open in new tab" className="rounded-lg bg-black/45 p-1.5 text-white hover:bg-black/60"><ExternalLink size={14} /></a>
              {onRemove && <button type="button" title="Remove" onClick={() => onRemove(at)} className="rounded-lg bg-black/45 p-1.5 text-white hover:bg-destructive"><Trash2 size={14} /></button>}
            </div>
          )}
        </div>
        {n > 1 && <button type="button" aria-label="Next" onClick={() => go(1)} className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-[#E5E5E8] bg-white p-2.5 text-[#1A1A1D] shadow-sm hover:bg-[#F7F7F9] md:right-[6%]"><ChevronRight size={16} /></button>}
      </div>
      {n > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          {items.map((x, k) => (
            <button key={x.id || k} type="button" aria-label={`Slide ${k + 1}`} onClick={() => setI(k)}
              className={`h-10 w-9 rounded-lg border bg-white text-[11px] font-medium shadow-sm transition ${k === at ? "border-2 border-brand-accent text-brand-accent" : "border-[#E5E5E8] text-[#6A6A72] hover:border-[#C7CCFF]"}`}>{k + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}
