export function hasSelectedWriterFormat(format?: string | null): boolean {
  return ["broll", "talkingVideo", "carousel", "graphic"].includes(format || "");
}

/** One create request per session start, even when several steps start together. */
export function createSessionStarter<T>(create: () => Promise<T>) {
  let pending: Promise<T> | undefined;
  return () => {
    if (!pending) {
      pending = create().catch((error) => {
        pending = undefined;
        throw error;
      });
    }
    return pending;
  };
}