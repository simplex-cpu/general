import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export type BrandOption = { label: string; value: string; icon?: React.ReactNode };

/**
 * Small branded dropdown so table and dialog pickers match the app styling
 * instead of rendering the operating system's native select popup.
 */
export function BrandSelect({
  value,
  options,
  onChange,
  disabled,
  placeholder = "—",
  variant = "inline",
  className = "",
  align = "left",
  chipColor,
}: {
  value: string;
  options: BrandOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** "inline" for table cells, "field" for form fields, "chip" for a coloured status chip. */
  variant?: "inline" | "field" | "chip";
  className?: string;
  align?: "left" | "right";
  /** Background colour for the chip variant. */
  chipColor?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; right: number; width: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // The menu floats over the page, so close it when anything scrolls.
    const onScroll = (e: Event) => { if (!menuRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const trigger =
    variant === "field"
      ? "mt-1 w-full justify-between border border-[#E5E5E8] rounded-lg px-3 py-2 bg-white text-sm text-[#1A1A1D] hover:border-[#7B83FF]"
      : variant === "chip"
        ? "gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider hover:opacity-90"
        : "justify-between gap-1.5 rounded px-2 py-1 text-sm text-[#4A4A52] bg-transparent border border-transparent hover:border-[#E5E5E8]";
  const chipBg = chipColor || "#E5E7EB";
  const h = chipBg.replace("#", "");
  const lum =
    (0.299 * parseInt(h.slice(0, 2), 16) +
      0.587 * parseInt(h.slice(2, 4), 16) +
      0.114 * parseInt(h.slice(4, 6), 16)) /
    255;
  const chipStyle =
    variant === "chip"
      ? { backgroundColor: chipBg, color: lum > 0.6 ? "#1A1A1D" : "#FFFFFF" }
      : undefined;

  return (
    <div ref={wrapRef} className={`relative ${className}`} data-no-open>
      <button
        type="button"
        disabled={disabled}
        style={chipStyle}
        onClick={(e) => {
          e.stopPropagation();
          const r = wrapRef.current?.getBoundingClientRect();
          if (r) setPos({ top: r.bottom + 4, left: r.left, right: window.innerWidth - r.right, width: r.width });
          setOpen((v) => !v);
        }}
        className={`flex items-center ${trigger} outline-none transition-colors disabled:opacity-50 ${open && variant !== "chip" ? "border-[#7B83FF]" : ""}`}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 ${variant === "chip" ? "opacity-70" : "text-[#9B9BA1]"}`} />
      </button>


      {open && pos && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          data-no-open
          style={{ position: "fixed", top: pos.top, minWidth: pos.width, ...(align === "right" ? { right: pos.right } : { left: pos.left }) }}
          className="z-[200] max-h-64 overflow-y-auto rounded-lg border border-[#E5E5E8] bg-white py-1 shadow-[0_12px_30px_-12px_rgba(26,26,29,.35)]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value || "__empty"}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  if (o.value !== value) onChange(o.value);
                }}
                className={`flex w-full items-center justify-between gap-3 whitespace-nowrap px-3 py-1.5 text-left text-sm transition-colors ${
                  active ? "bg-[#EEF1FF] text-[#4F6BFF]" : "text-[#2A2A2E] hover:bg-[#F7F7F9]"
                }`}
              >
                <span className="inline-flex items-center gap-2">{o.icon}{o.label}</span>
                {active && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}

/**
 * Same look as BrandSelect, but several values can be picked at once. Used for
 * platforms so the field stays one line instead of a row of chips.
 */
export function BrandMultiSelect({
  values,
  options,
  onChange,
  disabled,
  placeholder = "Select…",
  className = "",
  iconOnly = false,
}: {
  iconOnly?: boolean;
  values: string[];
  options: BrandOption[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectedOptions = options.filter((o) => values.includes(o.value));

  return (
    <div ref={wrapRef} className={`relative ${className}`} data-no-open>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`mt-1 flex w-full items-center justify-between border border-[#E5E5E8] rounded-lg px-3 py-2 bg-white text-sm text-[#1A1A1D] hover:border-[#7B83FF] outline-none transition-colors disabled:opacity-50 ${open ? "border-[#7B83FF]" : ""}`}
      >
        <span className={`flex min-w-0 items-center gap-2 truncate ${selectedOptions.length ? "" : "text-[#9B9BA1]"}`}>
          {selectedOptions.length ? selectedOptions.map((option) => iconOnly && option.icon ? <span key={option.value} title={option.label} aria-label={option.label} className="inline-flex items-center">{option.icon}</span> : <span key={option.value} className="inline-flex items-center gap-1 whitespace-nowrap">{option.icon}{option.label}</span>) : placeholder}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#9B9BA1]" />
      </button>

      {open && (
        <div className="absolute z-50 left-0 mt-1 min-w-full max-h-64 overflow-y-auto rounded-lg border border-[#E5E5E8] bg-white py-1 shadow-[0_12px_30px_-12px_rgba(26,26,29,.35)]">
          {options.map((o) => {
            const active = values.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(active ? values.filter((v) => v !== o.value) : [...values, o.value]);
                }}
                className={`flex w-full items-center justify-between gap-3 whitespace-nowrap px-3 py-1.5 text-left text-sm transition-colors ${
                  active ? "bg-[#EEF1FF] text-[#4F6BFF]" : "text-[#2A2A2E] hover:bg-[#F7F7F9]"
                }`}
              >
                <span className="inline-flex items-center gap-2">{o.icon}{o.label}</span>
                {active && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
