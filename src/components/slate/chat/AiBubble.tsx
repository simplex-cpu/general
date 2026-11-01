import type { ReactNode } from "react";
import { Message } from "@/components/ai-elements/message";

export function AiBubble({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <Message from="assistant" className="max-w-full flex-row gap-3">
      <div
        className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F6BFF] to-[#6C7BFF] flex flex-col items-center justify-center gap-[2px] flex-shrink-0 shadow-[0_2px_8px_-2px_rgba(118,102,224,0.35)] ring-1 ring-black/5"
        aria-label="Risevoice"
      >
        <span className="block h-[2px] w-[16px] bg-white rounded-full" />
        <span className="block h-[2px] w-[10px] bg-white opacity-80 rounded-full" />
        <span className="block h-[2px] w-[16px] bg-white opacity-50 rounded-full" />
      </div>
      <div
        className={`min-w-0 text-brand-ink text-[14px] leading-relaxed ${wide ? "flex-1" : "max-w-[85%] rounded-2xl rounded-tl-md bg-brand-surface px-4 py-3 shadow-sm sm:max-w-[78%]"}`}
      >
        {children}
      </div>
    </Message>
  );
}
