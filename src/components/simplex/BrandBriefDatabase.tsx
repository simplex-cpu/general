import { useEffect, useRef, useState } from "react";
import { Paperclip, Trash2, FileText, RefreshCw, Plus, Pencil, Check, X } from "lucide-react";

import { getStoredAccessCode } from "@/lib/simplex/accessCode";


type Brand = { id: string; name: string; status: string };
type Att = { id?: string; url: string; filename: string };

export function BrandBriefDatabase() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [briefs, setBriefs] = useState<Record<string, Att[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState<{ brandId: string; attachmentId: string; value: string } | null>(null);
  const [viewing, setViewing] = useState<{ filename: string; url: string; kind: "pdf" | "md" } | null>(null);
  const [mdContent, setMdContent] = useState<string>("");
  const [mdLoading, setMdLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingBrand = useRef<string | null>(null);

  const ALLOWED_EXT = /\.(pdf|md|markdown)$/i;

  function fileUrl(brandId: string, attId: string) {
    return `/api/brief-file?b=${encodeURIComponent(brandId)}&f=${encodeURIComponent(attId)}`;
  }

  async function openAttachment(brandId: string, a: Att) {
    if (!a.id) return;
    const kind: "pdf" | "md" = /\.(md|markdown)$/i.test(a.filename) ? "md" : "pdf";
    const apiUrl = fileUrl(brandId, a.id);
    // Fetch through same-origin API, then render from a blob: URL so browser
    // extensions / ad blockers can't intercept the iframe request.
    setViewing({ filename: a.filename, url: "", kind });
    setMdLoading(kind === "md");
    setMdContent("");
    try {
      const r = await fetch(apiUrl, { headers: { "x-access-code": getStoredAccessCode() || "" } });
      if (!r.ok) throw new Error(String(r.status));
      if (kind === "md") {
        const t = await r.text();
        setMdContent(t);
      } else {
        const blob = await r.blob();
        const blobUrl = URL.createObjectURL(
          blob.type ? blob : new Blob([blob], { type: "application/pdf" })
        );
        setViewing({ filename: a.filename, url: blobUrl, kind });
      }
    } catch {
      if (kind === "md") setMdContent("Failed to load file.");
    } finally {
      setMdLoading(false);
    }
  }


  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const code = getStoredAccessCode();
      const r = await fetch(`/api/list-brands`, { headers: { "x-access-code": code } });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to load brands");
      const list = (data.brands || []) as Brand[];
      setBrands(list);
      const entries = await Promise.all(
        list.map(async (b) => {
          try {
            const rr = await fetch(`/api/brand-brief?brandId=${encodeURIComponent(b.id)}`, { headers: { "x-access-code": code } });
            const d = await rr.json();
            return [b.id, (d.attachments as Att[]) || []] as const;
          } catch {
            return [b.id, [] as Att[]] as const;
          }
        })
      );
      const map: Record<string, Att[]> = {};
      for (const [k, v] of entries) map[k] = v;
      setBriefs(map);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  function pickFileFor(brandId: string) {
    pendingBrand.current = brandId;
    const inp = fileRef.current;
    if (inp) { inp.value = ""; inp.click(); }
  }

  async function onFileChosen(file: File) {
    const brandId = pendingBrand.current;
    pendingBrand.current = null;
    if (!brandId) return;
    if (!ALLOWED_EXT.test(file.name)) {
      setError("Only PDF or Markdown (.md) files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB (Airtable limit).");
      return;
    }

    setBusy((b) => ({ ...b, [brandId]: "Uploading…" }));
    setError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string).split(",")[1]);
        r.onerror = () => reject(new Error("File read failed"));
        r.readAsDataURL(file);
      });
      const r = await fetch("/api/brand-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, base64, filename: file.name, contentType: file.type || "application/pdf", accessCode: getStoredAccessCode() }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Upload failed");
      setBriefs((b) => ({ ...b, [brandId]: (data.attachments as Att[]) || [] }));
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setBusy((b) => { const { [brandId]: _drop, ...rest } = b; return rest; });
    }
  }

  async function removeAttachment(brandId: string, attachmentId: string | undefined, filename: string) {
    if (!attachmentId) return;
    if (!confirm(`Remove "${filename}" from this client's brand briefs?`)) return;
    setBusy((b) => ({ ...b, [brandId]: "Removing…" }));
    setError(null);
    try {
      const r = await fetch("/api/brand-brief", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, attachmentId, accessCode: getStoredAccessCode() }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Remove failed");
      setBriefs((b) => ({ ...b, [brandId]: (data.attachments as Att[]) || [] }));
    } catch (e: any) {
      setError(e?.message || "Remove failed");
    } finally {
      setBusy((b) => { const { [brandId]: _drop, ...rest } = b; return rest; });
    }
  }

  async function saveRename() {
    if (!renaming) return;
    const { brandId, attachmentId, value } = renaming;
    const name = value.trim();
    if (!name) return;
    if (!ALLOWED_EXT.test(name)) {
      setError("Filename must end in .pdf or .md");
      return;
    }
    setBusy((b) => ({ ...b, [brandId]: "Renaming…" }));
    setError(null);
    try {
      const r = await fetch("/api/brand-brief", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, attachmentId, filename: name, accessCode: getStoredAccessCode() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Rename failed");
      setBriefs((b) => ({ ...b, [brandId]: (data.attachments as Att[]) || [] }));
      setRenaming(null);
    } catch (e: any) {
      setError(e?.message || "Rename failed");
    } finally {
      setBusy((b) => { const { [brandId]: _drop, ...rest } = b; return rest; });
    }
  }

  const filtered = brands.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="col-span-8 p-6 flex flex-col h-[640px] min-h-0">
      <div className="pb-5 border-b border-[#F6F6F7]/10 mb-5 shrink-0">

        <p className="text-[13px] text-[#4F6BFF] mb-2">Strategist tools · Airtable · Client Admin</p>
        <h2 className="text-2xl text-[#F6F6F7] tracking-tight" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800 }}>
          Brand Brief Database
        </h2>
        <p className="text-[13px] text-[#F6F6F7]/60 font-light mt-2 max-w-xl">
          Attach one or more brand briefs per active or onboarding client. All files are stored in the "Brand brief" field of the
          Client Admin record and are auto-loaded together when an admin scripts for that brand.
        </p>
      </div>

      <div className="flex items-center justify-between mb-4 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search client…"
          className="flex-1 bg-[#0c0d1a] border border-[#F6F6F7]/10 rounded-lg px-3 py-2 text-[13px] text-[#F6F6F7] placeholder:text-[#F6F6F7]/30 focus:outline-none focus:border-[#4F6BFF]/40"
        />
        <button
          onClick={loadAll}
          className="inline-flex items-center gap-1.5 border border-[#F6F6F7]/15 hover:border-[#4F6BFF]/40 text-[#F6F6F7]/70 hover:text-[#4F6BFF] text-[11px] rounded-lg px-3 py-2 transition"
        >
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-[#9b2c2c]/10 border border-[#9b2c2c]/30 text-[12px] text-[#ff9a9a]">
          {error}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf,.md,text/markdown"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileChosen(f);
        }}
      />

      <div className="flex-1 min-h-0 border border-[#F6F6F7]/10 rounded-xl overflow-y-auto">
        {loading ? (
          <div className="px-4 py-6 text-[12px] text-[#F6F6F7]/50">Loading brands…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6 text-[12px] text-[#F6F6F7]/50">No clients match.</div>
        ) : (
          <ul className="divide-y divide-[#F6F6F7]/10">
            {filtered.map((b) => {
              const atts = briefs[b.id] || [];
              const busyLabel = busy[b.id];
              return (
                <li key={b.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] text-[#F6F6F7]" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>
                        {b.name}
                      </div>
                      <div className="text-[11px] text-[#F6F6F7]/45 mt-0.5 uppercase tracking-wider">
                        {b.status || "—"}
                      </div>
                      {atts.length === 0 ? (
                        <div className="mt-2 text-[11px] text-[#F6F6F7]/35">No briefs on file</div>
                      ) : (
                        <ul className="mt-2 space-y-1">
                          {atts.map((a, i) => {
                            const isRenaming = renaming?.brandId === b.id && renaming.attachmentId === a.id;
                            
                            return (
                              <li key={a.id || i} className="flex items-center justify-between gap-3 text-[11px]">
                                {isRenaming ? (
                                  <>
                                    <input
                                      autoFocus
                                      value={renaming!.value}
                                      onChange={(e) => setRenaming({ ...renaming!, value: e.target.value })}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") saveRename();
                                        if (e.key === "Escape") setRenaming(null);
                                      }}
                                      className="flex-1 min-w-0 bg-[#0c0d1a] border border-[#4F6BFF]/40 rounded px-2 py-1 text-[11px] text-[#F6F6F7] focus:outline-none"
                                    />
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={saveRename}
                                        disabled={!!busyLabel}
                                        className="text-[#4F6BFF] hover:text-[#6C7BFF] disabled:opacity-30"
                                        title="Save"
                                      >
                                        <Check size={12} />
                                      </button>
                                      <button
                                        onClick={() => setRenaming(null)}
                                        className="text-[#F6F6F7]/40 hover:text-[#F6F6F7]/80"
                                        title="Cancel"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => openAttachment(b.id, a)}
                                      className="inline-flex items-center gap-1.5 text-[#4F6BFF] hover:text-[#6C7BFF] hover:underline min-w-0 text-left"
                                      title={`Open ${a.filename}`}
                                    >
                                      <FileText size={11} className="shrink-0" />
                                      <span className="truncate">{a.filename}</span>
                                    </button>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        onClick={() => a.id && setRenaming({ brandId: b.id, attachmentId: a.id, value: a.filename })}
                                        disabled={!a.id || !!busyLabel}
                                        className="text-[#F6F6F7]/40 hover:text-[#4F6BFF] disabled:opacity-30 transition"
                                        title="Rename"
                                      >
                                        <Pencil size={11} />
                                      </button>
                                      <button
                                        onClick={() => removeAttachment(b.id, a.id, a.filename)}
                                        disabled={!a.id || !!busyLabel}
                                        className="inline-flex items-center gap-1 text-[#F6F6F7]/40 hover:text-[#ff9a9a] disabled:opacity-30 transition"
                                        title="Remove this file"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </li>
                            );
                          })}
                        </ul>

                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {busyLabel ? (
                        <span className="text-[11px] text-[#F6F6F7]/55">{busyLabel}</span>
                      ) : (
                        <button
                          onClick={() => pickFileFor(b.id)}
                          className="inline-flex items-center gap-1.5 bg-[#4F6BFF] hover:bg-[#6C7BFF] text-white text-[11px] rounded-lg px-3 py-1.5 transition"
                        >
                          {atts.length === 0 ? <Paperclip size={11} /> : <Plus size={11} />}
                          {atts.length === 0 ? "Upload brief" : "Add file"}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {viewing && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-6"
          onClick={() => {
            if (viewing.url.startsWith("blob:")) URL.revokeObjectURL(viewing.url);
            setViewing(null);
          }}
        >
          <div
            className="bg-[#0c0d1a] border border-[#F6F6F7]/15 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#F6F6F7]/10 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={14} className="text-[#4F6BFF] shrink-0" />
                <span className="text-[13px] text-[#F6F6F7] truncate" title={viewing.filename}>
                  {viewing.filename}
                </span>
              </div>
              <button
                onClick={() => {
                  if (viewing.url.startsWith("blob:")) URL.revokeObjectURL(viewing.url);
                  setViewing(null);
                }}
                className="text-[#F6F6F7]/60 hover:text-[#F6F6F7] transition"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 min-h-0 bg-[#06070f]">
              {viewing.kind === "pdf" ? (
                viewing.url ? (
                  <iframe
                    src={viewing.url}
                    title={viewing.filename}
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="p-6 text-[12px] text-[#F6F6F7]/50">Loading…</div>
                )
              ) : mdLoading ? (
                <div className="p-6 text-[12px] text-[#F6F6F7]/50">Loading…</div>
              ) : (
                <pre className="p-6 text-[12px] text-[#F6F6F7]/85 whitespace-pre-wrap font-mono overflow-auto h-full">
                  {mdContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );

}
