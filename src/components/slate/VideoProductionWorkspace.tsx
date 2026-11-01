import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ExternalLink,
  Film,
  Paperclip,
  SlidersHorizontal,
  Trash2,
  Type,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FONT_OPTIONS } from "./VisualStylePanel";
import { AttachBox } from "./post/AttachBox";
import type { PhonePreviewStyle } from "./StylePhonePreview";
import {
  joinColor,
  overlaySegments,
  playableVideoUrl,
  safeFootageLink,
  splitColor,
} from "@/lib/slate/videoProduction";

export type PreviewClip = {
  id: string;
  url: string;
  name: string;
  state: "uploading" | "ready" | "failed";
  fileId?: string;
};
type Props = {
  clips: PreviewClip[];
  onRemove: (clip: PreviewClip) => void;
  onFiles: (files: FileList | null) => void;
  link: string;
  onLink: (value: string) => void;
  checking: boolean;
  linkStatus: string;
  script: string;
  onScript: (value: string) => void;
  hook: string;
  onHook: (value: string) => void;
  cta?: string;
  onCta?: (value: string) => void;
  /** Source clip ranges (one per line) for long-form clips. */
  timestamps?: string;
  talking: boolean;
  style: PhonePreviewStyle;
  onStyle: (style: PhonePreviewStyle) => void;
  brandReady: boolean;
  busy: boolean;
  frozen: boolean;
};

export function VideoProductionWorkspace(p: Props) {
  const [panel, setPanel] = useState<"footage" | "text" | "style">("footage");
  const [clipIndex, setClipIndex] = useState(0);
  const [failedSource, setFailedSource] = useState("");
  const [loadedSource, setLoadedSource] = useState("");
  const [showStyle, setShowStyle] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const source =
    p.clips[Math.min(clipIndex, Math.max(0, p.clips.length - 1))]?.url || playableVideoUrl(p.link);
  const link = safeFootageLink(p.link);
  const selectedClip = p.clips[Math.min(clipIndex, Math.max(0, p.clips.length - 1))];
  const segments = useMemo(
    () => overlaySegments(p.talking ? p.hook : p.script),
    [p.talking, p.hook, p.script],
  );
  const font = p.talking ? p.style.hookFont : p.style.captionFont;
  const styleUnavailable = !p.brandReady ? "Brand style is loading. Please wait."
    : p.checking || p.clips.some(clip => clip.state === "uploading") || (source && loadedSource !== source && failedSource !== source)
      ? "Footage is loading. Please wait before editing the style."
      : p.busy ? "Please wait for the current action to finish."
        : p.frozen ? "This request has already been submitted." : "";
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const fit = () => {
      overlay.style.fontSize = "22px";
      let size = 22;
      while (overlay.scrollHeight > overlay.clientHeight && size > 8) {
        size -= 1;
        overlay.style.fontSize = `${size}px`;
      }
    };
    const observer = new ResizeObserver(fit);
    observer.observe(overlay);
    fit();
    void document.fonts.ready.then(fit);
    return () => observer.disconnect();
  }, [p.script, p.hook, font, showStyle]);
  const overlayStyle = {
    "--video-font": font.split(",")[0] || "sans-serif",
    "--video-weight": font.match(/weight\s*(\d{3})/i)?.[1] || "600",
    "--video-color": p.talking ? p.style.hookColor : p.style.captionColor,
    "--video-backing": p.talking ? p.style.hookBacking : p.style.captionBacking,
  } as CSSProperties;
  const tabs = [
    { id: "footage", label: "Footage", icon: Film },
    { id: "text", label: "Text", icon: Type },
    { id: "style", label: "Style", icon: SlidersHorizontal },
  ] as const;
  return (
    <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col items-center gap-4 bg-brand-wash px-5 py-6 lg:sticky lg:top-0 lg:self-start">
        <div className="flex w-full items-center justify-between gap-3 text-xs text-brand-ink-soft">
          <span>{showStyle ? "Brand-style sample" : "Original footage"}</span>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showStyle}
              onChange={(e) => setShowStyle(e.target.checked)}
              className="accent-brand-accent"
            />
            Style sample
          </label>
        </div>
        <div className="video-production-stage" style={overlayStyle}>
          {source && failedSource !== source ? (
            <video
              key={source}
              src={source}
              controls
              playsInline
              preload="metadata"
              aria-label="Footage preview"
              onLoadedData={() => setLoadedSource(source)}
              onError={() => setFailedSource(source)}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-end gap-3 px-8 pb-6 text-center text-brand-cream">
              <Film size={32} />
              <span className="text-sm">
                {selectedClip
                  ? "This video format cannot play in this browser"
                  : link
                    ? "Linked footage"
                    : "No footage attached"}
              </span>
              {selectedClip && (
                <Button
                  asChild
                  variant="outline"
                  className="border-brand-line bg-brand-surface text-brand-accent"
                >
                  <a href={selectedClip.url} download={selectedClip.name}>
                    <ExternalLink />
                    Download original
                  </a>
                </Button>
              )}
              {link && (
                <Button
                  asChild
                  variant="outline"
                  className="border-brand-line bg-brand-surface text-brand-accent"
                >
                  <a href={link} target="_blank" rel="noreferrer">
                    <ExternalLink />
                    Open original
                  </a>
                </Button>
              )}
            </div>
          )}
          {showStyle && segments.length > 0 && (
            <div
              ref={overlayRef}
              className={`video-production-overlay ${p.talking ? "video-production-hook" : "video-production-caption"}`}
            >
              <span>{segments[0]}</span>
            </div>
          )}
        </div>
        {p.clips.length > 1 && (
          <div className="flex w-full flex-wrap gap-2" aria-label="Clip selection">
            {p.clips.map((clip, i) => (
              <Button
                key={clip.id}
                variant="outline"
                aria-pressed={clipIndex === i}
                onClick={() => setClipIndex(i)}
                className={`max-w-full bg-brand-surface hover:bg-brand-wash text-xs ${clipIndex === i ? "border-brand-accent text-brand-accent" : "border-brand-line text-brand-ink"}`}
              >
                <Film size={14} />
                <span className="truncate">{clip.name}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
      <div className="min-w-0 border-brand-line p-5 lg:border-l">
        <div
          role="tablist"
          aria-label="Video controls"
          className="mb-5 flex gap-2 border-b border-brand-line pb-4"
        >
          <TooltipProvider delayDuration={150}>
          {tabs.map((tab) => (
            <Tooltip key={tab.id}>
            <TooltipTrigger asChild>
            <span className="flex min-w-0 flex-1" tabIndex={tab.id === "style" && styleUnavailable ? 0 : undefined}>
            <Button
              variant="outline"
              role="tab"
              aria-selected={panel === tab.id}
              disabled={tab.id === "style" && !!styleUnavailable}
              onClick={() => setPanel(tab.id)}
              className={`flex-1 bg-brand-surface hover:bg-brand-wash px-2 text-xs ${panel === tab.id ? "border-brand-accent text-brand-accent" : "border-brand-line text-brand-ink"}`}
            >
              <tab.icon size={14} />
              {tab.label}
            </Button>
            </span>
            </TooltipTrigger>
            {tab.id === "style" && styleUnavailable && <TooltipContent className="bg-brand-ink text-brand-surface">{styleUnavailable}</TooltipContent>}
            </Tooltip>
          ))}
          </TooltipProvider>
        </div>
        {panel === "footage" && (
          <div className="space-y-4">
            {!!p.timestamps?.trim() && (
              <div className="rounded-md border border-brand-line bg-brand-wash/40 p-3">
                <h4 className="text-xs font-semibold text-brand-ink">Clip seconds to use</h4>
                <ul className="mt-2 space-y-1">
                  {p.timestamps.split(/\n+/).map((t) => t.trim()).filter(Boolean).map((t, i) => (
                    <li key={i} className="font-mono text-xs tabular-nums text-brand-ink-mid">{t}</li>
                  ))}
                </ul>
              </div>
            )}
            <AttachBox
              multiple
              accept="video/*"
              disabled={p.busy || p.frozen}
              uploading={p.clips.some((clip) => clip.state === "uploading")}
              onFiles={(files) => p.onFiles(files)}
              link={p.link}
              onLink={p.onLink}
              items={p.clips.map((clip) => ({ key: clip.id, name: clip.name, error: clip.state === "failed", note: clip.state === "ready" ? "Ready" : clip.state === "failed" ? "Upload failed — remove and attach again" : "Uploading…", onRemove: () => p.onRemove(clip) }))}
            >
              {p.checking ? (
                <p className="mt-2 flex items-center gap-2 text-xs text-brand-ink-soft">
                  <Loader2 size={12} className="animate-spin" />
                  Checking footage…
                </p>
              ) : (
                p.link && (
                  <p
                    role="status"
                    className={`mt-2 text-xs ${["invalid", "empty", "unreachable"].includes(p.linkStatus) ? "text-destructive" : "text-brand-ink-soft"}`}
                  >
                    {p.linkStatus === "ok"
                      ? "Footage link is ready."
                      : p.linkStatus === "empty"
                        ? "The folder is empty."
                        : ["invalid", "unreachable"].includes(p.linkStatus)
                          ? "We cannot open this link. Check its sharing permissions."
                          : "Link access could not be verified."}
                  </p>
                )
              )}
            </AttachBox>
          </div>
        )}
        {panel === "text" && (
          <div className="space-y-5">
            {p.talking && (
              <label className="block text-sm font-medium">
                Visual hook
                <textarea
                  aria-label="Visual hook"
                  value={p.hook}
                  disabled={p.frozen || p.busy}
                  onChange={(e) => p.onHook(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-md border border-brand-line bg-brand-surface p-3 text-sm outline-none focus:border-brand-accent"
                />
              </label>
            )}
            {p.talking ? (
              <label className="block text-sm font-medium">
                Visual CTA
                <input
                  aria-label="Visual CTA"
                  value={p.cta || ""}
                  disabled={p.frozen || p.busy}
                  onChange={(e) => p.onCta?.(e.target.value)}
                  placeholder="e.g. Follow for more tips like this"
                  className="mt-2 h-9 w-full rounded-md border border-brand-line bg-brand-surface px-3 text-sm outline-none focus:border-brand-accent"
                />
                {!p.cta?.trim() && <span className="mt-1 block text-xs font-normal text-brand-ink-soft">Add the text shown at the end of the video.</span>}
              </label>
            ) : (
              <label className="block text-sm font-medium">
                Text overlay
                <textarea
                  aria-label="Text overlay"
                  value={p.script}
                  disabled={p.frozen || p.busy}
                  onChange={(e) => p.onScript(e.target.value)}
                  rows={6}
                  className="mt-2 w-full rounded-md border border-brand-line bg-brand-surface p-3 text-sm leading-relaxed outline-none focus:border-brand-accent"
                />
              </label>
            )}
          </div>
        )}
        {panel === "style" && (
          <div className="space-y-5">
            {!p.brandReady ? (
              <p className="flex items-center gap-2 text-sm text-brand-ink-soft">
                <Loader2 className="animate-spin" size={16} />
                Loading brand style…
              </p>
            ) : (
              <>
                <div>
                  <h4 className="text-sm font-semibold">Brand style</h4>
                  <p className="mt-1 text-xs text-brand-ink-soft">
                    Changes update this preview and are saved for this request.
                  </p>
                </div>
                {(p.talking
                  ? ([
                      ["Hook", "hookFont", "hookColor", "hookBacking"],
                      ["Caption", "captionFont", "captionColor", "captionBacking"],
                    ] as const)
                  : ([["Text overlay", "captionFont", "captionColor", "captionBacking"]] as const)
                ).map(([label, fontKey, colorKey, backingKey]) => {
                  const color = splitColor(p.style[colorKey]);
                  const backing = splitColor(p.style[backingKey]);
                  const set = (key: keyof PhonePreviewStyle, value: string) =>
                    p.onStyle({ ...p.style, [key]: value });
                  const locked = p.frozen || p.busy;
                  return (
                    <div key={label} className="space-y-3 rounded-md border border-brand-line p-3">
                      <label className="block text-xs text-brand-ink-soft">
                        {label} font
                        <Select value={p.style[fontKey]} disabled={locked || !!styleUnavailable} onValueChange={value => set(fontKey, value)}>
                          <SelectTrigger aria-label={`${label} font`} className="mt-1 border-brand-line bg-brand-surface text-brand-ink"><SelectValue /></SelectTrigger>
                          <SelectContent className="z-[100] border-brand-line bg-brand-surface text-brand-ink">
                            {[...new Set([p.style[fontKey], ...FONT_OPTIONS])].filter(Boolean).map(value => <SelectItem key={value} value={value} className="focus:bg-brand-wash focus:text-brand-ink">{value}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </label>
                      <label className="flex items-center justify-between gap-3 text-sm">
                        {label} color
                        <input
                          type="color"
                          aria-label={`${label} color`}
                          value={color.hex}
                          disabled={locked}
                          onChange={(e) => set(colorKey, e.target.value)}
                          className="h-8 w-12 cursor-pointer rounded border border-brand-line bg-brand-surface"
                        />
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center justify-between gap-3 text-sm">
                          {label} backing
                          <input
                            type="color"
                            aria-label={`${label} backing`}
                            value={backing.hex}
                            disabled={locked}
                            onChange={(e) =>
                              set(backingKey, joinColor(e.target.value, backing.opacity || 100))
                            }
                            className="h-8 w-12 cursor-pointer rounded border border-brand-line bg-brand-surface"
                          />
                        </label>
                        <label className="flex items-center gap-3 text-xs text-brand-ink-soft">
                          Opacity
                          <input
                            type="range"
                            min={0}
                            max={100}
                            aria-label={`${label} backing opacity`}
                            value={backing.opacity}
                            disabled={locked}
                            onChange={(e) =>
                              set(backingKey, joinColor(backing.hex, Number(e.target.value)))
                            }
                            className="flex-1 accent-brand-accent"
                          />
                          <span className="w-9 text-right">{backing.opacity}%</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </>

            )}
          </div>
        )}
      </div>
    </div>
  );
}
