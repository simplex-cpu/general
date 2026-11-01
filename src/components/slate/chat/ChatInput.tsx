import { useRef, useState, useEffect } from "react";
import { Paperclip, Send } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type AttachKind = "brief" | "report" | "transcript";

export function ChatInput({
  onSend,
  onAttach,
  disabled,
  placeholder,
  briefOnly,
}: {
  onSend: (text: string) => void;
  onAttach: (kind: AttachKind, file: File | null) => void;
  disabled?: boolean;
  placeholder?: string;
  briefOnly?: boolean;
}) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingKind = useRef<AttachKind | null>(null);
  const [popOpen, setPopOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 24 * 4 + 16);
    el.style.height = next + "px";
  }, [text]);

  const submit = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText("");
  };

  const pickAttach = (kind: AttachKind, accept: string) => {
    pendingKind.current = kind;
    setPopOpen(false);
    const inp = fileInputRef.current;
    if (inp) {
      inp.accept = accept;
      inp.value = "";
      inp.click();
    }
  };

  return (
    <div className="sticky bottom-0 bg-white border-t border-[#E5E5E8] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4">
        <div
          className={`border rounded-2xl px-3 py-2 flex items-end gap-2 transition-colors ${
            disabled
              ? "bg-[#F1F1F3] border-[#E5E5E8] opacity-70"
              : "bg-white border-[#D6D6DB] shadow-sm focus-within:border-[#4F6BFF]"
          }`}
        >
          <Popover open={popOpen} onOpenChange={setPopOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                className="text-[#1A1A1D] p-2 self-end disabled:opacity-40"
                aria-label="Attach"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" side="top" className="w-56 p-1">
              <button
                className="w-full text-left text-[13px] px-3 py-2 rounded-md hover:bg-[#F6F6F7] text-[#1A1A1D]"
                onClick={() => pickAttach("brief", "application/pdf")}
              >
                Attach brand brief (PDF)
              </button>
              {!briefOnly && (
                <>
                  <button
                    className="w-full text-left text-[13px] px-3 py-2 rounded-md hover:bg-[#F6F6F7] text-[#1A1A1D]"
                    onClick={() => {
                      pendingKind.current = "report";
                      setPopOpen(false);
                      onAttach("report", null);
                    }}
                  >
                    Attach analysis report
                  </button>
                  <button
                    className="w-full text-left text-[13px] px-3 py-2 rounded-md hover:bg-[#F6F6F7] text-[#1A1A1D]"
                    onClick={() => pickAttach("transcript", ".csv,text/csv")}
                  >
                    Attach video transcript (CSV)
                  </button>
                </>
              )}
            </PopoverContent>
          </Popover>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              if (f && pendingKind.current) onAttach(pendingKind.current, f);
              pendingKind.current = null;
            }}
          />
          <textarea
            ref={ref}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={placeholder || "Write a reply…"}
            disabled={disabled}
            className="flex-1 bg-transparent text-[#1A1A1D] text-[14px] focus:outline-none placeholder:text-[#9B9BA1] resize-none py-2.5 max-h-[120px] disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={submit}
            disabled={disabled || !text.trim()}
            className="bg-[#4F6BFF] text-white w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#6C7BFF] disabled:opacity-50 flex-shrink-0"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-[#9B9BA1] text-center mt-2">
          {disabled
            ? "Hang tight — the composer unlocks when the AI finishes."
            : "Enter to send · Attach to add a brief, analysis report, or transcript anytime."}
        </p>
      </div>
    </div>
  );
}
