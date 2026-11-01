export function savedTranscript<T extends { kind: string }>(messages: T[]): T[] {
  return messages.filter((message) => message.kind !== "typing" && message.kind !== "scriptWriting");
}

export function serializeSessionArray(value: unknown, maxLength = 95_000): string {
  const text = JSON.stringify(value ?? []);
  if (text.length > maxLength) throw new Error("This conversation exceeds the session storage limit. Your previous saved conversation has been preserved.");
  return text;
}

/** Serialize writes so an older request cannot overwrite a newer transcript. */
export function createSessionSaveQueue() {
  let tail = Promise.resolve();
  return (save: () => Promise<void>) => {
    const next = tail.catch(() => {}).then(save);
    tail = next;
    return next;
  };
}