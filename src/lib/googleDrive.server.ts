const GATEWAY = "https://connector-gateway.lovable.dev";

export async function uploadToDrive(opts: {
  bytes: Uint8Array;
  filename: string;
  contentType: string;
  folderId: string;
}): Promise<{ id: string; url: string; filename: string }> {
  const lovable = process.env.LOVABLE_API_KEY;
  const gdrive = process.env.GOOGLE_DRIVE_API_KEY;
  if (!lovable || !gdrive) throw new Error("Google Drive connector not configured");

  const boundary = "----lovable-" + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36));
  const meta = JSON.stringify({ name: opts.filename, parents: [opts.folderId] });
  const enc = new TextEncoder();
  const head = enc.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
      `--${boundary}\r\nContent-Type: ${opts.contentType}\r\n\r\n`,
  );
  const tail = enc.encode(`\r\n--${boundary}--\r\n`);
  const body = new Uint8Array(head.length + opts.bytes.length + tail.length);
  body.set(head, 0);
  body.set(opts.bytes, head.length);
  body.set(tail, head.length + opts.bytes.length);

  const res = await fetch(
    `${GATEWAY}/google_drive/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovable}`,
        "X-Connection-Api-Key": gdrive,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  if (!res.ok) {
    throw new Error(`Drive upload failed [${res.status}]: ${(await res.text()).slice(0, 500)}`);
  }
  const created = (await res.json()) as { id: string; name?: string };

  // Make link-accessible so Airtable can fetch it and users can preview.
  const permRes = await fetch(
    `${GATEWAY}/google_drive/drive/v3/files/${created.id}/permissions?supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovable}`,
        "X-Connection-Api-Key": gdrive,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    },
  );
  if (!permRes.ok) {
    throw new Error(
      `Drive permission failed [${permRes.status}]: ${(await permRes.text()).slice(0, 500)}`,
    );
  }

  // Direct-download URL — Airtable can fetch from this to create an attachment,
  // and browsers can preview it for images/videos.
  const url = `https://drive.google.com/uc?export=download&id=${created.id}`;
  return { id: created.id, url, filename: created.name || opts.filename };
}

/**
 * Create a Google Drive resumable upload session. The returned URL is a
 * pre-authorized googleapis.com URL the browser can PUT the file bytes to
 * directly, bypassing the ~100MB server request-body limit.
 */
export async function createResumableSession(opts: {
  filename: string;
  contentType: string;
  folderId: string;
  origin?: string;
}): Promise<string> {
  const lovable = process.env.LOVABLE_API_KEY;
  const gdrive = process.env.GOOGLE_DRIVE_API_KEY;
  if (!lovable || !gdrive) throw new Error("Google Drive connector not configured");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${lovable}`,
    "X-Connection-Api-Key": gdrive,
    "Content-Type": "application/json",
    "X-Upload-Content-Type": opts.contentType,
  };
  // Google only returns CORS headers on the resumable session when the
  // session was created with the browser's Origin.
  if (opts.origin) headers["Origin"] = opts.origin;

  const res = await fetch(
    `${GATEWAY}/google_drive/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ name: opts.filename, parents: [opts.folderId] }),
    },
  );
  const location = res.headers.get("location");
  if (!res.ok || !location) {
    throw new Error(`Drive session failed [${res.status}]: ${(await res.text()).slice(0, 300)}`);
  }
  return location;
}

/** Make an uploaded Drive file link-readable and return its shareable URLs. */
export async function finalizeDriveFile(
  fileId: string,
): Promise<{ id: string; url: string; filename: string }> {
  const lovable = process.env.LOVABLE_API_KEY;
  const gdrive = process.env.GOOGLE_DRIVE_API_KEY;
  if (!lovable || !gdrive) throw new Error("Google Drive connector not configured");
  const headers = {
    Authorization: `Bearer ${lovable}`,
    "X-Connection-Api-Key": gdrive,
    "Content-Type": "application/json",
  };
  const permRes = await fetch(
    `${GATEWAY}/google_drive/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`,
    { method: "POST", headers, body: JSON.stringify({ role: "reader", type: "anyone" }) },
  );
  if (!permRes.ok) {
    throw new Error(
      `Drive permission failed [${permRes.status}]: ${(await permRes.text()).slice(0, 300)}`,
    );
  }
  const metaRes = await fetch(
    `${GATEWAY}/google_drive/drive/v3/files/${fileId}?fields=id,name&supportsAllDrives=true`,
    { headers },
  );
  const meta: any = await metaRes.json().catch(() => ({}));
  return {
    id: fileId,
    url: `https://drive.google.com/uc?export=download&id=${fileId}`,
    filename: meta?.name || "file",
  };
}

function driveHeaders() {
  const lovable = process.env.LOVABLE_API_KEY;
  const gdrive = process.env.GOOGLE_DRIVE_API_KEY;
  if (!lovable || !gdrive) throw new Error("Google Drive connector not configured");
  return {
    Authorization: `Bearer ${lovable}`,
    "X-Connection-Api-Key": gdrive,
    "Content-Type": "application/json",
  };
}

/** Create a link-readable Drive folder and return its id + shareable folder URL. */
export async function createDriveFolder(
  name: string,
  parentId: string,
): Promise<{ id: string; url: string }> {
  const headers = driveHeaders();
  const res = await fetch(
    `${GATEWAY}/google_drive/drive/v3/files?supportsAllDrives=true&fields=id`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      }),
    },
  );
  if (!res.ok) {
    throw new Error(
      `Drive folder create failed [${res.status}]: ${(await res.text()).slice(0, 300)}`,
    );
  }
  const created = (await res.json()) as { id: string };
  const permRes = await fetch(
    `${GATEWAY}/google_drive/drive/v3/files/${created.id}/permissions?supportsAllDrives=true`,
    { method: "POST", headers, body: JSON.stringify({ role: "reader", type: "anyone" }) },
  );
  if (!permRes.ok) {
    throw new Error(
      `Drive folder share failed [${permRes.status}]: ${(await permRes.text()).slice(0, 300)}`,
    );
  }
  return { id: created.id, url: `https://drive.google.com/drive/folders/${created.id}` };
}

/** Move a Drive file into the given folder (removing its previous parents). */
export async function moveDriveFile(fileId: string, folderId: string): Promise<void> {
  const headers = driveHeaders();
  const metaRes = await fetch(
    `${GATEWAY}/google_drive/drive/v3/files/${fileId}?fields=parents&supportsAllDrives=true`,
    { headers },
  );
  const meta: any = await metaRes.json().catch(() => ({}));
  const previous = Array.isArray(meta?.parents) ? meta.parents.join(",") : "";
  const qs = new URLSearchParams({ supportsAllDrives: "true", addParents: folderId });
  if (previous) qs.set("removeParents", previous);
  const res = await fetch(`${GATEWAY}/google_drive/drive/v3/files/${fileId}?${qs.toString()}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    throw new Error(`Drive move failed [${res.status}]: ${(await res.text()).slice(0, 300)}`);
  }
}

/** Drive id inside a share link, when the link is a Drive link at all. */
export function driveIdFromLink(link: string): string | null {
  const s = (link || "").trim();
  if (!/drive\.google\.com|docs\.google\.com/i.test(s)) return null;
  const m =
    s.match(/\/(?:folders|d)\/([A-Za-z0-9_-]{10,})/) ||
    s.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  return m ? m[1] : null;
}

/**
 * Can we open this Drive link, and does it actually hold files? Used to stop an
 * edit request going out with a private or empty footage folder.
 */
export async function inspectDriveLink(link: string): Promise<{
  status: "ok" | "empty" | "unreachable" | "unknown";
  fileCount: number;
  name?: string;
}> {
  const id = driveIdFromLink(link);
  if (!id) return { status: "unknown", fileCount: 0 };
  let headers: Record<string, string>;
  try {
    headers = driveHeaders();
  } catch {
    return { status: "unknown", fileCount: 0 };
  }
  const metaRes = await fetch(
    `${GATEWAY}/google_drive/drive/v3/files/${id}?supportsAllDrives=true&fields=id,name,mimeType,size`,
    { headers },
  );
  if (!metaRes.ok) return { status: "unreachable", fileCount: 0 };
  const meta: any = await metaRes.json().catch(() => ({}));
  const isFolder = meta?.mimeType === "application/vnd.google-apps.folder";
  if (!isFolder) return { status: "ok", fileCount: 1, name: meta?.name };

  const qs = new URLSearchParams({
    q: `'${id}' in parents and trashed = false`,
    pageSize: "100",
    fields: "files(id,name)",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const listRes = await fetch(`${GATEWAY}/google_drive/drive/v3/files?${qs.toString()}`, {
    headers,
  });
  if (!listRes.ok) return { status: "unreachable", fileCount: 0 };
  const list: any = await listRes.json().catch(() => ({}));
  const count = Array.isArray(list?.files) ? list.files.length : 0;
  return { status: count > 0 ? "ok" : "empty", fileCount: count, name: meta?.name };
}
