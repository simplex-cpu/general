import { useEffect, useRef, useState } from "react";
import { Loader2, Send, MessageSquare } from "lucide-react";

type Comment = { id: string; createdTime: string; comment: string; author: string };

function fmtDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function CommentsPanel({
  contentId,
  accessCode,
  /** Fills its parent: bubbles scroll, composer sits at the bottom, no outer card. */
  inline,
}: {
  contentId: string;
  accessCode: string;
  inline?: boolean;
}) {
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/dwy-comments?contentId=${encodeURIComponent(contentId)}`, {
          headers: { "x-access-code": accessCode },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);
        if (!cancelled) setItems(data.items || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load comments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [contentId, accessCode]);

  useEffect(() => {
    if (inline) endRef.current?.scrollIntoView({ block: "end" });
  }, [items.length, inline]);

  async function submit() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/dwy-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({ contentId, comment: text.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to send");
      setItems((prev) => [...prev, data.item]);
      setText("");
    } catch (e: any) {
      alert(e?.message || "Failed to send comment");
    } finally {
      setSending(false);
    }
  }

  const bubbles = (
    <>
      {loading ? (
        <div className="flex items-center gap-2 text-[13px] text-[#6A6A72]">
          <Loader2 size={12} className="animate-spin" /> Loading…
        </div>
      ) : error ? (
        <div className="text-[13px] text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-[13px] text-[#9B9BA1]">No comments yet. Start the conversation.</div>
      ) : (
        items.map((c) => (
          <div key={c.id} className="bg-white border border-[#EDEDF0] rounded-2xl rounded-tl-md px-4 py-3 shadow-sm max-w-[80%]">
            <div className="flex items-center justify-between gap-4 mb-1">
              <span className="text-[12px] font-semibold text-[#1A1A1D]">{c.author || "—"}</span>
              <span className="text-[10px] text-[#9B9BA1] whitespace-nowrap">{fmtDate(c.createdTime)}</span>
            </div>
            <p className="text-[13px] text-[#1A1A1D] whitespace-pre-wrap">{c.comment}</p>
          </div>
        ))
      )}
    </>
  );

  const composer = (
    <div className="flex items-end gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
        placeholder="Write a comment… (⌘/Ctrl + Enter to send)"
        rows={2}
        className="flex-1 resize-none text-sm border border-[#E5E5E8] rounded-lg px-3 py-2 bg-white outline-none focus:border-[#7B83FF]"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!text.trim() || sending}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#4F6BFF] text-white hover:bg-[#3F58E8] disabled:opacity-60"
      >
        {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        Send
      </button>
    </div>
  );

  if (inline) {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-3">
          {bubbles}
          <div ref={endRef} />
        </div>
        <div className="shrink-0 px-6 py-4 border-t border-[#EDEDF0] bg-[#F7F7F9]">{composer}</div>
      </div>
    );
  }

  return (
    <section>
      <h3 className="text-[10px] uppercase tracking-[.18em] text-[#6A6A72] mb-3 flex items-center gap-2">
        <MessageSquare size={12} /> Comments
      </h3>
      <div className="border border-[#E5E5E8] rounded-xl bg-[#FAFAFB]">
        <div className="max-h-[280px] overflow-y-auto p-4 space-y-3">{bubbles}</div>
        <div className="border-t border-[#EDEDF0] p-3 bg-white rounded-b-xl">{composer}</div>
      </div>
    </section>
  );
}
