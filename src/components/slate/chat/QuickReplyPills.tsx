import { useState } from "react";

type Option = {
  label: string;
  value: any;
  tone?: "priority" | "primary" | "approval";
  disabled?: boolean;
};

export function QuickReplyPills({
  options,
  onPick,
  disabled,
  picked,
}: {
  options: Option[];
  onPick: (v: any) => void;
  disabled?: boolean;
  picked?: any;
}) {
  const [local, setLocal] = useState<any>(picked);
  const isDisabled = disabled || local !== undefined;
  return (
    <div className="flex flex-wrap gap-3 mt-5">
      {options.map((o, i) => {
        const isPicked = local !== undefined && local === o.value;
        const baseCls = "px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors";
        const optDisabled = isDisabled || !!o.disabled;
        const stateCls = isPicked
          ? "bg-progress-high text-brand-surface border-progress-high"
          : optDisabled
            ? "bg-white text-[#9B9BA1] border-[#E5E5E8] cursor-not-allowed"
            : o.tone === "primary"
              ? "bg-[#4F6BFF] text-white border-[#4F6BFF] hover:bg-[#4058DB] hover:border-[#4058DB]"
            : o.tone === "approval"
              ? "bg-progress-high text-brand-surface border-progress-high hover:bg-progress-high/90 hover:border-progress-high"
            : o.tone === "priority"
              ? "bg-[#FEF3F2] text-[#B42318] border-[#FDA29B] hover:border-[#D92D20] hover:text-[#D92D20]"
            : "bg-white text-[#1A1A1D] border-[#E5E5E8] hover:border-[#4F6BFF] hover:text-[#4F6BFF]";
        return (
          <button
            key={i}
            disabled={optDisabled}
            onClick={() => {
              setLocal(o.value);
              onPick(o.value);
            }}
            className={`${baseCls} ${stateCls}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
