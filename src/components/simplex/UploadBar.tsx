// @ts-nocheck
import { useRef } from "react";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "./ui";
import type { Brief } from "@/lib/simplex/types";

export function UploadBar({
  brief,
  onUploadPDF,
  onResetBrief,
}: {
  brief: Brief;
  onUploadPDF: (file: File) => void;
  onResetBrief: () => void;
}) {
  const pdfRef = useRef<HTMLInputElement>(null);
  const hasError = !!brief.error;
  const hasBrief = !!brief.text;

  return (
    <div className="border-b border-[#F6F6F7]/10 bg-[#1A1A1D]">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-5">
        <div
          className={`border p-4 rounded-xl transition-colors ${
            hasError
              ? "border-red-500/40 bg-red-500/[0.05]"
              : hasBrief
              ? "border-[#4F6BFF]/30 bg-[#4F6BFF]/[0.05]"
              : "border-[#F6F6F7]/10 bg-[#F6F6F7]/[0.02]"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl ${
                  hasError
                    ? "bg-red-500/10 border border-red-500/40"
                    : hasBrief
                    ? "bg-[#4F6BFF]/15 border border-[#4F6BFF]/40"
                    : "bg-[#F6F6F7]/[0.04] border border-[#F6F6F7]/10"
                }`}
              >
                {brief.loading ? (
                  <Loader2 className="animate-spin text-[#4F6BFF]" size={16} />
                ) : hasError ? (
                  <AlertCircle className="text-red-400" size={16} />
                ) : hasBrief ? (
                  <CheckCircle2 className="text-[#4F6BFF]" size={16} />
                ) : (
                  <FileText className="text-[#F6F6F7]/50" size={16} />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#F6F6F7]/50 font-semibold mb-1">
                  Brand Brief (PDF)
                </div>
                {brief.loading ? (
                  <div className="text-sm text-[#F6F6F7]/70 font-light italic">Processing brief...</div>
                ) : hasError ? (
                  <div className="text-sm text-red-300 font-light truncate">{brief.error}</div>
                ) : hasBrief ? (
                  <div className="text-sm text-[#F6F6F7] font-light truncate">
                    <span className="text-[#4F6BFF]">✓</span> {brief.name} attached
                  </div>
                ) : (
                  <div className="text-sm text-[#F6F6F7]/50 font-light">Upload for brand context</div>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <input
                ref={pdfRef}
                type="file"
                accept=".pdf"
                onChange={(e) => e.target.files?.[0] && onUploadPDF(e.target.files[0])}
                className="hidden"
              />
              {hasBrief && !brief.loading ? (
                <button
                  onClick={onResetBrief}
                  className="text-xs text-[#F6F6F7]/50 hover:text-red-400 transition px-2 py-1"
                >
                  × Remove
                </button>
              ) : hasError ? (
                <Button variant="subtle" onClick={() => pdfRef.current?.click()} className="!px-3 !py-2 text-xs">
                  Try again
                </Button>
              ) : !brief.loading ? (
                <Button variant="subtle" onClick={() => pdfRef.current?.click()} className="!px-3 !py-2 text-xs">
                  <Upload size={12} /> Upload
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}