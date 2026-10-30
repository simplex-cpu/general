import { AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { normalizeColor } from "@/lib/slate/designFrames";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NONE = "__none__";
/** Branded dropdown used across Visual Style; never the browser's native list. */
export function BrandedSelect({ label, value, onChange, options, placeholder, itemStyle }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string; itemStyle?: (v: string) => React.CSSProperties | undefined }) {
  return <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
    <SelectTrigger aria-label={label} className="h-10 w-full rounded-lg border-brand-line bg-brand-surface text-[13px] text-brand-ink shadow-none focus:ring-2 focus:ring-brand-accent/30" style={itemStyle?.(value)}><SelectValue /></SelectTrigger>
    <SelectContent className="z-[100] max-h-80 rounded-lg border-brand-line bg-brand-surface text-brand-ink shadow-lg">
      {placeholder && <SelectItem value={NONE} className="text-[13px] focus:bg-brand-wash focus:text-brand-ink">{placeholder}</SelectItem>}
      {options.map((o) => <SelectItem key={o.value} value={o.value} className="text-[13px] focus:bg-brand-wash focus:text-brand-ink" style={itemStyle?.(o.value)}>{o.label}</SelectItem>)}
    </SelectContent>
  </Select>;
}
export const GRADIENT_DIRECTIONS = [["160", "Diagonal"], ["90", "Left to right"], ["180", "Top to bottom"], ["270", "Right to left"], ["0", "Bottom to top"]].map(([value, label]) => ({ value, label }));

export function StyleField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><div className="text-xs font-medium text-brand-ink-mid">{label}</div>{children}</div>;
}
export function ColorControl({ label, value, onChange, transparent = false }: { label: string; value: string; onChange: (v: string) => void; transparent?: boolean }) {
  const none = value.toLowerCase() === "transparent";
  const hex = normalizeColor(value, "#FFFFFF");
  return <StyleField label={label}><div className="flex h-10 items-center gap-2 rounded-md border border-brand-line bg-brand-surface px-2">
    <input type="color" aria-label={`${label} colour picker`} value={/^#[\da-f]{6}$/i.test(hex) ? hex : "#FFFFFF"} disabled={none} onChange={e => onChange(e.target.value.toUpperCase())} className="h-6 w-6 shrink-0 cursor-pointer border-0 bg-transparent p-0" />
    <input aria-label={`${label} colour`} value={none ? "" : value} placeholder={none ? "None" : "#FFFFFF"} disabled={none} onChange={e => onChange(e.target.value)} className="min-w-0 flex-1 bg-transparent text-xs uppercase text-brand-ink outline-none" />
    {transparent && <Button type="button" variant="ghost" size="sm" aria-pressed={none} title="No backing" onClick={() => onChange(none ? "#FFFFFF" : "transparent")} className={`h-7 px-2 text-xs ${none ? "bg-brand-accent/10 text-brand-accent" : "text-brand-ink-soft"}`}>None</Button>}
  </div></StyleField>;
}
export function PositionControl({ label, value, onChange, vertical = false }: { label: string; value: string; onChange: (v: string) => void; vertical?: boolean }) {
  const items = vertical ? [{ id: "top", icon: AlignStartVertical }, { id: "center", icon: AlignCenterVertical }, { id: "bottom", icon: AlignEndVertical }] : [{ id: "left", icon: AlignLeft }, { id: "center", icon: AlignCenter }, { id: "right", icon: AlignRight }];
  return <StyleField label={label}><div className="flex h-10 gap-1 rounded-md border border-brand-line bg-brand-surface p-1">{items.map(({ id, icon: Icon }) => <Button key={id} type="button" variant="ghost" aria-label={`${label}: ${id}`} title={id[0].toUpperCase() + id.slice(1)} aria-pressed={value === id} onClick={() => onChange(id)} className={`h-8 flex-1 ${value === id ? "bg-brand-accent/10 text-brand-accent" : "text-brand-ink-soft"}`}><Icon size={17} /></Button>)}</div></StyleField>;
}
export function BackgroundControl({ label, color, end, mode, direction, onColor, onEnd, onMode, onDirection }: { label: string; color: string; end: string; mode: string; direction: string; onColor: (v: string) => void; onEnd: (v: string) => void; onMode: (v: string) => void; onDirection: (v: string) => void }) {
  const first = normalizeColor(color, "#1A1A1D"), second = normalizeColor(end, "#4F6BFF");
  return <StyleField label={label}><Popover><PopoverTrigger asChild><Button type="button" variant="outline" aria-label={`Edit ${label.toLowerCase()}`} className="h-10 w-full justify-start gap-2 border-brand-line bg-brand-surface px-2 text-xs text-brand-ink hover:bg-brand-wash"><span className="h-6 w-8 rounded border border-brand-line" style={{ background: mode === "gradient" ? `linear-gradient(${direction}deg, ${first}, ${second})` : first }} /><span className="flex-1 text-left">{mode === "gradient" ? "Gradient" : "Solid"}</span><ChevronDown size={14} className="text-brand-ink-soft" /></Button></PopoverTrigger>
    <PopoverContent align="start" className="w-64 space-y-4 border-brand-line bg-brand-surface text-brand-ink"><div className="flex gap-1 rounded-md bg-brand-wash p-1">{["solid", "gradient"].map(m => <Button key={m} type="button" variant="ghost" aria-pressed={mode === m} onClick={() => onMode(m)} className={`h-8 flex-1 text-xs capitalize ${mode === m ? "bg-brand-surface text-brand-accent shadow-sm" : "text-brand-ink-soft"}`}>{m}</Button>)}</div><ColorControl label={`${label} first`} value={color || first} onChange={onColor} />{mode === "gradient" && <><ColorControl label={`${label} second`} value={end || second} onChange={onEnd} /><StyleField label="Gradient direction"><BrandedSelect label={`${label} gradient direction`} value={direction} onChange={onDirection} options={GRADIENT_DIRECTIONS} /></StyleField></>}</PopoverContent>
  </Popover></StyleField>;
}