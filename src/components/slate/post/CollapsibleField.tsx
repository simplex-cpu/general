import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

/** One folding row in the same style as the slide-by-slide copy editor. */
export function CollapsibleField({ title, preview, children, defaultOpen = false }: { title: string; preview?: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-brand-line bg-brand-surface">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full min-w-0 items-center gap-2 px-3 py-2 text-left">
        {open ? <ChevronDown size={14} className="shrink-0 text-brand-ink-soft" /> : <ChevronRight size={14} className="shrink-0 text-brand-ink-soft" />}
        <span className="shrink-0 text-xs font-semibold text-brand-ink">{title}</span>
        {!open && <span className="truncate text-xs text-brand-ink-soft">{preview || "Empty"}</span>}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

export const sectionLabel = "text-[10px] uppercase tracking-[.18em] text-brand-ink-soft";
