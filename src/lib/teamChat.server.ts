// Server-only helpers for the "Ask the team" chat (one shared room per client).
export const CHAT_BASE = "appf1QABtQbAENYDz";
export const T_CHAT = "tblRR82prmL9pbBuX"; // Client Chat

export const F_MESSAGE = "Message";
export const F_SENDER = "Sender";
export const F_USER = "User";
export const F_REPLY = "Reply To";
export const F_REACTIONS = "Reactions";

export type ChatSender = "me" | "strategist" | "creative";

export type ChatMessage = {
  id: string;
  text: string;
  sender: ChatSender;
  createdAt: string;
  replyToId: string | null;
  /** emoji -> list of voices that reacted ("me" | "strategist" | "creative") */
  reactions: Record<string, string[]>;
  userIds: string[];
};

function mapSender(raw: unknown): ChatSender {
  const s = String(raw || "").toLowerCase();
  if (s.includes("strateg")) return "strategist";
  if (s.includes("creative")) return "creative";
  return "me";
}

export function parseReactions(raw: unknown): Record<string, string[]> {
  if (!raw) return {};
  try {
    const v = JSON.parse(String(raw));
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const out: Record<string, string[]> = {};
    for (const [k, list] of Object.entries(v as Record<string, unknown>)) {
      if (Array.isArray(list)) out[k] = list.map((x) => String(x)).filter(Boolean);
    }
    return out;
  } catch {
    return {};
  }
}

export function mapChatRecord(rec: any): ChatMessage {
  const f = rec?.fields || {};
  const link = f[F_REPLY];
  const users = f[F_USER];
  return {
    id: String(rec?.id || ""),
    text: String(f[F_MESSAGE] || ""),
    sender: mapSender(f[F_SENDER]),
    createdAt: String(rec?.createdTime || ""),
    replyToId: Array.isArray(link) && typeof link[0] === "string" ? link[0] : null,
    reactions: parseReactions(f[F_REACTIONS]),
    userIds: Array.isArray(users) ? users.filter((u: unknown) => typeof u === "string") : [],
  };
}
