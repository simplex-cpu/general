import { AiBubble } from "./AiBubble";

export function TypingIndicator({ label }: { label?: string }) {
  return (
    <AiBubble>
      <div className="flex items-center gap-2">
        <span className="inline-flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1D]/50 typing-dot" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1D]/50 typing-dot" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1D]/50 typing-dot" style={{ animationDelay: "300ms" }} />
        </span>
        {label && <span className="text-[12px] text-[#5A5860]">{label}</span>}
      </div>
      <style>{`
        @keyframes typingDot { 0%, 80%, 100% { opacity: .25; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-2px); } }
        .typing-dot { animation: typingDot 1.2s infinite ease-in-out; display: inline-block; }
      `}</style>
    </AiBubble>
  );
}
