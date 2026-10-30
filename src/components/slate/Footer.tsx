import { Markblock } from "./Markblock";

export function Footer() {
  return (
    <footer className="bg-[#1A1A1D] border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Markblock />
          <span
            className="text-[11px] text-[#F6F6F7]/55"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}
          >
            RISE<span style={{ fontWeight: 300 }}>VOICE</span>
            <span
              className="ml-2 text-[#6C7BFF] uppercase tracking-[0.18em] text-[10px]"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
            >
              Creators Hub
            </span>
          </span>
        </div>
        <span
          className="text-[11px] text-[#F6F6F7]/45"
          style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}
        >
          powered by Claude
        </span>
      </div>
    </footer>
  );
}
