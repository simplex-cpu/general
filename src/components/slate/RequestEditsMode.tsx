import { useCallback, useEffect, useRef, useState } from "react";
import { AttachBox } from "./post/AttachBox";
import {
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  FileVideo,
  FileText,
  Link2,
  Send,
} from "lucide-react";
import { uploadDirectToDrive } from "@/lib/driveDirectUpload";
import { LaneTabs } from "./DesignAndEditMode";
import { Dropdown } from "./EditYourselfMode";

type RequestType = "Edit" | "Design";
type RequestFormat = "Talking Video" | "BROLL" | "Graphic" | "Carousel";

type RequestItem = {
  id: string;
  createdTime: string;
  requestType: string;
  format: string;
  status: string;
  posts: number;
  footageLinks: string;
  editedUrl: string;
  footage: { id: string; url: string; filename: string }[];
  scripts: { id: string; url: string; filename: string }[];
};

function fmtDate(s: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function statusClasses(status: string) {
  const s = (status || "").toLowerCase();
  if (
    s.includes("edited") ||
    s.includes("designed") ||
    s.includes("done") ||
    s.includes("complete")
  )
    return "bg-[#DCFCE7] text-[#15803D]";
  if (s.includes("progress")) return "bg-[#FEF3C7] text-[#B45309]";
  return "bg-[#FEE2E2] text-[#B91C1C]";
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2">
      <p className="text-[13px] font-bold text-[#1A1A1D]">{children}</p>
      {hint && <p className="mt-1 text-[12px] text-[#6A6A72]">{hint}</p>}
    </div>
  );
}

type FileSlot = { file: File; progress: number; fileId?: string; error?: string };

function FileList({
  slots,
  onRemove,
  disabled,
}: {
  slots: FileSlot[];
  onRemove: (i: number) => void;
  disabled: boolean;
}) {
  if (!slots.length) return null;
  return (
    <ul className="mt-3 space-y-2">
      {slots.map((s, i) => (
        <li
          key={`${s.file.name}-${i}`}
          className="rounded-xl border border-[#E5E5E8] bg-[#FAFAFB] px-3 py-2.5"
        >
          <div className="flex items-center gap-3">
            <span className="text-[#7B83FF] shrink-0">
              {s.file.type.startsWith("video/") ? <FileVideo size={18} /> : <FileText size={18} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-[#1A1A1D]">{s.file.name}</p>
              <p className="text-[11px] text-[#6A6A72]">{humanSize(s.file.size)}</p>
            </div>
            {s.fileId ? (
              <CheckCircle2 size={16} className="text-[#4ADE80] shrink-0" />
            ) : s.error ? (
              <AlertCircle size={16} className="text-[#F87171] shrink-0" />
            ) : s.progress > 0 ? (
              <span className="text-[11px] text-[#6A6A72] shrink-0">{s.progress}%</span>
            ) : null}
            {!disabled && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-[#6A6A72] hover:text-[#1A1A1D]"
              >
                <X size={15} />
              </button>
            )}
          </div>
          {s.progress > 0 && !s.fileId && (
            <div className="mt-2 h-1 rounded-full bg-[#E5E5E8] overflow-hidden">
              <div
                className="h-full bg-[#7B83FF] transition-all"
                style={{ width: `${s.progress}%` }}
              />
            </div>
          )}
          {s.error && <p className="mt-1.5 text-[11px] text-[#C4322A]">{s.error}</p>}
        </li>
      ))}
    </ul>
  );
}

function DropZone({
  label,
  accept,
  multiple,
  slots,
  setSlots,
  disabled,
  icon,
}: {
  label: string;
  accept: string;
  multiple: boolean;
  slots: FileSlot[];
  setSlots: React.Dispatch<React.SetStateAction<FileSlot[]>>;
  disabled: boolean;
  icon: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const add = (files: FileList | null) => {
    if (!files || !files.length) return;
    const next = Array.from(files).map((file) => ({ file, progress: 0 }));
    setSlots((prev) => (multiple ? [...prev, ...next] : next.slice(0, 1)));
  };
  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!disabled) add(e.dataTransfer.files);
        }}
        className="w-full rounded-xl border border-dashed border-[#E5E5E8] bg-[#FAFAFB] px-5 py-7 text-center transition hover:border-[#4F6BFF]/60 hover:bg-[#F6F6F7] disabled:opacity-50"
      >
        <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#7B83FF]/15 text-[#7B83FF]">
          {icon}
        </span>
        <span className="block text-[13px] text-[#1A1A1D]">{label}</span>
        <span className="mt-1 block text-[11px] text-[#6A6A72]">
          {multiple
            ? "Drag and drop or click to browse — multiple files allowed"
            : "Drag and drop or click to browse"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          add(e.target.files);
          e.currentTarget.value = "";
        }}
      />
      <FileList
        slots={slots}
        disabled={disabled}
        onRemove={(i) => setSlots((prev) => prev.filter((_, idx) => idx !== i))}
      />
    </div>
  );
}

export function RequestEditsMode({
  accessCode = "",
  lanes,
  activeLane,
  onLaneChange,
}: {
  accessCode?: string;
  lanes: { value: "risevoice" | "myself"; label: string }[];
  activeLane: "risevoice" | "myself";
  onLaneChange: (lane: "risevoice" | "myself") => void;
}) {
  const [requestType, setRequestType] = useState<RequestType>("Edit");
  const [format, setFormat] = useState<RequestFormat>("Talking Video");
  const [posts, setPosts] = useState(1);
  const [footage, setFootage] = useState<FileSlot[]>([]);
  const [scripts, setScripts] = useState<FileSlot[]>([]);
  const [footageLink, setFootageLink] = useState("");
  const [useFootageLink, setUseFootageLink] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [items, setItems] = useState<RequestItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const loadList = useCallback(async () => {
    if (!accessCode) {
      setLoadingList(false);
      return;
    }
    try {
      const r = await fetch("/api/creative-requests", { headers: { "x-access-code": accessCode } });
      const data = await r.json().catch(() => ({}));
      if (r.ok && Array.isArray(data.items)) setItems(data.items);
    } catch {}
    setLoadingList(false);
  }, [accessCode]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // Keep the tab locked while an upload is in flight.
  useEffect(() => {
    if (!submitting) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [submitting]);

  async function uploadAll(
    slots: FileSlot[],
    setSlots: React.Dispatch<React.SetStateAction<FileSlot[]>>,
  ) {
    const out: { fileId: string; filename: string }[] = [];
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot.fileId) {
        out.push({ fileId: slot.fileId, filename: slot.file.name });
        continue;
      }
      const res = await uploadDirectToDrive(slot.file, accessCode, (pct) =>
        setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, progress: pct } : s))),
      );
      setSlots((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, fileId: res.fileId, progress: 100 } : s)),
      );
      out.push({ fileId: res.fileId, filename: res.filename });
    }
    return out;
  }

  async function submit() {
    setError("");
    if (!accessCode) {
      setError("Your session expired. Reload and sign in again.");
      return;
    }
    const allowedFormats =
      requestType === "Edit" ? ["Talking Video", "BROLL"] : ["Graphic", "Carousel"];
    if (!allowedFormats.includes(format)) {
      setError(`Pick a ${requestType === "Edit" ? "video" : "design"} format.`);
      return;
    }
    if (useFootageLink && !footageLink.trim()) {
      setError("Paste the Drive link to your footage.");
      return;
    }
    if (!useFootageLink && !footage.length) {
      setError("Attach your footage, or share a Drive link instead.");
      return;
    }
    if (!scripts.length) {
      setError("Attach the scripts for this request.");
      return;
    }
    setSubmitting(true);
    try {
      const footageRefs = useFootageLink ? [] : await uploadAll(footage, setFootage);
      const scriptRefs = await uploadAll(scripts, setScripts);
      const r = await fetch("/api/creative-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({
          requestType,
          format,
          posts,
          footage: footageRefs,
          scripts: scriptRefs,
          footageLinks: footageLink.trim(),
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Request failed");
      setDone(true);
      setFootage([]);
      setScripts([]);
      setFootageLink("");
      setUseFootageLink(false);
      setPosts(1);
      setFormat(requestType === "Edit" ? "Talking Video" : "Graphic");
      loadList();
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please retry.");
    } finally {
      setSubmitting(false);
    }
  }

  const typeOptions: { value: RequestType; label: string }[] = [
    { value: "Edit", label: "Video Edit" },
    { value: "Design", label: "Design" },
  ];
  // Same style names and descriptions as the "Create yourself" form.
  const formatOptions: { value: RequestFormat; label: string; hint: string }[] =
    requestType === "Edit"
      ? [
          { value: "BROLL", label: "BROLL", hint: "" },
          { value: "Talking Video", label: "Talking Video", hint: "" },
        ]
      : [
          {
            value: "Graphic",
            label: "Graphic",
            hint: "A single designed image built from your script and brand look.",
          },
          {
            value: "Carousel",
            label: "Carousel",
            hint: "A multi-slide design built from your script and brand look.",
          },
        ];

  return (
    <div className="relative min-h-[calc(100vh-200px)] bg-white text-[#1A1A1D]">
      {submitting && <div className="fixed inset-0 z-40 cursor-wait bg-black/40" aria-hidden />}

      {done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-md rounded-2xl border border-[#E5E5E8] bg-white p-7 text-center shadow-xl">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F7EF] text-[#0E8A5F]">
              <CheckCircle2 size={26} />
            </span>
            <h3
              className="mt-4 text-[17px] text-[#1A1A1D]"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
            >
              Request received
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6A6A72]">
              Your edited material will be ready within 24 to 48 business hours.
            </p>
            <button
              type="button"
              onClick={() => setDone(false)}
              className="mt-6 w-full rounded-lg bg-[#4F6BFF] px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#8878ea]"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      <div className="bg-white text-[#1A1A1D]">
        <LaneTabs lanes={lanes} active={activeLane} onChange={onLaneChange} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-14 pb-12 md:pb-16">
          {/* Form */}
          <div className="relative w-full overflow-hidden rounded-2xl border border-[#EDEDF0] bg-[#FAFAFB] shadow-sm">
            <div className="m-6 mb-0 flex rounded-lg border border-[#E5E5E8] bg-[#F8F8FB] p-1 md:m-8 md:mb-0">
              {typeOptions.map((o) => {
                const active = requestType === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setRequestType(o.value);
                      setFormat(o.value === "Edit" ? "Talking Video" : "Graphic");
                      setError("");
                    }}
                    className={`flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-[11px] transition-colors ${
                      active
                        ? "bg-white text-[#1A1A1D] shadow-sm"
                        : "text-[#5A5860] hover:text-[#1A1A1D]"
                    }`}
                    style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            <div className="p-6 md:p-8">
              <FieldLabel>{requestType === "Edit" ? "Editing style" : "Design style"}</FieldLabel>
              <Dropdown
                value={format}
                options={formatOptions.map((o) => o.value)}
                descriptions={Object.fromEntries(formatOptions.map((o) => [o.value, o.hint]))}
                placeholder={`Select a ${requestType === "Edit" ? "editing" : "design"} style…`}
                onChange={(v) => {
                  if (!submitting) {
                    setFormat(v as RequestFormat);
                    setError("");
                  }
                }}
              />

            <div className="mt-7">
              <FieldLabel>Number of posts</FieldLabel>
              <input
                type="number"
                min={1}
                max={60}
                disabled={submitting}
                value={posts}
                onChange={(e) => setPosts(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
                className="w-28 rounded-xl border border-[#E5E5E8] bg-white px-3 py-2.5 text-[13px] text-[#1A1A1D] outline-none focus:border-[#4F6BFF]"
              />
            </div>

            <div className="mt-7">
              <FieldLabel>Footage</FieldLabel>
              <AttachBox
                multiple
                accept="video/*,image/*"
                disabled={submitting}
                onFiles={(files) => { setError(""); setUseFootageLink(false); setFootageLink(""); setFootage((prev) => [...prev, ...Array.from(files).map((file) => ({ file, progress: 0 }))]); }}
                link={footageLink}
                onLink={(v) => { setFootageLink(v); setUseFootageLink(!!v.trim()); if (v.trim()) setFootage([]); }}
                items={footage.map((f, i) => ({ key: `${f.file.name}-${i}`, name: f.file.name, note: submitting ? `${f.progress}%` : undefined, onRemove: () => setFootage((prev) => prev.filter((_, idx) => idx !== i)) }))}
              />
            </div>

            <div className="mt-7">
              <FieldLabel>Scripts</FieldLabel>
              <DropZone
                label="Attach your scripts"
                accept=".pdf,.doc,.docx,.txt,application/pdf"
                multiple
                slots={scripts}
                setSlots={setScripts}
                disabled={submitting}
                icon={<FileText size={18} />}
              />
            </div>

            {error && (
              <p className="mt-5 flex items-start gap-2 text-[12px] text-[#F87171]">
                <AlertCircle size={14} className="mt-[2px] shrink-0" />
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#4F6BFF] px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#8878ea] disabled:opacity-60"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {submitting
                  ? "Uploading…"
                  : `Request ${requestType === "Edit" ? "edits" : "designs"}`}
              </button>
            </div>
          </div>
        </div>

        {/* Submitted requests: same presentation as Past audits */}
        <div className="mt-10">
            <p
              className="text-[11px] uppercase tracking-[.14em] text-[#5A5860]"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
            >
              Submitted requests
            </p>

            {loadingList ? (
              <p className="mt-3 inline-flex items-center gap-2 text-[12px] text-[#9B9BA1]">
                <Loader2 size={14} className="animate-spin" /> Loading your requests…
              </p>
            ) : items.length === 0 ? (
              <p className="mt-3 text-[13px] text-[#9B9BA1]">
                Nothing submitted yet. Your requests will show up here.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-xl border border-[#E5E5E8] bg-white">
                <table className="w-full min-w-[640px] text-left">
                  <thead className="bg-[#F4F4F6]">
                    <tr className="text-[11px] uppercase tracking-[.08em] text-[#5A5860]">
                      <th className="px-4 py-2.5 font-semibold">Submitted</th>
                      <th className="px-4 py-2.5 font-semibold">Type</th>
                      <th className="px-4 py-2.5 font-semibold">Format</th>
                      <th className="px-4 py-2.5 font-semibold">Posts</th>
                      <th className="px-4 py-2.5 font-semibold">Files</th>
                      <th className="px-4 py-2.5 font-semibold">Status</th>
                      <th className="px-4 py-2.5 font-semibold">Delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id} className="border-t border-[#EDEDF0] text-[13px] text-[#2A2A2E]">

                        <td className="px-4 py-3 whitespace-nowrap">{fmtDate(it.createdTime)}</td>
                        <td className="px-4 py-3">{it.requestType || "—"}</td>
                        <td className="px-4 py-3">{it.format || "—"}</td>
                        <td className="px-4 py-3">{it.posts || "—"}</td>
                        <td className="px-4 py-3 text-[12px] text-[#5A5860]">
                          {it.footage.length} footage · {it.scripts.length} script
                          {it.scripts.length === 1 ? "" : "s"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] ${statusClasses(it.status)}`}
                          >
                            {it.status || "To Edit"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {it.editedUrl ? (
                            <a
                              href={it.editedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#4F6BFF] underline"
                            >
                              Open files
                            </a>
                          ) : (
                            <span className="text-[#9B9BA1]">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
