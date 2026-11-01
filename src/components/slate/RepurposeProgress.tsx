import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STEPS = ["Reading the post", "Applying your brand", "Writing in the new format", "Writing captions", "Saving to your chat"];

/** Replaces the repurpose window while the script is written; eases to 90% until done. */
export function RepurposeProgress({ error, onRetry, onBack }: { error?: string; onRetry?: () => void; onBack?: () => void }) {
  const [pct, setPct] = useState(4);
  useEffect(() => {
    if (error) return;
    const t = setInterval(() => setPct((p) => (p >= 90 ? 90 : p + Math.max(0.6, (90 - p) / 28))), 500);
    return () => clearInterval(t);
  }, [error]);
  if (error) return <div className="space-y-3 py-2">
    <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">{error}</p>
    <div className="flex justify-between gap-2">
      {onBack && <Button variant="outline" onClick={onBack} className="border-brand-line bg-brand-surface text-brand-ink hover:bg-brand-wash hover:text-brand-ink">Back</Button>}
      {onRetry && <Button onClick={onRetry} className="bg-brand-accent text-primary-foreground hover:bg-brand-accent/90">Try again</Button>}
    </div>
  </div>;
  const step = Math.min(STEPS.length - 1, Math.floor((pct / 90) * STEPS.length));
  return <div className="space-y-3 py-4" role="status" aria-live="polite">
    <div className="flex items-center justify-between"><p className="text-[14px] font-semibold text-brand-ink">Writing your script</p><span className="text-[12px] tabular-nums text-brand-ink-soft">{Math.round(pct)}%</span></div>
    <div className="h-2 overflow-hidden rounded-full bg-brand-line"><div className="h-full rounded-full bg-milestone-green transition-[width] duration-500" style={{ width: `${pct}%` }} /></div>
    <p className="text-[12px] text-brand-ink-mid">{STEPS[step]}…</p>
  </div>;
}
