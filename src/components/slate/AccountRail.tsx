import { useEffect, useRef, useState } from "react";
import {
  X,
  Eye,
  EyeOff,
  Lock,
  UserRound,
  FileText,
  BarChart3,
  LogOut,
  User,
  Camera,
  Loader2,
  Plus,
} from "lucide-react";

const STRIPE_CREDITS_LINK = "https://buy.stripe.com/5kQ5kDaM61dp4p4abygnK0J";

export function AccountRail({
  open,
  onClose,
  clientName,
  accessCode,
  scriptsLeft,
  reportsLeft,
  avatarUrl,
  onLogout,
  onAvatarChange,
  onRefreshCredits,
}: {
  open: boolean;
  onClose: () => void;
  clientName: string;
  accessCode: string;
  scriptsLeft: number | null;
  reportsLeft: number | null;
  avatarUrl?: string;
  onLogout: () => void;
  onAvatarChange?: (url: string) => void;
  onRefreshCredits?: () => void;
}) {
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setShowAccessCode(false);
      setAvatarError("");
    }
  }, [open]);

  // Credits may have been topped up in the Stripe tab; refresh when we regain focus.
  useEffect(() => {
    if (!open || !onRefreshCredits) return;
    const onFocus = () => onRefreshCredits();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [open, onRefreshCredits]);

  const pickAvatar = async (file: File | null) => {
    if (!file) return;
    setAvatarError("");
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("That image is too large (max 5MB).");
      return;
    }
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1] || "");
        r.onerror = () => reject(new Error("Could not read that file"));
        r.readAsDataURL(file);
      });
      const res = await fetch("/api/account-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessCode,
          base64,
          filename: file.name,
          contentType: file.type || "image/png",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      onAvatarChange?.(String(data.avatarUrl || ""));
    } catch (e: any) {
      setAvatarError(String(e?.message || e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeAvatar = async () => {
    setAvatarError("");
    setUploading(true);
    try {
      const res = await fetch("/api/account-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode, clear: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not remove the picture");
      onAvatarChange?.("");
    } catch (e: any) {
      setAvatarError(String(e?.message || e));
    } finally {
      setUploading(false);
    }
  };

  const buyCredits = () => {
    const url = `${STRIPE_CREDITS_LINK}?client_reference_id=${encodeURIComponent(accessCode)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const lowScripts = typeof scriptsLeft === "number" && scriptsLeft < 10;
  const lowReports = typeof reportsLeft === "number" && reportsLeft < 10;


  return (
    <>
      <div
        onClick={onClose}
        aria-hidden={!open}
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-label="My account"
        aria-hidden={!open}
        className={`fixed left-0 top-0 z-[61] flex h-full w-[320px] max-w-[88vw] flex-col bg-white text-[#1A1A1D] shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#E5E5E8] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => pickAvatar(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Change profile picture"
              title="Change profile picture"
              className="group relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#E5E5E8]"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={clientName ? `${clientName} profile picture` : "Profile picture"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-[#1A1A1D]/[.04] text-[#1A1A1D]/60">
                  {clientName ? (
                    <span className="text-[13px] font-semibold">
                      {clientName.trim().charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User size={15} />
                  )}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition group-hover:opacity-100">
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
              </span>
              {uploading && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
                  <Loader2 size={13} className="animate-spin" />
                </span>
              )}
            </button>
            <div className="min-w-0">
              <span
                className="block truncate text-[13px]"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
              >
                My account
              </span>
              <div className="flex items-center gap-2 text-[10px] text-[#1A1A1D]/45">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="transition hover:text-[#4F6BFF]"
                >
                  Change photo
                </button>
                {avatarUrl && (
                  <>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={removeAvatar}
                      disabled={uploading}
                      className="transition hover:text-[#B4482E]"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#1A1A1D]/40 transition hover:text-[#1A1A1D]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {avatarError && (
            <p className="mb-4 rounded-lg border border-[#D92D20]/30 bg-[#D92D20]/[.04] px-3 py-2 text-[11px] text-[#D92D20]">
              {avatarError}
            </p>
          )}
          <div className="grid gap-3 grid-cols-2">

            <div
              className={`rounded-xl border p-3 ${
                lowScripts
                  ? "border-[#D92D20]/30 bg-[#D92D20]/[.04]"
                  : "border-[#2E7D57]/30 bg-[#2E7D57]/[.04]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <FileText size={13} className={lowScripts ? "text-[#D92D20]" : "text-[#2E7D57]"} />
                <span className="text-[9px] uppercase tracking-[.16em] text-[#1A1A1D]/55">
                  Scripts
                </span>
              </div>
              <p
                className={`mt-1.5 text-xl font-semibold ${
                  lowScripts ? "text-[#D92D20]" : "text-[#2E7D57]"
                }`}
              >
                {scriptsLeft ?? "—"}
              </p>
            </div>

            <div
              className={`rounded-xl border p-3 ${
                lowReports
                  ? "border-[#D92D20]/30 bg-[#D92D20]/[.04]"
                  : "border-[#2E7D57]/30 bg-[#2E7D57]/[.04]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <BarChart3 size={13} className={lowReports ? "text-[#D92D20]" : "text-[#2E7D57]"} />
                <span className="text-[9px] uppercase tracking-[.16em] text-[#1A1A1D]/55">
                  Reports
                </span>
              </div>
              <p
                className={`mt-1.5 text-xl font-semibold ${
                  lowReports ? "text-[#D92D20]" : "text-[#2E7D57]"
                }`}
              >
                {reportsLeft ?? "—"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={buyCredits}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F6BFF] px-4 py-2.5 text-[11px] uppercase tracking-[.18em] text-white transition hover:bg-[#3f58e0]"
          >
            <Plus size={13} /> Buy more credits
          </button>
          <p className="mt-2 text-[10px] leading-relaxed text-[#1A1A1D]/45">
            Adds 30 scripts and 30 reports once your payment goes through.
          </p>

          <div className="mt-6">
            <label className="mb-2 block text-[10px] uppercase tracking-[.18em] text-[#1A1A1D]/50">
              Account name
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-[#E5E5E8] bg-white px-3.5 py-2.5">
              <UserRound size={15} className="shrink-0 text-[#4F6BFF]" />
              <span className="truncate text-[13px] font-medium text-[#1A1A1D]">
                {clientName || "—"}
              </span>
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-[10px] uppercase tracking-[.18em] text-[#1A1A1D]/50">
              Password
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-[#E5E5E8] bg-white px-3.5 py-2.5">
              <Lock size={15} className="shrink-0 text-[#4F6BFF]" />
              <span className="min-w-0 flex-1 truncate text-[13px] tracking-[.08em] text-[#1A1A1D]">
                {showAccessCode
                  ? accessCode
                  : "•".repeat(Math.max(8, Math.min(accessCode.length, 16)))}
              </span>
              <button
                type="button"
                onClick={() => setShowAccessCode((c) => !c)}
                aria-label={showAccessCode ? "Hide password" : "Show password"}
                className="text-[#1A1A1D]/35 transition hover:text-[#1A1A1D]/70"
              >
                {showAccessCode ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-[#E5E5E8] px-5 py-4">
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E5E8] px-4 py-2.5 text-[11px] uppercase tracking-[.18em] text-[#1A1A1D]/60 transition hover:border-[#B4482E]/50 hover:text-[#B4482E]"
          >
            <LogOut size={13} /> Log out
          </button>
        </div>
      </aside>
    </>
  );
}
