import { useState, type ReactNode, type ComponentType } from "react";
import { Loader2, Copy, Check } from "lucide-react";

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "subtle";
  className?: string;
  type?: "button" | "submit" | "reset";
};

export function Button({ children, onClick, disabled, variant = "primary", className = "", type = "button" }: ButtonProps) {
  const base =
    "inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap rounded-xl";
  const variants: Record<string, string> = {
    primary: "bg-[#4F6BFF] text-white hover:bg-[#6C7BFF] shadow-[2px_2px_0_0_#1A1A1D]",
    ghost: "bg-transparent text-[#F6F6F7] hover:text-[#4F6BFF] border border-[#F6F6F7]/15 hover:border-[#4F6BFF]/50",
    subtle: "bg-[#F6F6F7]/[0.04] text-[#F6F6F7] hover:bg-[#F6F6F7]/[0.08] border border-[#F6F6F7]/10",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-[10px] uppercase tracking-[0.18em] text-[#F6F6F7]/50 font-semibold">{label}</label>
        {hint && <span className="text-[10px] text-[#F6F6F7]/40 italic">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#F6F6F7]/[0.04] border border-[#F6F6F7]/10 text-[#F6F6F7] px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F6BFF]/60 placeholder:text-[#F6F6F7]/30 font-light rounded-xl"
    />
  );
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  mono = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full bg-[#F6F6F7]/[0.04] border border-[#F6F6F7]/10 text-[#F6F6F7] px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F6BFF]/60 placeholder:text-[#F6F6F7]/30 font-light resize-none rounded-xl ${
        mono ? "font-mono text-xs leading-relaxed" : ""
      }`}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#F6F6F7]/[0.04] border border-[#F6F6F7]/10 text-[#F6F6F7] px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F6BFF]/60 font-light rounded-xl"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-[#1A1A1D]">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#F6F6F7]/50 hover:text-[#4F6BFF] transition"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function OutputBlock({
  title,
  content,
  loading,
  placeholder,
  placeholderIcon: Icon,
}: {
  title: string;
  content: string;
  loading: boolean;
  placeholder: string;
  placeholderIcon?: ComponentType<{ className?: string; size?: number }>;
}) {
  if (loading) {
    return (
      <div className="border border-[#F6F6F7]/10 bg-[#1A1A1D]/50 p-12 flex flex-col items-center justify-center gap-3 text-[#F6F6F7]/50 rounded-xl">
        <Loader2 className="animate-spin text-[#4F6BFF]" size={20} />
        <span className="text-[11px] uppercase tracking-[0.2em]">Working...</span>
      </div>
    );
  }
  if (!content) {
    return (
      <div className="border border-dashed border-[#F6F6F7]/15 p-12 text-center rounded-xl">
        {Icon && <Icon className="mx-auto text-[#F6F6F7]/30 mb-4" size={32} />}
        <p className="text-xs uppercase tracking-wider text-[#F6F6F7]/40">{placeholder}</p>
      </div>
    );
  }
  return (
    <div className="border border-[#4F6BFF]/20 bg-[#1A1A1D]/70 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#F6F6F7]/10 bg-[#F6F6F7]/[0.03]">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#4F6BFF] font-semibold">{title}</span>
        <CopyButton text={content} />
      </div>
      <div className="p-5 text-sm text-[#F6F6F7] whitespace-pre-wrap leading-relaxed font-light max-h-[700px] overflow-y-auto">
        {content}
      </div>
    </div>
  );
}

/** Click-to-edit text. Shows hover affordance, persists on blur. */
export function EditableText({
  value,
  onChange,
  multiline = true,
  className = "",
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
}) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline={multiline}
      data-placeholder={placeholder}
      onBlur={(e) => {
        const next = (multiline
          ? (e.currentTarget.innerText || "")
          : (e.currentTarget.textContent || "")
        ).replace(/\u00A0/g, " ");
        if (next !== value) onChange(next);
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLDivElement).blur();
        }
      }}
      className={`editable-text whitespace-pre-wrap ${className}`}
    >
      {value}
    </div>
  );
}
