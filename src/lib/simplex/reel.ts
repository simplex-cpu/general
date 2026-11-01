/** Split a generated reel script into editable sections by ── HEADER ── markers. */
export type ReelSection = { label: string; content: string };

export function parseReelSections(raw: string): ReelSection[] {
  if (!raw?.trim()) return [];
  // Match lines like ── VISUAL HOOK (0-3s) ──
  const re = /─{2,}\s*([^─\n]+?)\s*─{2,}/g;
  const matches: { label: string; index: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    matches.push({ label: m[1].trim(), index: m.index, end: m.index + m[0].length });
  }
  if (matches.length === 0) {
    return [{ label: "Script", content: raw.trim() }];
  }
  const out: ReelSection[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].end;
    const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
    const content = raw.slice(start, end).trim();
    out.push({ label: matches[i].label, content });
  }
  return out;
}

/** Split bulk reel output by ━━━ REEL #N ━━━ markers. */
export function splitBulkReels(raw: string): string[] {
  if (!raw?.trim()) return [];
  const parts = raw.split(/━{2,}[^━\n]*━{2,}/g).map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts : [raw];
}

export function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "script";
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
