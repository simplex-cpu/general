// Browser-side direct-to-Drive upload. The server mints a resumable upload
// session; the bytes go straight from the browser to Google, so the ~100MB
// server request-body limit never applies (files up to several GB are fine).

export type DriveUploadResult = { fileId: string; filename: string; contentType: string };

export async function uploadDirectToDrive(
  file: File,
  accessCode: string,
  onProgress?: (pct: number) => void,
): Promise<DriveUploadResult> {
  const contentType = file.type || "application/octet-stream";

  let sessionRes: Response | null = null;
  let sessionData: any = {};
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      sessionRes = await fetch("/api/drive-upload-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({ filename: file.name, contentType }),
      });
      sessionData = await sessionRes.json().catch(() => ({}));
      if (sessionRes.ok && sessionData?.sessionUrl) break;
      if (sessionRes.status < 500 || attempt === 3) {
        throw new Error(sessionData?.error || `Could not start upload (${sessionRes.status})`);
      }
    } catch (error) {
      if (attempt === 3) {
        const message = error instanceof Error ? error.message : "Network connection interrupted";
        throw new Error(`Could not start the upload: ${message}. Please retry.`);
      }
      await new Promise((resolve) => window.setTimeout(resolve, attempt * 1000));
    }
  }
  if (!sessionRes?.ok || !sessionData?.sessionUrl) throw new Error("Could not start the upload after three attempts.");

  const sessionUrl: string = sessionData.sessionUrl;

  // Always relay through our own origin. Browser-to-Google resumable PUTs are
  // intermittently blocked by CORS, privacy extensions and corporate networks.
  const relayUpload = async (): Promise<string> => {
    const CHUNK = 4 * 1024 * 1024;
    const total = file.size;
    let offset = 0;
    while (offset < total) {
      const end = Math.min(offset + CHUNK, total);
      let res: Response | null = null;
      let data: any = {};
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          res = await fetch("/api/drive-upload-chunk", {
            method: "PUT",
            headers: {
              "Content-Type": "application/octet-stream",
              "x-access-code": accessCode,
              "x-session-url": sessionUrl,
              "x-content-range": `bytes ${offset}-${end - 1}/${total}`,
              "x-file-content-type": contentType,
            },
            body: file.slice(offset, end),
          });
          data = await res.json().catch(() => ({}));
          if (res.ok) break;
          if (res.status < 500 || attempt === 3) throw new Error(data?.error || `Upload failed (${res.status})`);
        } catch (error) {
          if (attempt === 3) {
            const message = error instanceof Error ? error.message : "Network connection interrupted";
            throw new Error(`Upload could not continue: ${message}. Please check your connection and retry.`);
          }
          await new Promise((resolve) => window.setTimeout(resolve, attempt * 1000));
        }
      }
      if (!res?.ok) throw new Error(data?.error || "Upload failed after three attempts");
      offset = end;
      onProgress?.(Math.round((offset / total) * 100));
      if (data?.done) return data.fileId as string;
    }
    throw new Error("Upload finished without a Drive file id");
  };

  const fileId = await relayUpload();

  return { fileId, filename: file.name, contentType };
}

