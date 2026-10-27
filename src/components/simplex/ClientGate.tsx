import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const STORAGE_KEY = "simplex_access";

type AccessRecord = {
  code: string;
  clientName: string;
  userType: string;
  validatedAt: number;
};

type Props = {
  children: (ctx: {
    clientName: string;
    code: string;
    userType: string;
    logout: () => void;
  }) => React.ReactNode;
};

export function ClientGate({ children }: Props) {
  const [status, setStatus] = useState<"checking" | "locked" | "unlocked">("checking");
  const [clientName, setClientName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [userType, setUserType] = useState("User");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setStatus("locked");
      return;
    }
    let parsed: AccessRecord;
    try {
      parsed = JSON.parse(raw) as AccessRecord;
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      setStatus("locked");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/validate-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: parsed.code }),
        });
        const data = await res.json();
        if (data.valid) {
          setClientName(data.clientName || parsed.clientName);
          setAccessCode(parsed.code);
          setUserType(data.userType || parsed.userType || "User");
          sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              ...parsed,
              clientName: data.clientName,
              userType: data.userType || "User",
              validatedAt: Date.now(),
            })
          );
          setStatus("unlocked");
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
          setStatus("locked");
          if (data.reason === "deactivated") {
            setError("This access code has been deactivated");
          }
        }
      } catch {
        setClientName(parsed.clientName);
        setAccessCode(parsed.code);
        setUserType(parsed.userType || "User");
        setStatus("unlocked");
      }
    })();
  }, []);

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setClientName("");
    setAccessCode("");
    setUserType("User");
    setCode("");
    setError(null);
    setStatus("locked");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        const record: AccessRecord = {
          code: code.trim(),
          clientName: data.clientName || "",
          userType: data.userType || "User",
          validatedAt: Date.now(),
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record));
        setClientName(record.clientName);
        setAccessCode(record.code);
        setUserType(record.userType);
        setStatus("unlocked");
      } else if (data.reason === "deactivated") {
        setError("This access code has been deactivated");
      } else {
        setError("This access code is not valid");
      }
    } catch {
      setError("Could not reach server. Please try again.");
    }
    setSubmitting(false);
  };

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-[#1A1A1D] text-[#F6F6F7] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4F6BFF]" size={20} />
      </div>
    );
  }

  if (status === "locked") {
    return (
      <div className="min-h-screen bg-[#1A1A1D] text-[#F6F6F7] flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center mb-10">
            <img
              src="/brand/wordmark-white.svg"
              alt="Risevoice"
              className="h-10 w-auto mb-6"
            />
            <p className="text-xs uppercase tracking-[0.2em] text-[#F6F6F7]/50 mt-1">
              Creators Hub · Enter your access code
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
              placeholder="access code"
              className="w-full bg-[#F6F6F7]/[0.04] border border-[#F6F6F7]/10 text-[#F6F6F7] px-4 py-3 text-sm focus:outline-none focus:border-[#4F6BFF]/60 placeholder:text-[#F6F6F7]/30 font-light tracking-wide text-center rounded-xl"
            />
            {error && (
              <div className="text-xs text-red-400 text-center font-light">{error}</div>
            )}
            <button
              type="submit"
              disabled={submitting || !code.trim()}
              className="w-full bg-[#4F6BFF] text-white hover:bg-[#6C7BFF] disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 text-sm font-semibold tracking-wide transition-all shadow-[2px_2px_0_0_#000] inline-flex items-center justify-center gap-2 rounded-xl"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Verifying
                </>
              ) : (
                "Enter"
              )}
            </button>
          </form>

          <p className="text-[10px] uppercase tracking-[0.2em] text-[#F6F6F7]/40 text-center mt-10">
            Risevoice Creators Hub
          </p>
        </div>
      </div>
    );
  }

  return <>{children({ clientName, code: accessCode, userType, logout })}</>;
}
