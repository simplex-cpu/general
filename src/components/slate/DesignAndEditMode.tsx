import { useState } from "react";
import { RequestEditsMode } from "./RequestEditsMode";
import { EditYourselfMode, type EditYourselfPrefill } from "./EditYourselfMode";

export type Lane = "risevoice" | "myself";

export type LaneOption = { value: Lane; label: string };

export function LaneTabs({
  lanes,
  active,
  onChange,
}: {
  lanes: LaneOption[];
  active: Lane;
  onChange: (lane: Lane) => void;
}) {
  if (lanes.length <= 1) return null;
  return (
    <div className="flex w-full">
      {lanes.map((l) => {
        const isActive = active === l.value;
        return (
        <button
            key={l.value}
            type="button"
            onClick={() => onChange(l.value)}
            className={`flex-1 inline-flex items-center justify-center gap-2 border-b-2 px-4 py-3 text-xs transition ${
              isActive
                ? "subtab-active"
                : "border-transparent text-[#1A1A1D]/45 hover:text-[#1A1A1D]"
            }`}
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}

export function DesignAndEditMode({
  accessCode,
  showRisevoiceRequest = true,
  onGoToApprovals,
  onGoToBranding,
  initialLane,
  prefill,
}: {
  accessCode: string;
  showRisevoiceRequest?: boolean;
  onGoToApprovals?: () => void;
  onGoToBranding?: () => void;
  initialLane?: Lane;
  prefill?: EditYourselfPrefill;
}) {
  const [lane, setLane] = useState<Lane>(
    initialLane || (showRisevoiceRequest ? "risevoice" : "myself"),
  );

  const lanes: LaneOption[] = [
    ...(showRisevoiceRequest
      ? [{ value: "risevoice" as Lane, label: "Risevoice Request" }]
      : []),
    { value: "myself", label: "Do it Myself" },
  ];

  const active = showRisevoiceRequest ? lane : "myself";

  return (
    <div className="bg-[#1A1A1D]">
      {active === "risevoice" ? (
        <RequestEditsMode
          accessCode={accessCode}
          lanes={lanes}
          activeLane={active}
          onLaneChange={setLane}
        />
      ) : (
        <EditYourselfMode
          accessCode={accessCode}
          lanes={lanes}
          activeLane={active}
          onLaneChange={setLane}
          onGoToApprovals={onGoToApprovals}
          onGoToBranding={onGoToBranding}
          prefill={prefill}
        />
      )}
    </div>
  );
}
