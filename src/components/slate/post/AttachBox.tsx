import { useRef, useState, type ReactNode } from "react";
import { Link as LinkIcon, Loader2, Paperclip, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AttachItem = { key: string; name: string; href?: string; note?: string; error?: boolean; onRemove?: () => void };

/**
 * The one "Attach" control: click or drop files, or paste a Drive/Dropbox
 * link in the same box. Attached files and links are listed inside it.
 */
export function AttachBox({
  label = "Attach",
  accept,
  multiple,
  disabled,
  uploading,
  pct,
  onFiles,
  link,
  onLink,
  onSaveLink,
  savingLink,
  items = [],
  children,
  compact,
}: {
  /** Smaller controls for side panels. */
  compact?: boolean;
  label?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  uploading?: boolean;
  pct?: number;
  onFiles: (files: FileList) => void;
  link?: string;
  onLink?: (value: string) => void;
  onSaveLink?: () => void;
  savingLink?: boolean;
  items?: AttachItem[];
  children?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const validLink = /^https?:\/\//i.test((link || "").trim());
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled && e.dataTransfer.files.length) onFiles(e.dataTransfer.files); }}
      className={`rounded-xl border bg-brand-wash/60 ${compact ? "p-3" : "p-4"} shadow-[0_6px_20px_-12px_color-mix(in_oklab,var(--color-brand-ink)_35%,transparent)] transition ${over ? "border-dashed border-brand-accent bg-brand-wash" : "border-dashed border-brand-line"}`}
    >
      <input ref={input} type="file" accept={accept} multiple={multiple} className="hidden" disabled={disabled}
        onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = ""; }} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={disabled || uploading} onClick={() => input.current?.click()}
          className={`${compact ? "h-8 px-3 text-[13px] font-medium" : "h-10 px-4 text-sm font-semibold"} shrink-0 gap-2 border-brand-line bg-brand-surface text-brand-ink shadow-sm hover:border-brand-accent hover:bg-brand-surface hover:text-brand-accent`}>
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
          {uploading ? `Uploading… ${pct ?? 0}%` : `${label} file`}
        </Button>
        {onLink && (
          <div className={`flex ${compact ? "h-8 min-w-0" : "h-10 min-w-[14rem]"} flex-1 items-center gap-2 rounded-md border border-brand-line bg-brand-surface pl-3 pr-1 focus-within:ring-1 focus-within:ring-brand-accent`}>
            <LinkIcon size={14} className="shrink-0 text-brand-ink-soft" />
            <input aria-label={`${label} link`} type="url" value={link || ""} disabled={disabled} onChange={(e) => onLink(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && validLink && onSaveLink) { e.preventDefault(); onSaveLink(); } }}
              placeholder="Paste a Drive or Dropbox link" className="h-full min-w-0 flex-1 bg-transparent text-sm text-brand-ink outline-none placeholder:text-brand-ink-soft" />
            {onSaveLink && <Button type="button" size="sm" disabled={!validLink || savingLink || disabled} onClick={onSaveLink} className={`${compact ? "h-6 px-2 text-[12px] font-medium" : "h-8 px-3 text-xs"} bg-brand-accent text-brand-surface hover:bg-brand-blue-light`}>{savingLink ? <Loader2 size={12} className="animate-spin" /> : "Add link"}</Button>}
          </div>
        )}
      </div>
      {(!compact || over) && <p className="mt-2 text-xs text-brand-ink-soft">{over ? "Drop to attach" : "Or drag and drop files here"}</p>}
      {uploading && <div className="mt-3 h-1 overflow-hidden rounded-full bg-brand-line"><div className="h-full bg-brand-accent transition-all" style={{ width: `${pct ?? 0}%` }} /></div>}
      {children}
      {items.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {items.map((it) => (
            <li key={it.key} className="flex items-center gap-2 rounded-lg bg-brand-surface px-3 py-2 text-sm">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-brand-ink">{it.name}</span>
                {it.note && <span className={`block text-xs ${it.error ? "text-destructive" : "text-brand-ink-soft"}`}>{it.note}</span>}
              </span>
              {it.href && <a href={it.href} target="_blank" rel="noreferrer" title="Open" className="text-brand-ink-soft hover:text-brand-accent"><ExternalLink size={14} /></a>}
              {it.onRemove && <button type="button" title={`Remove ${it.name}`} aria-label={`Remove ${it.name}`} disabled={disabled} onClick={it.onRemove} className="text-brand-ink-soft hover:text-destructive"><Trash2 size={14} /></button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
