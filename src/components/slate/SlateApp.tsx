import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ClientGate } from "@/components/simplex/ClientGate";
import { SettingsModal } from "@/components/simplex/SettingsModal";
import { DEFAULT_PROMPTS } from "@/lib/simplex/prompts";
import type { Prompts } from "@/lib/simplex/types";
import { StatusStrip } from "./StatusStrip";
import { ModeTabs, type Mode } from "./ModeTabs";
import { AnalyzeMode } from "./AnalyzeMode";
import { ViralKitMode } from "./ViralKitMode";
import { InspoBankMode } from "./InspoBankMode";
import { LongFormClipperMode } from "./LongFormClipperMode";
import { SectionHeader } from "./SectionHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ScriptMode } from "./ScriptMode";
import { editionForRole } from "@/lib/slate/edition";
import { DivideScriptsMode } from "./DivideScriptsMode";
import { MyBrandsMode } from "./MyBrandsMode";
import { AccountRail } from "./AccountRail";
import { LearningMode, type LearningTarget } from "./LearningMode";
import { CommunityMode } from "./CommunityMode";
import { HomeMode } from "./HomeMode";

import { ApproveAndPostMode } from "./ApproveAndPostMode";
import type { Report } from "@/lib/slate/analyseHelpers";

type CreditSnapshot = {
  scriptsLeft: number | null;
  scriptsBudget: number | null;
  reportsLeft: number | null;
  reportsBudget: number | null;
  avatarUrl?: string;
};

function SlateShell({
  clientName,
  accessCode,
  userType,
  onLogout,
}: {
  clientName: string;
  accessCode: string;
  userType: string;
  onLogout: () => void;
}) {
  const queryClient = useQueryClient();
  const edition = editionForRole(userType);
  const isStaff = edition === "agency-v1";
  const [mode, setMode] = useState<Mode>("learning");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [learningTarget, setLearningTarget] = useState<LearningTarget | null>(null);
  const [communityTarget, setCommunityTarget] = useState<{ postId: string; filter: "all" | "support" | "strategy" } | null>(null);
  const [plannerPostId, setPlannerPostId] = useState<string | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("planner");
    if (!id || !/^rec[A-Za-z0-9]{14}$/.test(id)) return;
    setPlannerPostId(id);
    setMode("approve-post");
  }, []);
  const [prompts, setPrompts] = useState<Prompts>(DEFAULT_PROMPTS);
  const [analysisReport, setAnalysisReport] = useState<Report | null>(null);
  const [analysisAccount, setAnalysisAccount] = useState<string>("");
  const [analysisCreatedAt, setAnalysisCreatedAt] = useState<string>("");
  const [scriptKey, setScriptKey] = useState(0);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [credits, setCredits] = useState<CreditSnapshot>({
    scriptsLeft: null,
    scriptsBudget: null,
    reportsLeft: null,
    reportsBudget: null,
    avatarUrl: "",
  });
  const [accountRailOpen, setAccountRailOpen] = useState(false);
  const brandDirty = useRef(false);
  const auditHydrationRequest = useRef(0);

  const refreshCredits = async () => {
    if (!accessCode) return;
    try {
      const res = await fetch("/api/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCode }),
      });
      const data = await res.json();
      if (data.valid) {
        setCredits({
          scriptsLeft: Number(data.scriptsLeft ?? 0),
          scriptsBudget: Number(data.scriptsBudget ?? 0),
          reportsLeft: Number(data.reportsLeft ?? 0),
          reportsBudget: Number(data.reportsBudget ?? 0),
          avatarUrl: String(data.avatarUrl || ""),
        });
      }
    } catch {
      setCredits({ scriptsLeft: null, scriptsBudget: null, reportsLeft: null, reportsBudget: null, avatarUrl: "" });
    }
  };

  useEffect(() => {
    refreshCredits();
  }, [accessCode]);

  useEffect(() => {
    if (!accessCode) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/prompts", { headers: { "x-access-code": accessCode } });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && data?.prompts) setPrompts({ ...DEFAULT_PROMPTS, ...data.prompts });
      } catch {
        // Keep defaults if the prompt-version store is unavailable.
      }
    })();
    return () => { cancelled = true; };
  }, [accessCode]);

  const handleGearClick = () => {
    if (isStaff) setSettingsOpen(true);
  };

  const handleSendToScripts = (report: Report, summary: { profileName?: string } | null) => {
    setAnalysisReport(report);
    setAnalysisAccount(summary?.profileName || "");
    setAnalysisCreatedAt("");
    setOpenSessionId(null);
    setScriptKey((k) => k + 1);
    setMode("script");
  };

  const clearAnalysis = () => {
    auditHydrationRequest.current += 1;
    hydratedFor.current = accessCode; // don't re-hydrate the report the user just cleared
    setAnalysisReport(null);
    setAnalysisAccount("");
    setAnalysisCreatedAt("");
    setOpenSessionId(null);
    setScriptKey((k) => k + 1);
  };

  // Hydrate the most recent stored audit report once per signed-in account.
  const hydratedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!accessCode || hydratedFor.current === accessCode) return;
    hydratedFor.current = accessCode;
    const requestId = ++auditHydrationRequest.current;
    (async () => {
      try {
        const res = await fetch("/api/analysis-report", { headers: { "x-access-code": accessCode } });
        const data = await res.json().catch(() => ({}));
        if (requestId === auditHydrationRequest.current && res.ok && data?.report) {
          setAnalysisReport(data.report);
          setAnalysisAccount(String(data.profile || ""));
          setAnalysisCreatedAt(String(data.createdAt || ""));
        }
      } catch {
        // Fail silently — a missing stored report is not an error.
      }
    })();
  }, [accessCode]);

  const [clipperProcessing, setClipperProcessing] = useState(false);
  const changeMode = (m: Mode) => {
    if (clipperProcessing) return;
    if (mode === "brief" && m !== "brief" && brandDirty.current) {
      if (!window.confirm("Discard your unsaved brand changes?")) return;
      brandDirty.current = false;
    }
    if (m === "divide" && !isStaff) return;
    if (m === "brief" && isStaff) return;
    if (m === "growth") return; // Coming soon
    if (m === "learning") {
      void queryClient.invalidateQueries({ queryKey: ["home-content", accessCode] });
      void queryClient.invalidateQueries({ queryKey: ["home-community", accessCode] });
    }
    setMode(m);
  };

  return (
    <div className="flex min-h-screen w-full bg-brand-surface">
      <ModeTabs
        mode={mode}
        onChange={changeMode}
        showDivide={isStaff}
        showBrief={!isStaff}
        showLearning={!isStaff}
        clientName={clientName}
        avatarUrl={credits.avatarUrl}
        scriptsLeft={credits.scriptsLeft}
        reportsLeft={credits.reportsLeft}
        onMyAccount={() => setAccountRailOpen(true)}
        onSettings={isStaff ? handleGearClick : undefined}
        display="desktop"
      />
      <div
      className={`flex min-w-0 flex-1 flex-col bg-brand-surface pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:py-0 ${
        mode === "community" || mode === "growth" || (mode === "script" && !isStaff) ? "h-[100dvh] overflow-hidden" : mode === "brief" ? "min-h-screen md:h-[100dvh] md:min-h-0 md:overflow-hidden" : "min-h-screen"
      }`}
    >
      <div className="md:hidden"><StatusStrip
        clientName={clientName} scriptsLeft={credits.scriptsLeft} scriptsBudget={credits.scriptsBudget}
        reportsLeft={credits.reportsLeft} reportsBudget={credits.reportsBudget} onLogout={onLogout}
        analysisAccount={analysisReport ? analysisAccount || "report" : ""} onClearAnalysis={clearAnalysis}
        showAdmin={isStaff} onGearClick={handleGearClick} avatarUrl={credits.avatarUrl}
        onMyAccount={() => setAccountRailOpen(true)}
      /></div>
      <ModeTabs
        mode={mode} onChange={changeMode} showDivide={isStaff}
        showBrief={!isStaff} showLearning={!isStaff} clientName={clientName} avatarUrl={credits.avatarUrl}
        scriptsLeft={credits.scriptsLeft} reportsLeft={credits.reportsLeft} display="mobile"
        onMyAccount={isStaff ? undefined : () => setAccountRailOpen(true)}
      />

      <main className={`flex-1 ${mode === "brief" || mode === "community" || mode === "growth" || (mode === "script" && !isStaff) ? "min-h-0" : ""}`}>
        {mode === "brief" && !isStaff && (
          <MyBrandsMode accessCode={accessCode} onDirtyChange={(dirty) => { brandDirty.current = dirty; }} />
        )}
        {mode === "viral-kit" && <ViralKitMode onOpen={(m) => changeMode(m)} />}
        {mode === "analyze" && (
          <section className="min-h-full bg-social-feed">
            <SectionHeader title="Analyze account" leading={<Button variant="ghost" size="icon" aria-label="Back to Viral Kit" title="Back to Viral Kit" onClick={() => changeMode("viral-kit")} className="h-11 w-11 shrink-0 text-brand-ink-mid hover:bg-brand-wash"><ArrowLeft size={18} /></Button>} />
            <AnalyzeMode onSendToScripts={handleSendToScripts} onCreditsChange={refreshCredits} />
          </section>
        )}
        {mode === "inspo" && (
          <section className="min-h-full bg-social-feed">
            <InspoBankMode backControl={<Button variant="ghost" size="icon" aria-label="Back to Viral Kit" title="Back to Viral Kit" onClick={() => changeMode("viral-kit")} className="h-11 w-11 shrink-0 text-brand-ink-mid hover:bg-brand-wash"><ArrowLeft size={18} /></Button>} accessCode={accessCode} onOpenSession={(id) => { setOpenSessionId(id); setScriptKey((k) => k + 1); setMode("script"); }} />
          </section>
        )}
        {mode === "clipper" && (
          <section className="min-h-full bg-social-feed">
            <LongFormClipperMode onProcessingChange={setClipperProcessing} accessCode={accessCode} backControl={<Button variant="ghost" size="icon" aria-label="Back to Viral Kit" title="Back to Viral Kit" onClick={() => changeMode("viral-kit")} className="h-11 w-11 shrink-0 text-brand-ink-mid hover:bg-brand-wash"><ArrowLeft size={18} /></Button>} />
          </section>
        )}
        <div className={mode === "script" ? "h-full" : "hidden"} aria-hidden={mode !== "script"}>
          <ScriptMode
            key={scriptKey}
            clientName={clientName}
            accessCode={accessCode}
            prompts={prompts}
            seedReport={analysisReport}
            seedAccount={analysisAccount}
            seedCreatedAt={analysisCreatedAt}
            onCreditsChange={refreshCredits}
            isAdmin={isStaff}
            onGoToBrief={() => setMode("brief")}
            openSessionId={openSessionId}
          />
        </div>
        {mode === "divide" && isStaff && <DivideScriptsMode accessCode={accessCode} clientName={clientName} />}
        {mode === "approve-post" && <ApproveAndPostMode accessCode={accessCode} initialPostId={plannerPostId} onLinkOpened={() => { setPlannerPostId(null); const u = new URL(window.location.href); if (u.searchParams.has("planner")) { u.searchParams.delete("planner"); window.history.replaceState(null, "", u.toString()); } }} />}
        {mode === "learning" && <HomeMode accessCode={accessCode} clientName={clientName} onOpenSession={(id) => { setOpenSessionId(id); setScriptKey((k) => k + 1); setMode("script"); }} onChange={changeMode} onOpenPost={(id) => { setPlannerPostId(id); changeMode("approve-post"); }} onContinue={(target) => { setLearningTarget(target); changeMode("growth"); }} onCommunity={(target) => { setCommunityTarget(target); changeMode("community"); }} />}
        {mode === "growth" && !isStaff && <LearningMode accessCode={accessCode} initialTarget={learningTarget} />}
        {mode === "community" && <CommunityMode accessCode={accessCode} clientName={clientName} initialTarget={communityTarget} />}
      </main>

      <AccountRail
        open={accountRailOpen}
        onClose={() => setAccountRailOpen(false)}
        clientName={clientName}
        accessCode={accessCode}
        scriptsLeft={credits.scriptsLeft}
        reportsLeft={credits.reportsLeft}
        avatarUrl={credits.avatarUrl}
        onAvatarChange={(url) => setCredits((c) => ({ ...c, avatarUrl: url }))}
        onRefreshCredits={refreshCredits}
        onLogout={onLogout}

      />


      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        prompts={prompts}
        setPrompts={setPrompts}
          accessCode={accessCode}
        onLockAdmin={() => setSettingsOpen(false)}
      />
      </div>
    </div>
  );
}

export default function SlateApp() {
  return (
    <ClientGate>
      {({ clientName, code, userType, logout }) => (
        <SlateShell
          clientName={clientName}
          accessCode={code}
          userType={userType}
          onLogout={logout}
        />
      )}
    </ClientGate>
  );
}
