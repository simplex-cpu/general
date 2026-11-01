// Rules for handing a talking video to the AI avatar. Shared by
// /api/send-to-avatar and its tests.
import { CONTENT_SCRIPT_FIELDS, isTalking } from "./contentScriptFields";

/** Client Status that the n8n avatar workflow picks up. */
export const AVATAR_STATUS = "To Avatar";

/** Why this post can't go to the avatar yet, or null when it can. */
export function avatarBlocker(fields: Record<string, unknown>): string | null {
  if (!isTalking(String(fields["Post Type"] || ""))) return "Only talking videos can be sent to the avatar.";
  if (!String(fields[CONTENT_SCRIPT_FIELDS.script] || "").trim()) return "Add the script before sending this to the avatar.";
  if (String(fields["Client Status"] || "").trim().toLowerCase() === AVATAR_STATUS.toLowerCase()) return "This video is already with the avatar.";
  return null;
}
