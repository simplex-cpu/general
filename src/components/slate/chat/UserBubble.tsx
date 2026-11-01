import type { ReactNode } from "react";
import { Message } from "@/components/ai-elements/message";

function getInitials(name?: string): string {
  const n = (name || "").trim();
  if (!n) return "??";
  const parts = n.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return n.slice(0, 2).toUpperCase();
}

export function UserBubble({ children, clientName }: { children: ReactNode; clientName?: string }) {
  const initials = getInitials(clientName);
  return (
    <Message from="user" className="max-w-full flex-row gap-3 justify-end">
      <div className="bg-brand-accent text-brand-surface rounded-2xl rounded-tr-md px-4 py-3 sm:px-5 text-[14px] leading-relaxed max-w-[85%] sm:max-w-[78%]">
        {children}
      </div>
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F6F6F7] to-[#E5E5E8] ring-1 ring-[#D6D3CB] flex items-center justify-center text-[#2A2A2E] text-[11px] font-semibold flex-shrink-0 tracking-wider shadow-sm">
        {initials}
      </div>
    </Message>
  );
}
