
export type BriefPayload = {
  text?: string;
  name?: string;
  topicsToPrioritize?: string;
  languageToIncorporate?: string;
  languageToAvoid?: string;
  adminSummary?: string;
  recentPostsDigest?: string;
  // "Recommended strategy" from the brand's table. Always sent to scripting calls.
  recommendedStrategy?: string;
};

export type BriefExtrasOptions = {
  // "research" sends the full session brief (includes Brand expertise + Topics
  // we've used before). "scripting" strips those two sections — hooks/scripts/
  // captions don't need to see them and they crowd context.
  slice?: "research" | "scripting";
  includeRecentPosts?: boolean;
};


// Strip the "## Topics we've used before" section from the session brief.
// That section is research-only and should not leak into hook / script /
// caption prompts. Brand expertise stays — scripting still benefits from it.
function stripResearchOnlySections(md: string): string {
  if (!md) return md;
  const lines = md.split("\n");
  const out: string[] = [];
  let skipping = false;
  for (const line of lines) {
    const isHeader = /^##\s+/.test(line);
    if (isHeader) {
      const lower = line.toLowerCase();
      skipping = lower.includes("topics we've used before") || lower.includes("topics we have used before");
      if (skipping) continue;
    }
    if (!skipping) out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function buildBriefExtras(
  brief: BriefPayload | undefined | null,
  opts: BriefExtrasOptions = {},
): string {
  const slice = opts.slice ?? "scripting";
  const includeRecentPosts = opts.includeRecentPosts ?? false;
  const parts: string[] = [];
  const audience = extractTargetAudience(`${brief?.adminSummary || ""}\n${brief?.text || ""}`);
  if (audience) {
    parts.push(
      `TARGET AUDIENCE — the "you" in every piece. Speak directly to this person as "you"; never describe them in the third person (no "your founder", "your clients' founders").\n${audience}`,
    );
  }


  if (brief?.adminSummary && brief.adminSummary.trim()) {
    const summary = slice === "scripting"
      ? stripResearchOnlySections(brief.adminSummary.trim())
      : brief.adminSummary.trim();
    parts.push(
      `SESSION BRIEF (APPROVED BY STRATEGIST) — this is the source of truth for this scripting session. Follow every do, don't, and pain-point rule below exactly. It overrides any conflicting guidance elsewhere.\n\n${summary}`,
    );
  }
  // Fall back to the raw brand-brief text if the session brief is not present.
  if (!brief?.adminSummary?.trim() && brief?.text && brief.text.trim()) {
    parts.push(`BRAND BRIEF — additional reference for voice, audience, and angle:\n${brief.text}`);
  }

  if (brief?.recommendedStrategy && brief.recommendedStrategy.trim()) {
    parts.push(
      `RECOMMENDED STRATEGY FOR THIS BRAND — the approved strategic direction for what we publish next. Every hook, script, and caption must align with it.\n\n${brief.recommendedStrategy.trim()}`,
    );
  }

  if (includeRecentPosts && brief?.recentPostsDigest && brief.recentPostsDigest.trim()) {
    parts.push(
      `RECENT POSTS FOR THIS BRAND (most recent first). Do not repeat their topics, hooks, or framings. Use them only to avoid duplication and to keep continuity of voice.\n\n${brief.recentPostsDigest.trim()}`,
    );
  }

  return parts.join("\n\n");
}

/** Pull the target-audience section out of a brief, if one is labelled. */
export function extractTargetAudience(md: string): string {
  if (!md) return "";
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(?:#{1,6}\s*|\*\*)?\s*(?:target\s+)?audience\b[^:\n]*?(?:\*\*)?\s*[:\-–—]?\s*(.*)$/i);
    if (!m) continue;
    const out: string[] = [];
    const first = (m[1] || "").replace(/\*\*/g, "").trim();
    if (first) out.push(first);
    for (let j = i + 1; j < lines.length && out.length < 8; j++) {
      const next = lines[j];
      if (/^\s*#{1,6}\s/.test(next) || /^\s*\*\*[^*]+\*\*\s*:?\s*$/.test(next)) break;
      if (next.trim()) out.push(next.trim());
      else if (out.length) break;
    }
    const text = out.join("\n").trim();
    if (text) return text.slice(0, 800);
  }
  return "";
}
