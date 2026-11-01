import { SectionHeader } from "./SectionHeader";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Image, Loader2, Plus, Upload, Globe } from "lucide-react";
import { siInstagram, siTiktok, siYoutube, siFacebook } from "simple-icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { listMyBrands, addMyBrand } from "@/lib/brands.functions";
import { createSingleFlight, completionTone } from "@/lib/brands";
import { BriefMode } from "./BriefMode";

const paths: Record<string, string> = { Instagram: siInstagram.path, Tiktok: siTiktok.path, Youtube: siYoutube.path, Facebook: siFacebook.path };
const toneClass = { low: "bg-progress-low", mid: "bg-progress-mid", high: "bg-progress-high" } as const;
const compact = (n: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
const action = "h-10 gap-2 rounded-md bg-brand-accent px-4 text-xs text-brand-surface hover:bg-brand-blue-light";
export function MyBrandsMode({ accessCode, onDirtyChange }: { accessCode: string; onDirtyChange?: (dirty: boolean) => void }) {
  const list = useServerFn(listMyBrands); const add = useServerFn(addMyBrand); const qc = useQueryClient();
  const brands = useQuery({ queryKey: ["my-brands", accessCode], queryFn: () => list({ data: { accessCode } }), staleTime: 30000 });
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [file, setFile] = useState<File>();
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const dirty = useRef(false); const lock = useRef(createSingleFlight());
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["my-brands", accessCode] }); };
  const back = () => { if (dirty.current && !window.confirm("Discard your unsaved brand changes?")) return; dirty.current = false; onDirtyChange?.(false); setSelected(null); refresh(); };
  if (selected) return <div className="flex min-h-0 flex-1 flex-col md:h-full"><p role="status" className={notice ? "bg-brand-wash px-5 pt-3 text-xs text-brand-ink-soft" : "hidden"}>{notice}</p><BriefMode key={selected} accessCode={accessCode} brandId={selected} onBack={back} onChanged={refresh} onDirtyChange={(value) => { dirty.current = value; onDirtyChange?.(value); }} /></div>;
  return <div className="min-h-full bg-social-feed text-brand-ink md:h-full md:overflow-y-auto"><SectionHeader title="My Brand" actions={<Button className={`${action} brand-slim-action h-8`} onClick={() => { setOpen(true); setName(""); setFile(undefined); setError(""); }}><Plus size={16} />Add new brand</Button>} /><main className="px-5 pb-6 pt-3 sm:px-8">
    {notice && <p role="status" className="mb-4 text-sm text-brand-ink-soft">{notice}</p>}
    {brands.isPending ? <p className="flex items-center gap-2 py-12 text-sm text-brand-ink-soft"><Loader2 size={16} className="animate-spin" />Loading brands…</p> : brands.isError ? <div role="alert"><p className="mb-4 text-sm text-brand-ink-soft">{brands.error.message}</p><Button className={action} onClick={() => void brands.refetch()}>Try again<ArrowRight size={16} /></Button></div> : !brands.data?.length ? <div className="py-16 text-center"><Image className="mx-auto mb-4 text-brand-ink-grey" size={32} /><h2 className="mb-5 text-base font-medium">Your brands</h2><Button className={`${action} brand-slim-action h-8`} onClick={() => setOpen(true)}><Plus size={16} />Add new brand</Button></div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{brands.data.map((brand) => <Button key={brand.id} variant="ghost" aria-label={`Open ${brand.name}`} onClick={() => setSelected(brand.id)} className="h-auto w-full flex-col items-stretch gap-0 overflow-hidden whitespace-normal rounded-lg border border-brand-line bg-brand-surface p-0 text-left shadow-none hover:bg-brand-surface hover:border-brand-accent/50">
      <div className="grid aspect-[16/9] w-full place-items-center border-b border-brand-line bg-brand-wash">{brand.logo ? <img src={brand.logo} alt={`${brand.name} logo`} className="h-24 max-w-[70%] object-contain sm:h-28" /> : <Image size={36} className="text-brand-ink-grey" />}</div>
      <div className="w-full p-5"><h2 className="mb-4 break-words text-base font-semibold text-brand-ink">{brand.name}</h2>
      <div className="grid grid-cols-2 gap-x-5 gap-y-4 border-t border-brand-line pt-4 text-xs font-normal">
        <div className="min-w-0"><div className="mb-1.5 flex items-center justify-between text-[11px] text-brand-ink-soft"><span>Brief</span><span className="tabular-nums text-brand-ink">{brand.completion}%</span></div><div role="progressbar" aria-label={`${brand.name} brief completion`} aria-valuenow={brand.completion} aria-valuemin={0} aria-valuemax={100} className="h-1.5 w-full overflow-hidden rounded-full bg-brand-line"><div className={`h-full rounded-full ${toneClass[completionTone(brand.completion)]}`} style={{ width: `${brand.completion}%` }} /></div></div>
        <div className="min-w-0"><p className="mb-1 text-[11px] text-brand-ink-soft">Avg stats</p>{brand.stats?.posts ? <p className="flex flex-wrap gap-x-2 tabular-nums text-brand-ink"><span>{compact(brand.stats.views)} views</span><span>{compact(brand.stats.likes)} likes</span><span>{compact(brand.stats.comments)} comm.</span></p> : <p className="text-brand-ink-soft">No stats yet</p>}</div>
        <div className="min-w-0"><p className="mb-1 text-[11px] text-brand-ink-soft">Performance</p>{brand.stats?.status ? <p className={`flex items-center gap-1.5 ${brand.stats.status === "on-track" ? "text-progress-high" : "text-progress-mid"}`}><span aria-hidden="true" className={`size-1.5 rounded-full ${brand.stats.status === "on-track" ? "bg-progress-high" : "bg-progress-mid"}`} />{brand.stats.status === "on-track" ? "On track" : "Pay attention"}</p> : <p className="text-brand-ink-soft">—</p>}</div>
        <div className="min-w-0"><p className="mb-1 text-[11px] text-brand-ink-soft">Accounts</p><div className="flex min-h-4 items-center gap-2">{(["Instagram", "Tiktok", "Youtube", "Facebook"] as const).map((p) => { const on = brand.connected.includes(p); return <span key={p} title={`${p} ${on ? "connected" : "not connected"}`} aria-label={`${p} ${on ? "connected" : "not connected"}`} className={on ? "text-brand-ink" : "text-brand-ink-grey opacity-40"}><svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden="true"><path d={paths[p]} /></svg></span>; })}</div></div>
      </div></div>
    </Button>)}</div>}
  </main><Dialog open={open} onOpenChange={(value) => { if (!saving) setOpen(value); }}><DialogContent className="max-w-[calc(100vw-2rem)] rounded-lg border-brand-line bg-brand-surface text-brand-ink sm:max-w-md"><DialogTitle className="text-base tracking-normal">Add new brand</DialogTitle><DialogDescription className="sr-only">Enter a brand name and optional logo.</DialogDescription>
    <form className="space-y-5" onSubmit={async (event) => { event.preventDefault(); if (!name.trim() || !lock.current.acquire()) return; setSaving(true); setError("");
      try {
        const brand = await add({ data: { accessCode, name: name.trim() } });
        if (file) {
          try {
            const base64 = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result).split(",")[1] || ""); r.onerror = reject; r.readAsDataURL(file); });
            const r = await fetch("/api/my-brief", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessCode, brandId: brand.id, logoBase64: base64, logoFilename: file.name, logoContentType: file.type }) });
            if (!r.ok) throw new Error("Logo upload failed");
          } catch { setNotice("Brand created. The logo couldn't be uploaded; try again in Brief."); }
        }
        refresh(); setOpen(false); setSelected(brand.id);
      } catch (e) { setError(e instanceof Error ? e.message : "Couldn't add this brand"); } finally { setSaving(false); lock.current.release(); }
    }}>
      <label className="block"><span className="mb-2 block text-xs font-medium">Brand name</span><input autoFocus required maxLength={200} value={name} disabled={saving} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-md border border-brand-line bg-brand-surface px-3 text-sm outline-none focus:border-brand-accent" /></label>
      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-brand-line p-4 text-xs text-brand-ink-mid"><Upload size={18} /><span className="min-w-0 break-words">{file?.name || "Add logo (optional)"}</span><input type="file" accept="image/*" disabled={saving} className="sr-only" onChange={(e) => { const next = e.target.files?.[0]; if (next && (!next.type.startsWith("image/") || next.size > 4 * 1024 * 1024)) { setError("Choose an image smaller than 4 MB."); e.target.value = ""; return; } setFile(next); setError(""); }} /></label>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)} className="h-10 border-brand-line bg-brand-surface text-xs">Cancel</Button><Button type="submit" disabled={!name.trim() || saving} className={action}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}{saving ? "Creating" : "Create brand"}</Button></div>
    </form></DialogContent></Dialog></div>;
}
