import type { ReactNode } from "react";

export function DocCard({
  label,
  trailing,
  children,
}: {
  label: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-white border border-[#E5E5E8] rounded-2xl rounded-tl-sm overflow-hidden max-w-[92%] mt-3">
      <div className="bg-[#F6F6F7] px-5 py-3 border-b border-[#E5E5E8] flex items-center justify-between">
        <span className="text-[13px] text-[#5A5860]">{label}</span>
        {trailing && <span className="text-[11px] text-[#9B9BA1]">{trailing}</span>}
      </div>
      <div className="p-5 text-[14px] leading-relaxed text-[#1A1A1D]">{children}</div>
    </div>
  );
}
