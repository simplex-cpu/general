/** Rules for the "two variations per topic" writing loop. */
export type VariationMsg = {
  kind: string;
  variantGroup?: number;
  chosen?: boolean;
  discarded?: boolean;
  captions?: unknown;
  plannerAdded?: boolean;
  completed?: boolean;
};

export type CtaChoice = "follow" | "comment" | "share" | "save" | "lead-magnet" | "dm-keyword";

/** Acquire synchronously, before React updates, to reject overlapping clicks. */
export function createWriterActionLock() {
  let locked = false;
  return {
    acquire() {
      if (locked) return false;
      locked = true;
      return true;
    },
    release() {
      locked = false;
    },
    get busy() {
      return locked;
    },
  };
}

export function formatCtaChoice(choice: CtaChoice, keyword = "", benefit = ""): string {
  if (choice === "lead-magnet")
    return `Comment “${keyword.trim()}”${benefit.trim() ? ` ${benefit.trim()}` : ""}`;
  if (choice === "dm-keyword")
    return `DM “${keyword.trim()}”${benefit.trim() ? ` ${benefit.trim()}` : ""}`;
  return choice.charAt(0).toUpperCase() + choice.slice(1);
}

export function plannerActionLabel(index: number, total: number): string {
  return index + 1 < total ? "Add this to Planner & Write Next" : "Add this to Planner";
}

export function completeVariationPair<T extends VariationMsg & { variantLabel?: string }>(
  variations: Array<T | null>,
): T[] {
  if (variations.length !== 2 || variations.some((variation) => !variation)) return [];
  return (variations as T[]).sort((a, b) =>
    (a.variantLabel || "").localeCompare(b.variantLabel || ""),
  );
}

export function historyAction(status: "In progress" | "Done", hasScripts: boolean) {
  if (status === "In progress") return "continue" as const;
  return hasScripts ? ("repurpose" as const) : ("none" as const);
}

export function progressTone(completed: number, total: number): "low" | "mid" | "high" {
  const ratio = total > 0 ? completed / total : 0;
  if (ratio >= 0.75) return "high";
  if (ratio >= 0.34) return "mid";
  return "low";
}

export function orderedVariations<T extends VariationMsg & { variantLabel?: string }>(
  messages: T[],
  group: number,
): T[] {
  return liveVariations(messages, group).sort((a, b) =>
    (a.variantLabel || "").localeCompare(b.variantLabel || ""),
  );
}

/** Live (not regenerated away) variation cards for one topic. */
export function liveVariations<T extends VariationMsg>(messages: T[], group: number): T[] {
  return messages.filter(
    (m) => m.kind === "script" && m.variantGroup === group && !m.discarded && !m.completed,
  );
}

/** "Approve & Write captions" stays disabled until one variation is picked. */
export function canApproveVariation(messages: VariationMsg[], group: number): boolean {
  return liveVariations(messages, group).some((m) => m.chosen);
}

/** Pairs the two hooks written for a topic (1-based topicIndex) into one hook per variation. */
export function hookPair<H extends { topicIndex: number }>(
  hooks: H[],
  topicPosition: number,
): [H | undefined, H | undefined] {
  const mine = hooks.filter((h) => h.topicIndex === topicPosition + 1);
  return [mine[0], mine[1] ?? mine[0]];
}

/** Selection, captions and planner placement are three steps per script. */
export function writerProgress(
  messages: VariationMsg[],
  count: number,
  setupCompleted: number,
  setupTotal: number,
) {
  const chosen = messages.filter((m) => m.kind === "script" && m.chosen && !m.discarded);
  const total = setupTotal + Math.max(1, count) * 3;
  const completed =
    Math.min(setupCompleted, setupTotal) +
    chosen.reduce((n, m) => n + 1 + Number(!!m.captions) + Number(!!m.plannerAdded), 0);
  return { completed: Math.min(completed, total), total };
}
