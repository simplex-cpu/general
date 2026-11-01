import { Loader2 } from "lucide-react";

export function ScriptCardWriting({
  scriptNumber,
  totalScripts,
  topic,
  variationLabel,
  rewriting = false,
}: {
  scriptNumber: number;
  totalScripts: number;
  topic: string;
  variationLabel?: string;
  rewriting?: boolean;
}) {
  const idx = String(scriptNumber);
  const total = String(totalScripts);
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-brand-surface border border-brand-line rounded-lg overflow-hidden w-full min-w-0 h-full flex flex-col"
    >
      <div className="bg-brand-wash px-4 py-4 border-b border-brand-line flex items-start justify-between gap-3">
        <div className="min-w-0">
          {variationLabel && (
            <p className="mb-2 text-sm font-semibold text-brand-accent">{variationLabel}</p>
          )}
          <p
            className="text-[10px] uppercase tracking-[.16em] text-[#2530CC]"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
          >
            Script · {idx} of {total}
          </p>
          <h3
            className="text-base text-[#1A1A1D] tracking-tight mt-1"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
          >
            {topic}
          </h3>
        </div>
        <div className="inline-flex shrink-0 items-center gap-2 text-brand-accent text-[12px]">
          <Loader2 className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" />
          {rewriting ? "Rewriting" : "Writing"}
        </div>
      </div>
      <div className="p-6 space-y-3 flex-1">
        <p className="text-sm text-brand-ink-mid">
          {rewriting ? "Rewriting this variation…" : "Writing your content…"}
        </p>
        <div className="h-1 bg-brand-line rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-brand-accent animate-pulse motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}
