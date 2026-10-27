import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  carouselSlidesFromPost,
  emptySlideFields,
  FIELD_LABELS,
  serializeCarouselCopy,
  slideFieldOrder,
  slideKind,
  type SlideFields,
} from "@/lib/slate/slideFields";

type Copy = { coverCopy?: string; slidesCopy?: string; ctaCopy?: string };

/** Carousel copy slide by slide; each slide folds closed, all start collapsed. */
export function CarouselCopyEditor({ value, onChange }: { value: Copy; onChange: (next: { coverCopy: string; slidesCopy: string; ctaCopy: string }) => void }) {
  const [slides, setSlides] = useState<SlideFields[]>(() => carouselSlidesFromPost(value));
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const commit = (next: SlideFields[]) => {
    setSlides(next);
    onChange(serializeCarouselCopy(next));
  };
  const setField = (index: number, key: keyof SlideFields, text: string) =>
    commit(slides.map((s, i) => (i === index ? { ...s, [key]: text } : s)));
  // New slides go just before the closing slide.
  const addSlide = () => commit([...slides.slice(0, -1), emptySlideFields(), slides[slides.length - 1]]);
  const removeSlide = (index: number) => commit(slides.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-[.18em] text-[#6A6A72]">Slides copy</label>
      {slides.map((slide, index) => {
        const kind = slideKind(index, slides.length);
        const name = kind === "cover" ? "Cover" : kind === "cta" ? "Closing" : `Slide ${index}`;
        const preview = slide.title.trim() || "Empty";
        return (
          <Collapsible key={index} open={!!open[index]} onOpenChange={(v) => setOpen((p) => ({ ...p, [index]: v }))} className="rounded-xl border border-brand-line bg-white">
            <div className="flex items-center gap-2 px-3 py-2">
              <CollapsibleTrigger asChild>
                <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  {open[index] ? <ChevronDown size={14} className="shrink-0 text-brand-ink-soft" /> : <ChevronRight size={14} className="shrink-0 text-brand-ink-soft" />}
                  <span className="shrink-0 text-xs font-semibold text-brand-ink">{name}</span>
                  {!open[index] && <span className="truncate text-xs text-brand-ink-soft">{preview}</span>}
                </button>
              </CollapsibleTrigger>
              {kind === "content" && slides.length > 3 && (
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${name}`} onClick={() => removeSlide(index)} className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 size={13} />
                </Button>
              )}
            </div>
            <CollapsibleContent className="space-y-2 px-3 pb-3">
              {slideFieldOrder(kind).map((key) => (
                <div key={key}>
                  <span className="text-[11px] font-medium text-brand-ink-soft">{FIELD_LABELS[kind][key]}</span>
                  <textarea
                    value={slide[key]}
                    rows={key === "body" ? 3 : 1}
                    onChange={(e) => setField(index, key, e.target.value)}
                    className="mt-0.5 w-full resize-y rounded-lg border border-[#E5E5E8] bg-white px-3 py-2 text-sm outline-none focus:border-[#7B83FF]"
                  />
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={addSlide} className="border-brand-line bg-white text-brand-ink hover:bg-[#F4F4F6] hover:text-brand-ink"><Plus size={13} /> Add slide</Button>
    </div>
  );
}
