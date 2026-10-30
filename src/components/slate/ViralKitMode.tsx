import { ChevronRight, ChartNoAxesCombined, Images, Lightbulb, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VIRAL_KIT_TOOLS, viralKitDestination } from "@/lib/slate/viralKit";
import { SectionHeader } from "./SectionHeader";

const icons = { strategy: ChartNoAxesCombined, inspo: Lightbulb, thumbnails: Images, clipper: Scissors };

export function ViralKitMode({ onOpen }: { onOpen: (mode: "analyze" | "inspo" | "clipper") => void }) {
  return (
    <section className="min-h-full bg-social-feed text-brand-ink">
      <SectionHeader title="Viral Kit" />
      <div className="grid w-full max-w-4xl gap-3 px-5 pb-8 pt-4 sm:grid-cols-2 sm:px-8">
        {VIRAL_KIT_TOOLS.map((tool) => {
          const Icon = icons[tool.id];
          return (
            <Button key={tool.id} type="button" variant="ghost" disabled={!tool.available}
              onClick={() => { const to = viralKitDestination(tool.id); if (to) onOpen(to); }}
              className="group flex h-auto min-h-24 w-full items-center justify-between gap-3 whitespace-normal rounded-md border border-brand-line bg-brand-surface px-5 py-4 text-left shadow-none transition-colors hover:border-brand-accent/30 hover:bg-brand-accent/5 disabled:opacity-100">
              <span className="flex min-w-0 items-center gap-3">
                <Icon size={21} strokeWidth={1.7} className={`shrink-0 ${tool.available ? "text-brand-accent" : "text-brand-ink-grey"}`} />
                <span className={`min-w-0 text-sm font-medium tracking-normal ${tool.available ? "text-brand-ink" : "text-brand-ink-soft"}`}>{tool.label}</span>
              </span>
              {tool.available ? <ChevronRight size={18} className="shrink-0 text-brand-accent" /> : <span className="shrink-0 text-[11px] font-normal text-brand-ink-soft">Coming soon</span>}
            </Button>
          );
        })}
      </div>
    </section>
  );
}