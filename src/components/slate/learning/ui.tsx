import { Lock } from "lucide-react";
import { done } from "./types";

export function StatusPill({ status, locked }: { status: string; locked: boolean }) {
  const label = locked ? "Locked" : status || "Pending";
  const color = locked
    ? "#8B8B93"
    : done(status)
      ? "#22C55E"
      : /in progress/i.test(status)
        ? "#4F6BFF"
        : "#A2A7B6";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold"
      style={{ color, backgroundColor: `${color}1A` }}
    >
      {locked && <Lock size={10} />}
      {label}
    </span>
  );
}

export function progressTone(percent: number) {
  if (percent >= 67) return "var(--progress-high)";
  if (percent >= 34) return "var(--progress-mid)";
  return "var(--progress-low)";
}

export function Progress({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-progress-track">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${p}%`, backgroundColor: progressTone(p) }}
      />
    </div>
  );
}

export function Ring({ percent, size = 44 }: { percent: number; size?: number }) {
  const p = Math.max(0, Math.min(100, percent));
  const tone = progressTone(p);
  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${tone} ${p * 3.6}deg, var(--progress-track) 0deg)`,
      }}
    >
      <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-white text-[10px] font-semibold text-[#1A1A1D]">
        {p}%
      </div>
    </div>
  );
}
