import { Settings } from "lucide-react";
import { Markblock } from "./Markblock";

export function Header({ onGearClick, showAdmin = false }: { onGearClick: () => void; showAdmin?: boolean }) {
  return (
    <header className="bg-[#1A1A1D] border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Markblock />
          <div className="flex items-baseline gap-2 min-w-0">
            <span
              className="text-[#F6F6F7] text-xs leading-none tracking-tight"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
            >
              RISE<span style={{ fontWeight: 300 }}>VOICE</span>
            </span>
            <span
              className="hidden sm:inline text-[#6C7BFF] text-[10px] leading-none uppercase tracking-[0.18em] whitespace-nowrap"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
            >
              Creators Hub
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4 md:gap-5">
          <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#F6F6F7]/55">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
            AI engine live
          </div>
          {showAdmin && (
            <button
              onClick={onGearClick}
              title="Admin settings"
              className="text-[#F6F6F7]/55 hover:text-[#4F6BFF] transition p-2 border border-white/10 hover:border-[#4F6BFF]/40 rounded-lg"
            >
              <Settings size={15} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
