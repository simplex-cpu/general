export const VIRAL_KIT_TOOLS = [
  { id: "strategy", label: "Analyze account", mode: "analyze", available: true },
  { id: "inspo", label: "Find Viral Posts", mode: "inspo", available: true },
  { id: "clipper", label: "Long form Clipper", mode: "clipper", available: true },
  { id: "thumbnails", label: "Create Thumbnails", mode: null, available: false },
] as const;

export type ViralKitMode = "analyze" | "inspo" | "clipper";

export function viralKitDestination(id: string): ViralKitMode | null {
  const tool = VIRAL_KIT_TOOLS.find((item) => item.id === id);
  return tool?.available ? tool.mode : null;
}

export function primaryNavigationMode(mode: string): string {
  return mode === "analyze" || mode === "inspo" || mode === "clipper" ? "viral-kit" : mode;
}
