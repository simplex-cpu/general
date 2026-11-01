import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Check, Globe, Image, Loader2, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND_BRIEF_FIELDS } from "@/lib/brands";
import VisualStylePanel from "./VisualStylePanel";
import { SectionTabs } from "./SectionTabs";

type Social = { user: string; status: string };
type AccountView = { recordId?: string; zernioId: string; platform: string; handle: string; followers: number | null; status: "Active" | "Signed out"; via: string };
const labels = ["Brand name", "My brand in a nutshell", "My niche / industry", "My target audience", "Pain points", "Topics", "My competitive edge", "My tone of voice", "My funnel for monetization"];
const platforms = ["Instagram", "Tiktok", "Youtube", "Facebook", "Linkedin"];
const platformLabel = (key: string) => ({ Tiktok: "TikTok", Youtube: "YouTube", Linkedin: "LinkedIn" })[key] || key;
const fieldClass = "w-full rounded-md border border-brand-line bg-brand-surface px-3 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-accent";
const actionClass = "h-10 gap-2 rounded-md bg-brand-accent px-4 text-xs text-brand-surface hover:bg-brand-blue-light";

const autoSize = (el: HTMLTextAreaElement | null) => { if (!el) return; el.style.height = "auto"; el.style.height = `${el.scrollHeight + 2}px`; };
export function BriefMode({ accessCode, brandId, onBack, onChanged, onDirtyChange, initialSubTab = "brief" }: {
  accessCode: string; brandId?: string; onBack?: () => void; onChanged?: () => void; onDirtyChange?: (dirty: boolean) => void;
  initialSubTab?: "brief" | "visual" | "socials";
}) {
  const [subTab, setSubTab] = useState(initialSubTab);
  const [values, setValues] = useState<Record<string, string>>({});
  const [socials, setSocials] = useState<Record<string, Social>>({});
  const [logo, setLogo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [logoBusy, setLogoBusy] = useState(false);
  const [connecting, setConnecting] = useState("");
  const [accounts, setAccounts] = useState<AccountView[]>([]);
  const [waiting, setWaiting] = useState("");
  const [pollUntil, setPollUntil] = useState(0);
  const [available, setAvailable] = useState(true);
  const input = useRef<HTMLInputElement>(null);
  const suffix = brandId ? `?brandId=${encodeURIComponent(brandId)}` : "";
  const notify = useRef(onChanged); notify.current = onChanged;
  const dirtyNotify = useRef(onDirtyChange); dirtyNotify.current = onDirtyChange;
  useEffect(() => { dirtyNotify.current?.(dirty); }, [dirty]);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); } };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError("");
    fetch(`/api/my-brief${suffix}`, { headers: { "x-access-code": accessCode } }).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Couldn't load this brand");
      if (cancelled) return;
      setAvailable(!!data.brief);
      setValues(data.brief?.fields || {}); setSocials(data.brief?.socials || {}); setLogo(data.brief?.logo || "");
    }).catch((e) => { if (!cancelled) setError(e.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [accessCode, suffix]);
  useEffect(() => {
    if (subTab !== "socials") return;
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/social-connect${suffix}`, { headers: { "x-access-code": accessCode } });
        const data = await r.json();
        if (cancelled || !r.ok) return;
        const next: AccountView[] = data.accounts || [];
        setAccounts(next);
        if (waiting && next.some((a) => a.platform === waiting && a.status === "Active")) { setWaiting(""); setPollUntil(0); notify.current?.(); }
      } catch { /* Keep showing the last known accounts. */ }
    };
    void load();
    const polling = waiting && pollUntil > Date.now();
    const timer = setInterval(() => {
      if (waiting && Date.now() > pollUntil) { setWaiting(""); setPollUntil(0); setError("We didn't see the new account yet. If you finished signing in, try again in a minute."); return; }
      void load();
    }, polling ? 4000 : 30000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [accessCode, suffix, subTab, waiting, pollUntil]);
  const patch = async (payload: Record<string, unknown>) => {
    const r = await fetch("/api/my-brief", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessCode, brandId, ...payload }) });
    const data = await r.json(); if (!r.ok) throw new Error(data.error || "Couldn't save this brand");
    notify.current?.(); return data;
  };
  const set = (key: string, value: string) => { setValues((prev) => ({ ...prev, [key]: value })); setDirty(true); setSaved(false); };
  const save = async () => {
    if (saving) return; setSaving(true); setError("");
    try { await patch({ fields: values, socials: Object.fromEntries(Object.entries(socials).map(([key, value]) => [key, { user: value.user }])) }); setDirty(false); setSaved(true); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't save"); } finally { setSaving(false); }
  };
  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 4 * 1024 * 1024) { setError("Choose an image smaller than 4 MB."); return; }
    setLogoBusy(true); setError("");
    try {
      const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] || ""); reader.onerror = reject; reader.readAsDataURL(file); });
      const data = await patch({ logoBase64: base64, logoFilename: file.name, logoContentType: file.type }); setLogo(data.brief?.logo || "");
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't upload logo"); } finally { setLogoBusy(false); if (input.current) input.current.value = ""; }
  };
  const account = (key: string) => accounts.find((a) => a.platform === key && a.status === "Active") || accounts.find((a) => a.platform === key);
  const status = (key: string) => { const a = account(key); return a ? (a.status === "Active" ? "Connected" : "Signed out") : "Not connected"; };
  const connect = async (key: string, opts: { facebook?: boolean; reconnectId?: string } = {}) => {
    if (connecting) return;
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    // Open the tab on the click itself so pop-up blockers allow it; phones sign in in the same window.
    const windowRef = mobile ? null : window.open("about:blank", "_blank");
    setConnecting(key); setError("");
    try {
      const r = await fetch("/api/social-connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessCode, brandId, action: "link", platform: key, ...opts }) });
      const data = await r.json(); if (!r.ok) throw new Error(data.error || "Couldn't connect this account");
      const target = new URL(data.authUrl); if (target.protocol !== "https:") throw new Error("Invalid connection link");
      if (mobile) { window.location.href = target.href; return; }
      if (windowRef) windowRef.location.href = target.href; else { setError("Please allow pop-ups to connect this account."); return; }
      setWaiting(key); setPollUntil(Date.now() + 4 * 60 * 1000);
    } catch (e) { windowRef?.close(); setError(e instanceof Error ? e.message : "Connection failed"); } finally { setConnecting(""); }
  };
  const remove = async (key: string) => {
    const a = account(key); if (!a || connecting) return;
    if (!window.confirm(`Remove ${platformLabel(key)} from this brand?`)) return;
    setConnecting(key); setError("");
    try {
      const r = await fetch("/api/social-connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessCode, brandId, action: "disconnect", zernioId: a.zernioId }) });
      const data = await r.json(); if (!r.ok) throw new Error(data.error || "Couldn't remove this account");
      setAccounts(data.accounts || []); notify.current?.();
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't remove"); } finally { setConnecting(""); }
  };
  return <div className="flex min-h-0 flex-1 flex-col bg-social-feed text-brand-ink md:h-full">
    <header className="flex min-h-16 shrink-0 items-center gap-3 bg-social-feed px-5 py-3 sm:px-8">
      {onBack && <Button variant="ghost" size="icon" aria-label="Back to My Brand" onClick={onBack} className="shrink-0 text-brand-ink-mid"><ArrowLeft size={18} /></Button>}
      {logo && <img src={logo} alt="" className="size-9 shrink-0 rounded-md bg-brand-surface object-contain p-1" />}
      <h1 className="min-w-0 flex-1 break-words text-base font-semibold">{values["Brand Name"] || "Brand details"}</h1>
      {subTab !== "visual" && <Button onClick={save} disabled={saving || !dirty} className={`${actionClass} brand-slim-action h-8`}>{saving ? <Loader2 className="animate-spin" size={16} /> : saved ? <Check size={16} /> : <Save size={16} />}{saving ? "Saving" : saved ? "Saved" : "Save"}</Button>}
    </header>
    <div className="shrink-0 bg-social-feed px-3 py-2 sm:px-5"><SectionTabs ariaLabel="Brand sections" items={[{ id: "brief", label: "Brief", icon: BookOpen }, { id: "visual", label: "Visual Style", icon: Image }, { id: "socials", label: "Connected Accounts", icon: Globe }]} active={subTab} onChange={(id) => setSubTab(id as "brief" | "visual" | "socials")} /></div>
    {error && <p role="alert" className="mx-5 mt-4 text-sm text-destructive">{error}</p>}
    {loading ? <p className="flex items-center gap-2 p-6 text-sm text-brand-ink-soft"><Loader2 size={16} className="animate-spin" />Loading brand…</p> : !available ? <p className="p-6 text-sm text-brand-ink-soft">This brand is unavailable.</p> : <div role="tabpanel" aria-label={subTab === "brief" ? "Brief" : subTab === "visual" ? "Visual Style" : "Connected Accounts"} className={subTab === "visual" ? "min-h-0 flex-1 bg-social-feed overflow-y-auto lg:overflow-hidden" : "w-full min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-5"}>
      {subTab === "brief" ? <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div><label className="mb-3 block text-xs font-medium text-brand-ink-mid">Brand logo</label><div className="relative grid aspect-[4/3] place-items-center rounded-lg border border-brand-line bg-brand-surface">
          {logo ? <img src={logo} alt="Brand logo" className="max-h-32 max-w-[80%] object-contain" /> : <Image size={32} className="text-brand-ink-grey" />}
          {logo && <Button variant="ghost" size="icon" aria-label="Remove logo" disabled={logoBusy} className="absolute right-1 top-1 text-brand-ink-soft" onClick={async () => { setLogoBusy(true); try { const data = await patch({ removeLogo: true }); setLogo(data.brief?.logo || ""); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't remove logo"); } finally { setLogoBusy(false); } }}><X size={15} /></Button>}
        </div><Button variant="outline" disabled={logoBusy} onClick={() => input.current?.click()} className="mt-3 h-10 w-full gap-2 border-brand-line bg-brand-surface text-xs">{logoBusy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}Upload logo</Button><input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
          <div className="mt-5 grid grid-cols-1 gap-3">{BRAND_BRIEF_FIELDS.map((key, index) => (index === 0 || index === 2) ? <label key={key} className="min-w-0"><span className="mb-2 block text-xs font-medium text-brand-ink-mid">{labels[index]}</span><input aria-label={labels[index]} className={fieldClass} value={values[key] || ""} onChange={(e) => set(key, e.target.value)} /></label> : null)}</div>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-5">{BRAND_BRIEF_FIELDS.map((key, index) => (index !== 0 && index !== 2) ? <label key={key} className="min-w-0"><span className="mb-2 block text-xs font-medium text-brand-ink-mid">{labels[index]}</span><textarea aria-label={labels[index]} rows={2} ref={autoSize} onInput={(e) => autoSize(e.currentTarget)} className={`${fieldClass} resize-none overflow-hidden [field-sizing:content]`} value={values[key] || ""} onChange={(e) => set(key, e.target.value)} /></label> : null)}</div>
      </div> : subTab === "visual" ? <VisualStylePanel values={values} set={set} onSave={save} saving={saving} saved={saved} /> : <>
        <div className="grid gap-4 sm:grid-cols-2">{platforms.map((key) => { const a = account(key); const st = status(key); const busy = connecting === key || waiting === key; return <section key={key} className="rounded-lg border border-brand-line bg-brand-surface p-4">
          <div className="flex items-start justify-between gap-2"><h2 className="text-sm font-semibold">{platformLabel(key)}</h2><span className={`text-[11px] ${st === "Connected" ? "text-progress-high" : st === "Signed out" ? "text-destructive" : "text-brand-ink-soft"}`}>{waiting === key ? "Waiting…" : st}</span></div>
          {a ? <p className="mt-4 text-sm">@{a.handle || "account"}{a.followers != null && <span className="text-brand-ink-soft"> · {a.followers.toLocaleString()} followers</span>}</p>
            : <input aria-label={`${platformLabel(key)} handle`} placeholder="@yourbrand" className={`${fieldClass} mt-4`} value={socials[key]?.user || ""} onChange={(e) => { setSocials((prev) => ({ ...prev, [key]: { user: e.target.value, status: prev[key]?.status || "To Connect" } })); setDirty(true); setSaved(false); }} />}
          <div className="mt-4 flex gap-2">
            {a ? <>
              <Button className={`${actionClass} flex-1`} disabled={!!connecting} onClick={() => void connect(key, { reconnectId: a.zernioId, facebook: a.via === "Facebook" })}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}{st === "Signed out" ? "Sign in" : "Reconnect"}</Button>
              <Button variant="outline" className="h-10 border-brand-line bg-brand-surface text-xs text-brand-ink hover:bg-brand-wash" disabled={!!connecting} onClick={() => void remove(key)}>Remove</Button>
            </> : key === "Instagram" ? <>
              <Button className={`${actionClass} flex-1`} disabled={!!connecting} onClick={() => void connect(key, { facebook: true })}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}Via Facebook</Button>
              <Button variant="outline" className="h-10 flex-1 border-brand-line bg-brand-surface text-xs text-brand-ink hover:bg-brand-wash" disabled={!!connecting} onClick={() => void connect(key)}>Via Instagram</Button>
            </> : <Button className={`${actionClass} w-full`} disabled={!!connecting} onClick={() => void connect(key)}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}Connect</Button>}
          </div>
          {key === "Instagram" && !a && <p className="mt-2 text-[11px] text-brand-ink-soft">Facebook unlocks music.</p>}
        </section>; })}</div>
      </>}
    </div>}
  </div>;
}
