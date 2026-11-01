import { useEffect, useState } from "react";
import { ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Angle } from "@/lib/slate/brandContext";
import { RepurposeProgress } from "./RepurposeProgress";

type Suggest = { angle: string; belief: string; fit: string; storyPlan?: Angle["storyPlan"] };
export type AngleRequest = { source: "viral" | "own"; id?: string; brandId?: string; format: string; sourceText?: string };

/** Step 2 of viral repurposing: confirm the topic angle before writing. */
export function RepurposeAnglePicker({ accessCode, request, busy, error, onBack, onConfirm }: { accessCode: string; request: AngleRequest; busy: boolean; error?: string; onBack: () => void; onConfirm: (a: Angle) => void }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [angles, setAngles] = useState<Suggest[]>([]);
  const [pick, setPick] = useState<Angle | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true); setLoadError(""); setPick(null); setAngles([]); setOpen(null);
    fetch("/api/repurpose-angles", { method: "POST", headers: { "Content-Type": "application/json", "x-access-code": accessCode }, body: JSON.stringify(request) })
      .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j?.error || "Angles couldn't be suggested."); return j; })
      .then((j) => live && setAngles(j.angles || []))
      .catch((e) => live && setLoadError(e.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [nonce]); // eslint-disable-line react-hooks/exhaustive-deps
  const finalAngle = pick?.kind === "custom" ? { kind: "custom" as const, text: custom } : pick;
  if (busy || error) return <RepurposeProgress error={error} onBack={onBack} onRetry={() => finalAngle && onConfirm(finalAngle)} />;
  return <div className="space-y-4">
    <div className="max-h-[50vh] space-y-6 overflow-y-auto pr-1">
      <div className="space-y-2">
        <div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[.14em] text-brand-ink">Suggested angles</p><button type="button" disabled={loading} onClick={() => setNonce(nonce + 1)} className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-accent disabled:opacity-50"><RefreshCw size={11} />Regenerate</button></div>
        {loading ? <p className="flex items-center gap-2 py-4 text-[12px] text-brand-ink-soft"><Loader2 size={14} className="animate-spin" />Finding angles for your audience…</p>
          : loadError ? <p className="text-[12px] text-destructive">{loadError}</p>
          : angles.map((a) => {
            const selected = pick?.kind === "suggested" && pick.text === a.angle;
            const expanded = open === a.angle;
            return <div key={a.angle} className={`rounded-lg border ${selected ? "border-brand-accent bg-brand-wash" : "border-brand-line bg-brand-surface"}`}>
              <div className="flex items-start gap-2 p-3">
                <button type="button" onClick={() => setPick({ kind: "suggested", text: a.angle, storyPlan: a.storyPlan })} className="min-w-0 flex-1 text-left text-[13px] font-normal text-brand-ink">{a.angle}</button>
                {(a.belief || a.fit) && <button type="button" aria-label={expanded ? "Hide details" : "Show details"} aria-expanded={expanded} onClick={() => setOpen(expanded ? null : a.angle)} className="shrink-0 rounded p-0.5 text-brand-ink-soft hover:bg-brand-wash"><ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} /></button>}
              </div>
              {expanded && <div className="space-y-1 px-3 pb-3">{a.belief && <p className="text-[11px] text-brand-ink-mid">Challenges: {a.belief}</p>}{a.fit && <p className="text-[11px] text-brand-ink-soft">Why you: {a.fit}</p>}</div>}
            </div>;
          })}
      </div>
      <div className="space-y-2"><p className="text-[11px] font-semibold uppercase tracking-[.14em] text-brand-ink">Write my own</p><textarea value={custom} maxLength={600} onFocus={() => setPick({ kind: "custom", text: "" })} onChange={(e) => { setCustom(e.target.value); setPick({ kind: "custom", text: "" }); }} rows={2} placeholder="The angle you want this post to take" className="w-full rounded-md border border-brand-line bg-brand-surface p-2 text-[12px] text-brand-ink" /></div>
    </div>
    <div className="flex justify-between gap-2">
      <Button variant="outline" onClick={onBack} className="border-brand-line bg-brand-surface text-brand-ink hover:bg-brand-wash hover:text-brand-ink">Back</Button>
      <Button disabled={!finalAngle || (finalAngle.kind === "custom" && !custom.trim())} onClick={() => finalAngle && onConfirm(finalAngle)} className="bg-brand-accent text-primary-foreground hover:bg-brand-accent/90">Write script</Button>
    </div>
  </div>;
}
