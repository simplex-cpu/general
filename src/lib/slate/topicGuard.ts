const INSTRUCTION_VERBS =
  /^(?:turn|share|tell|record|write|post|film|create|make|show|use|try|start|repurpose|document|film|ask|list|describe|explain how you|walk (?:them|us) through|talk about)\b/i;

/** A topic must be a subject worth discussing, not an instruction or content task. */
export function isInstructionTopic(title: string): boolean {
  const t = title.replace(/^["'“\s]+/, "").trim();
  return INSTRUCTION_VERBS.test(t) || /\b(?:your|my) (?:story|experience) (?:of|about|when)\b/i.test(t);
}
