import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { readSimpleStyle, simpleStyleToFields, SURFACES, type SimpleStyle, type Surface } from "@/lib/slate/brandVisualStyle";
import { StyleField, ColorControl, BrandedSelect, GRADIENT_DIRECTIONS } from "./VisualStyleControls";

export const FONT_OPTIONS = [
  "Inter, weight 900", "Montserrat, weight 800", "Poppins, weight 700", "Anton, weight 400", "Playfair Display, weight 700", "Space Grotesk, weight 700",
  "Bebas Neue, weight 400", "Oswald, weight 700", "Archivo Black, weight 400", "DM Sans, weight 700", "Manrope, weight 800", "Plus Jakarta Sans, weight 800",
  "Sora, weight 700", "Outfit, weight 700", "Syne, weight 800", "Raleway, weight 800", "Work Sans, weight 700", "Lato, weight 900",
  "DM Serif Display, weight 400", "Fraunces, weight 700", "Lora, weight 700", "Libre Baskerville, weight 700", "Cormorant Garamond, weight 700", "Abril Fatface, weight 400",
];
export const fontFamilyOf = (v: string) => v.split(",")[0].trim() || undefined;
export const fontWeightOf = (v: string) => { const m = v.match(/weight\s*(\d{3})/i); return m ? Number(m[1]) : undefined; };
function FontSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <StyleField label={label}><BrandedSelect label={`${label} font`} value={value} onChange={onChange} placeholder="Brand default" options={FONT_OPTIONS.map(o => ({ value: o, label: o.split(",")[0] }))} itemStyle={v => v ? { fontFamily: fontFamilyOf(v), fontWeight: fontWeightOf(v) } : undefined} /></StyleField>;
}
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-brand-line bg-brand-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-8"><header className="mb-6 border-b border-brand-line pb-4"><h3 className="text-[15px] font-semibold tracking-tight text-brand-ink">{title}</h3>{hint && <p className="mt-1 text-xs text-brand-ink-soft">{hint}</p>}</header>{children}</section>; }
export default function VisualStylePanel({ values, set, onSave, saving, saved }: { values: Record<string, string>; set: (k: string, v: string) => void; onSave: () => void; saving: boolean; saved: boolean }) {
  const style = readSimpleStyle(values);
  const update = (patch: Partial<SimpleStyle>) => { for (const [k, val] of Object.entries(simpleStyleToFields(values, { ...style, ...patch }))) set(k, val); };
  const accents = style.accents;
  const a1 = accents[0] || "#4F6BFF";
  const grad = style.gradient;
  const bgOf = (k: Surface) => k === "gradient" ? `linear-gradient(${grad.angle}deg, ${grad.start}, ${grad.end})` : k === "light" ? style.lightBg : k === "brand" ? style.brandBg : style.darkBg;
  const inkOf = (k: Surface) => k === "light" ? style.lightInk : style.footageInk;
  const Card = ({ label, bg, ink }: { label: string; bg: string; ink: string }) => <div><span className="grid aspect-video w-full place-items-center rounded-xl border border-brand-line p-4 text-center" style={{ background: bg, color: ink }}><span><span className="block text-lg font-bold leading-tight" style={{ fontFamily: fontFamilyOf(style.titleFont), fontWeight: fontWeightOf(style.titleFont) }}>Your big idea</span><span className="mt-1 block text-xs" style={{ fontFamily: fontFamilyOf(style.bodyFont) }}>Supporting text</span></span></span><span className="mt-2 block text-xs font-medium text-brand-ink">{label}</span></div>;
  return <div id="visual-style" className="visual-style-workspace min-h-0 bg-social-feed lg:h-full lg:overflow-y-auto">
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-8">
      <Section title="Fonts" hint="Pick a title, subtitle and body font. Each option previews in its own style."><div className="grid gap-5 sm:grid-cols-3"><FontSelect label="Title font" value={style.titleFont} onChange={s => update({ titleFont: s })} /><FontSelect label="Subtitle font" value={style.subtitleFont} onChange={s => update({ subtitleFont: s })} /><FontSelect label="Body font" value={style.bodyFont} onChange={s => update({ bodyFont: s })} /></div></Section>
      <Section title="Colors" hint="Accents highlight key words. Text and background colors keep every design readable.">
        <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <ColorControl label="Accent 1" value={a1} onChange={c => update({ accents: [c, accents[1] || a1] })} />
          <ColorControl label="Accent 2" value={accents[1] || a1} onChange={c => update({ accents: [a1, c] })} />
          <ColorControl label="Text color over footage" value={style.footageInk} onChange={c => update({ footageInk: c })} />
          <ColorControl label="Text color over light" value={style.lightInk} onChange={c => update({ lightInk: c })} />
          <ColorControl label="Light background" value={style.lightBg} onChange={c => update({ lightBg: c })} />
          <ColorControl label="Dark background" value={style.darkBg} onChange={c => update({ darkBg: c })} />
          <ColorControl label="Brand background" value={style.brandBg} onChange={c => update({ brandBg: c })} />
          <div className="space-y-2">
          <label className="flex items-center justify-between gap-3 text-xs font-medium text-brand-ink"><span>Gradient <span className="font-normal text-brand-ink-soft">(optional)</span></span><Switch aria-label="Use gradient" checked={grad.on} onCheckedChange={on => update({ gradient: { ...grad, on } })} /></label>
          {grad.on && <div className="grid grid-cols-2 gap-2">
            <ColorControl label="From" value={grad.start} onChange={c => update({ gradient: { ...grad, start: c } })} />
            <ColorControl label="To" value={grad.end} onChange={c => update({ gradient: { ...grad, end: c } })} />
            <div className="col-span-2"><StyleField label="Direction"><BrandedSelect label="Gradient direction" value={String(grad.angle)} onChange={v => update({ gradient: { ...grad, angle: Number(v) } })} options={GRADIENT_DIRECTIONS} /></StyleField></div>
          </div>}
          </div>
        </div>
      </Section>
      <Section title="Backgrounds" hint="Choose the background for the cover, the slides in between and the closing slide.">
        <div className="grid gap-6 sm:grid-cols-3">{([["cover", "Cover"], ["slides", "Slides"], ["closing", "Closing"]] as const).map(([key, label]) => { const cur = style[key] || "dark"; const opts = SURFACES.filter(o => o !== "gradient" || grad.on || cur === "gradient"); return <div key={key} className="space-y-2">
          <Card label={label} bg={bgOf(cur)} ink={inkOf(cur)} />
          <div role="radiogroup" aria-label={`${label} background`} className="flex gap-1.5">{opts.map(o => <button key={o} type="button" role="radio" aria-checked={cur === o} aria-label={`${label}: ${o}`} title={o[0].toUpperCase() + o.slice(1)} onClick={() => update({ [key]: o } as Partial<SimpleStyle>)} className={`h-8 flex-1 rounded-lg border-2 transition-all ${cur === o ? "border-brand-accent ring-2 ring-brand-accent/20" : "border-brand-line hover:border-brand-ink-grey"}`} style={{ background: bgOf(o) }} />)}</div>
          <p className="text-[11px] capitalize text-brand-ink-soft">{cur}</p>
        </div>; })}</div>
      </Section>
      <div className="sticky bottom-4 flex justify-end"><Button onClick={onSave} disabled={saving} className="brand-slim-action h-9 shadow-lg gap-2 rounded-md bg-brand-accent px-4 text-xs text-brand-surface hover:bg-brand-blue-light">{saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}{saving ? "Saving" : saved ? "Saved" : "Save changes"}</Button></div>
    </div>
  </div>;
}
