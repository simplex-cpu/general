// Shared AI studio job rules (server watchdog + client actions).
export const WATCHDOG_MS = 10 * 60 * 1000;
// States a user may dismiss/retry; never a normally running job.
export const DISMISSABLE = ["failed", "needs_attention", "submission_uncertain"];
export const canRetry = (status: string) => DISMISSABLE.includes(status);
export const isStale = (status: string, updatedAt: string, now = Date.now()) =>
  ["submitting", "processing", "submission_uncertain"].includes(status) && now - new Date(updatedAt).getTime() > WATCHDOG_MS;
