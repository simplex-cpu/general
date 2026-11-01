import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PlannerChoice } from "@/lib/slate/formatFields";
import { AttachBox } from "../post/AttachBox";
import { checkAttachments, limitFor } from "@/lib/slate/attachLimits";
import { uploadDirectToDrive } from "@/lib/driveDirectUpload";

type Up = { fileId: string; filename: string; contentType: string };

export function AddToPlannerDialog({
  open,
  isVideo,
  postType,
  accessCode,
  defaultLink = "",
  onClose,
  onSubmit,
}: {
  open: boolean;
  isVideo: boolean;
  /** Format key or label, used for file type/count limits. */
  postType?: string;
  /** Needed to upload attached files. */
  accessCode?: string;
  defaultLink?: string;
  onClose: () => void;
  onSubmit: (choice: PlannerChoice) => Promise<string | null>;
}) {
  const [action, setAction] = useState<"produce" | "queue" | null>(null);
  const [handler, setHandler] = useState<"risevoice" | "self">("risevoice");
  const [link, setLink] = useState(defaultLink);
  const [files, setFiles] = useState<Up[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pct, setPct] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lim = limitFor(postType);

  const linkOk = /^https?:\/\/\S+$/.test(link.trim());
  const hasFootage = linkOk || files.length > 0;
  const fileErr = checkAttachments(postType, files);
  const canSubmit =
    action === "queue" ||
    (action === "produce" && !uploading && !fileErr && (!isVideo || hasFootage) && (!link.trim() || linkOk));

  async function pick(list: FileList) {
    const arr = Array.from(list);
    const err = checkAttachments(postType, [...files, ...arr]);
    if (err) return setError(err);
    if (!accessCode) return setError("Paste a link instead — uploads aren't available here.");
    setError("");
    setUploading(true);
    try {
      for (let i = 0; i < arr.length; i++) {
        const up = await uploadDirectToDrive(arr[i], accessCode, (p) =>
          setPct(Math.round(((i + p / 100) / arr.length) * 100)),
        );
        setFiles((prev) => [...prev, up]);
      }
    } catch (e: any) {
      setError(e?.message || "That upload did not go through. Please try again.");
    } finally {
      setUploading(false);
      setPct(0);
    }
  }

  async function submit() {
    if (busy || !action || !canSubmit) return;
    setBusy(true);
    setError("");
    const links = [
      ...(linkOk ? [link.trim()] : []),
      ...files.map((f) => `https://drive.google.com/file/d/${f.fileId}/view`),
    ];
    const err = await onSubmit(
      action === "queue" ? { action } : { action, handler, footageLink: links.join("\n") || undefined },
    );
    setBusy(false);
    if (err) setError(err);
    else {
      setAction(null);
      setLink(defaultLink);
      setFiles([]);
    }
  }

  const choiceCls = (on: boolean) =>
    `flex-1 rounded-lg border px-3 py-2.5 text-left transition-colors ${
      on ? "border-brand-accent bg-brand-wash text-brand-accent" : "border-brand-line bg-brand-surface text-brand-ink hover:border-brand-accent/60"
    }`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && !uploading && onClose()}>
      <DialogContent className="gap-4 overflow-hidden border-brand-line bg-brand-surface p-5 text-brand-ink sm:max-w-lg">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-[16px] font-semibold text-brand-ink">Add to planner</DialogTitle>
          <DialogDescription className="text-[13px] text-brand-ink-mid">
            Produce it now, or keep it in the production queue.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <button type="button" className={choiceCls(action === "produce")} disabled={busy} onClick={() => setAction("produce")}>
            <p className="text-[13px] font-semibold">Produce now</p>
            <p className="text-[12px] text-brand-ink-mid">Goes straight to editing or design.</p>
          </button>
          <button type="button" className={choiceCls(action === "queue")} disabled={busy} onClick={() => setAction("queue")}>
            <p className="text-[13px] font-semibold">Production queue</p>
            <p className="text-[12px] text-brand-ink-mid">Waits in Prepare footage.</p>
          </button>
        </div>
        {action === "produce" && (
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-[12px] font-semibold text-brand-ink">
                Footage {isVideo ? "(required)" : "(optional)"}
                {lim && <span className="ml-1 font-normal text-brand-ink-soft">· {lim.label}</span>}
              </p>
              <AttachBox
                accept={lim?.accept}
                multiple={!lim || lim.max > 1}
                disabled={busy}
                uploading={uploading}
                pct={pct}
                onFiles={(f) => void pick(f)}
                link={link}
                onLink={setLink}
                items={[
                  ...(linkOk ? [{ key: "link", name: link.trim(), href: link.trim(), onRemove: () => setLink("") }] : []),
                  ...files.map((f) => ({
                    key: f.fileId,
                    name: f.filename,
                    onRemove: () => setFiles((p) => p.filter((x) => x.fileId !== f.fileId)),
                  })),
                ]}
              />
              {link.trim() && !linkOk && (
                <p className="mt-1 text-[12px] text-destructive">Paste a full link starting with https://</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[12px] font-semibold text-brand-ink">Who handles it?</p>
              {(
                [
                  ["risevoice", "Risevoice team"],
                  ["self", "Do it myself"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  disabled={busy}
                  onClick={() => setHandler(v)}
                  className={`rounded-full border px-3 py-1 text-[12px] font-medium ${
                    handler === v ? "border-brand-accent bg-brand-wash text-brand-accent" : "border-brand-line bg-brand-surface text-brand-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        {(error || fileErr) && (
          <p role="alert" className="text-[13px] text-destructive">{error || fileErr}</p>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" className="border-brand-line bg-brand-surface text-brand-ink" onClick={onClose} disabled={busy || uploading}>
            Cancel
          </Button>
          <Button className="bg-brand-accent text-brand-surface hover:bg-brand-blue-light" onClick={submit} disabled={!canSubmit || busy}>
            {busy ? "Adding…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
