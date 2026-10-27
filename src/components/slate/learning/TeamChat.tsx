import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CornerUpLeft, Loader2, MessagesSquare, Send, SmilePlus, X } from "lucide-react";
import type { ChatSender } from "@/lib/teamChat.server";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";

type Msg = {
  id: string;
  text: string;
  sender: ChatSender;
  createdAt: string;
  replyToId: string | null;
  reactions: Record<string, string[]>;
};

const LABEL: Record<ChatSender, string> = {
  me: "Me",
  strategist: "My strategist",
  creative: "My creative team",
};

const EMOJIS = ["👍", "❤️", "🔥", "🙌", "😂", "🤔"];

function dayKey(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toDateString();
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const today = new Date().toDateString();
  const yest = new Date(Date.now() - 86400000).toDateString();
  if (d.toDateString() === today) return "Today";
  if (d.toDateString() === yest) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function time(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function TeamChat({ accessCode }: { accessCode: string }) {
  const qc = useQueryClient();
  const key = ["team-chat", accessCode];
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: key,
    enabled: !!accessCode,
    refetchInterval: 10000,
    queryFn: async () => {
      const res = await fetch("/api/team-chat", { headers: { "x-access-code": accessCode } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Could not load your messages");
      return (json.items || []) as Msg[];
    },
  });

  const send = useMutation({
    mutationFn: async ({ value, reply }: { value: string; reply: string | null }) => {
      const res = await fetch("/api/team-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({ text: value, replyTo: reply }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Could not send your message");
      return json.item as Msg;
    },
    onSuccess: (item) => {
      qc.setQueryData<Msg[]>(key, (prev) => {
        const list = prev || [];
        return list.some((m) => m.id === item.id) ? list : [...list, item];
      });
      qc.invalidateQueries({ queryKey: key });
    },
  });

  const react = useMutation({
    mutationFn: async ({ id, emoji }: { id: string; emoji: string }) => {
      const res = await fetch("/api/team-chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({ id, emoji }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Could not add your reaction");
      return json.item as Msg;
    },
    onSuccess: (item) => {
      qc.setQueryData<Msg[]>(key, (prev) =>
        (prev || []).map((m) => (m.id === item.id ? { ...m, reactions: item.reactions } : m)),
      );
    },
  });

  const messages = useMemo(() => data || [], [data]);
  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const submit = () => {
    const value = text.trim();
    if (!value || send.isPending) return;
    setText("");
    const reply = replyTo?.id || null;
    setReplyTo(null);
    send.mutate({ value, reply });
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-social-feed">
      <Conversation className="min-h-0">
        <ConversationContent className="mx-auto w-full max-w-4xl gap-3 px-4 py-4 sm:px-6 sm:py-5 md:px-8">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-[#1A1A1D]/60">
              <Loader2 size={14} className="animate-spin" /> Loading your messages…
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {(error as Error).message}
            </div>
          )}

          {!isLoading && !error && !messages.length && (
            <ConversationEmptyState className="min-h-64 py-12">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4F6BFF]/10">
                <MessagesSquare size={18} className="text-[#4F6BFF]" />
              </div>
              <p className="text-[15px] font-semibold text-[#1A1A1D]">Ask support anything</p>
              <p className="max-w-sm text-[13px] leading-relaxed text-[#1A1A1D]/55">
                Your strategist and creative team are here. Ask about your strategy, scripts, edits
                or designs.
              </p>
            </ConversationEmptyState>
          )}

          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
            const newRun = !prev || prev.sender !== m.sender || newDay;
            const mine = m.sender === "me";
            const parent = m.replyToId ? byId.get(m.replyToId) : null;
            const reacted = Object.entries(m.reactions || {});
            return (
              <div key={m.id || i} className="space-y-1.5">
                {newDay && (
                  <div className="flex items-center gap-3 py-1">
                    <span className="h-px flex-1 bg-[#E5E5E8]" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1A1A1D]/40">
                      {dayLabel(m.createdAt)}
                    </span>
                    <span className="h-px flex-1 bg-[#E5E5E8]" />
                  </div>
                )}
                <Message
                  from={mine ? "user" : "assistant"}
                  className={mine ? "items-end" : "items-start"}
                >
                  {newRun && (
                    <span className="mb-0.5 text-[10.5px] font-semibold text-[#1A1A1D]/50">
                      {LABEL[m.sender]}
                    </span>
                  )}
                  <div
                    className={`flex max-w-[88%] items-center gap-1.5 ${mine ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`min-w-0 break-words whitespace-pre-wrap px-3.5 py-2 text-[13.5px] leading-[1.55] ${
                        mine
                          ? "rounded-lg rounded-tr-sm bg-chat-bubble text-brand-ink"
                          : "rounded-none border-0 bg-transparent px-0 py-2 text-brand-ink"
                      }`}
                    >
                      {parent && (
                        <div
                          className={`mb-2 border-l-2 pl-2 text-[12px] ${
                            mine
                              ? "border-brand-ink-grey text-brand-ink-mid"
                              : "border-brand-accent/40 text-brand-ink-soft"
                          }`}
                        >
                          <span className="block font-semibold">{LABEL[parent.sender]}</span>
                          <span className="line-clamp-2">{parent.text}</span>
                        </div>
                      )}
                      {m.text}
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => setReplyTo(m)}
                        className="rounded-lg p-1.5 text-[#1A1A1D]/40 hover:bg-[#1A1A1D]/[.05] hover:text-[#1A1A1D]/70"
                        aria-label="Reply"
                      >
                        <CornerUpLeft size={14} />
                      </button>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setPickerFor(pickerFor === m.id ? null : m.id)}
                          className="rounded-lg p-1.5 text-[#1A1A1D]/40 hover:bg-[#1A1A1D]/[.05] hover:text-[#1A1A1D]/70"
                          aria-label="Add reaction"
                        >
                          <SmilePlus size={14} />
                        </button>
                        {pickerFor === m.id && (
                          <div className="absolute bottom-full z-20 mb-1 flex gap-0.5 rounded-xl border border-[#E5E5E8] bg-white p-1 shadow-lg">
                            {EMOJIS.map((e) => (
                              <button
                                key={e}
                                type="button"
                                onClick={() => {
                                  setPickerFor(null);
                                  react.mutate({ id: m.id, emoji: e });
                                }}
                                className="rounded-lg px-1.5 py-1 text-[15px] hover:bg-[#1A1A1D]/[.06]"
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {!!reacted.length && (
                    <div className={`mt-1 flex flex-wrap gap-1 ${mine ? "justify-end" : ""}`}>
                      {reacted.map(([emoji, who]) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => react.mutate({ id: m.id, emoji })}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] transition ${
                            who.includes("me")
                              ? "border-[#4F6BFF]/40 bg-[#4F6BFF]/10 text-[#1A1A1D]"
                              : "border-[#E5E5E8] bg-white text-[#1A1A1D]/70"
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="tabular-nums">{who.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <span className="mt-1 text-[10px] text-[#1A1A1D]/35">{time(m.createdAt)}</span>
                </Message>
              </div>
            );
          })}
          <div ref={endRef} />
        </ConversationContent>
        <ConversationScrollButton className="bottom-3" />
      </Conversation>

      <div className="shrink-0 border-t border-brand-line bg-social-feed pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-4xl px-4 py-2.5 sm:px-6 md:px-8">
          {send.error && (
            <p className="mb-2 text-[12px] text-red-600">{(send.error as Error).message}</p>
          )}
          {replyTo && (
            <div className="mb-2 flex items-start gap-2 rounded-xl border border-[#E5E5E8] bg-[#FAFAFB] px-3 py-2">
              <div className="min-w-0 flex-1 border-l-2 border-[#4F6BFF]/40 pl-2">
                <p className="text-[11px] font-semibold text-[#1A1A1D]/60">
                  Replying to {LABEL[replyTo.sender]}
                </p>
                <p className="line-clamp-2 text-[12px] text-[#1A1A1D]/55">{replyTo.text}</p>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="rounded-lg p-1 text-[#1A1A1D]/40 hover:text-[#1A1A1D]/70"
                aria-label="Cancel reply"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <PromptInput
            onSubmit={() => submit()}
            className="relative min-h-10 rounded-lg border-[#E5E5E8] bg-white shadow-none focus-within:border-[#4F6BFF]"
          >
            <PromptInputTextarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={1}
              placeholder="Write a message to your team…"
              className="min-h-10 max-h-28 px-3 py-2.5 pr-12 text-[13.5px] text-[#1A1A1D] placeholder:text-[#1A1A1D]/35"
            />
            <PromptInputFooter className="absolute bottom-1 right-1 z-10 w-auto justify-end p-0">
              <PromptInputSubmit
                status={send.isPending ? "submitted" : send.error ? "error" : "ready"}
                disabled={!text.trim() || send.isPending}
                className="size-8 rounded-lg bg-[#4F6BFF] text-white hover:bg-[#4F6BFF]/90"
                aria-label="Send message"
              >
                {send.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </PromptInputSubmit>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
