// Lists media inside shared Dropbox / Google Drive folders (up to 3 levels, 200 files).
import { footageLinkKind, isMediaFile, type SourceFile } from "./slate/footageSource";

export class FootageListError extends Error {}

// Dropbox does not allow public listing or per-file links inside someone else's shared folder,
// so folder footage keeps the folder link and transcription needs the file's own "Copy link".
async function dropbox(): Promise<SourceFile[]> {
  throw new FootageListError("For Dropbox folders, open the mixed audio file (e.g. Stereo Mix.wav), click Copy link, and paste it below.");
}

async function drive(url: string): Promise<SourceFile[]> {
  const lovable = process.env.LOVABLE_API_KEY, key = process.env.GOOGLE_DRIVE_API_KEY;
  if (!lovable || !key) throw new FootageListError("Google Drive is not connected.");
  const root = url.match(/folders\/([A-Za-z0-9_-]+)/)?.[1];
  if (!root) throw new FootageListError("That Drive folder link couldn't be read.");
  const out: SourceFile[] = [];
  const walk = async (id: string, path: string, depth: number) => {
    let pageToken = "";
    do {
      const qs = new URLSearchParams({ q: `'${id}' in parents and trashed=false`, fields: "nextPageToken,files(id,name,mimeType,size)", pageSize: "200", supportsAllDrives: "true", includeItemsFromAllDrives: "true" });
      if (pageToken) qs.set("pageToken", pageToken);
      const r = await fetch(`https://connector-gateway.lovable.dev/google_drive/drive/v3/files?${qs}`, { headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": key } });
      const d: any = await r.json().catch(() => ({}));
      if (!r.ok) throw new FootageListError(r.status === 404 ? "This Drive folder isn't shared with view access." : `Drive [${r.status}]: ${JSON.stringify(d).slice(0, 200)}`);
      for (const f of d.files || []) {
        if (f.mimeType === "application/vnd.google-apps.folder" && depth < 3) await walk(f.id, `${path}/${f.name}`, depth + 1);
        else if (isMediaFile(f.name) && out.length < 200) out.push({ name: f.name, path: `${path}/${f.name}`, size: Number(f.size || 0), url: `https://drive.google.com/uc?export=download&id=${f.id}` });
      }
      pageToken = d.nextPageToken || "";
    } while (pageToken);
  };
  await walk(root, "", 0);
  if (!out.length) throw new FootageListError("No audio or video files were found. Make sure the folder is shared with view access.");
  return out;
}

export async function listFootageFolder(url: string): Promise<SourceFile[]> {
  const kind = footageLinkKind(url);
  if (kind === "dropbox-folder") return dropbox();
  if (kind === "drive-folder") return drive(url);
  throw new FootageListError("Not a folder link.");
}

export function resolveTranscriptionUrl(fileUrl: string) {
  if (/dropbox\.com/i.test(fileUrl)) {
    if (/\/scl\/fo\//i.test(fileUrl)) throw new Error("That is a Dropbox folder link. Paste the link to the audio file itself.");
    return /[?&]dl=\d/.test(fileUrl) ? fileUrl.replace(/([?&])dl=\d/, "$1dl=1") : `${fileUrl}${fileUrl.includes("?") ? "&" : "?"}dl=1`;
  }
  return fileUrl;
}
