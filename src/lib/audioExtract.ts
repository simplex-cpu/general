// Browser-side audio extraction. The server runtime has no ffmpeg, so the media
// bytes (mp4 or mp3) are decoded with the Web Audio API and re-encoded to a
// plain mono MP3 the editor can drop straight onto a timeline.

export type ExtractedAudio = { file: File; durationSec: number };

const MAX_SECONDS = 180;

export async function extractAudioFromLink(
  link: string,
  accessCode: string,
): Promise<ExtractedAudio> {
  const res = await fetch("/api/music-extract", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-access-code": accessCode },
    body: JSON.stringify({ url: link }),
  });
  const info: any = await res.json().catch(() => ({}));
  if (!res.ok || !info?.mediaUrl) {
    throw new Error(info?.error || `Could not read that link (${res.status})`);
  }

  const bytesRes = await fetch(
    `/api/music-extract?media=${encodeURIComponent(info.mediaUrl)}`,
    { headers: { "x-access-code": accessCode } },
  );
  if (!bytesRes.ok) {
    const j: any = await bytesRes.json().catch(() => ({}));
    throw new Error(j?.error || "Could not download the audio from that post.");
  }
  const buffer = await bytesRes.arrayBuffer();

  const Ctx: typeof AudioContext =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) throw new Error("This browser cannot process audio. Try Chrome or Safari.");
  const ctx = new Ctx();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(buffer.slice(0));
  } catch {
    throw new Error("The sound on that post could not be read. Try another link.");
  } finally {
    void ctx.close();
  }

  const mp3 = await encodeMp3(decoded, MAX_SECONDS);
  const filename = String(info.filename || "music.mp3");
  return {
    file: new File([mp3], filename, { type: "audio/mpeg" }),
    durationSec: Math.min(decoded.duration, MAX_SECONDS),
  };
}

async function encodeMp3(buffer: AudioBuffer, maxSeconds: number): Promise<Blob> {
  const lame = await import("@breezystack/lamejs");

  const sampleRate = buffer.sampleRate;
  const total = Math.min(buffer.length, Math.floor(sampleRate * maxSeconds));
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;

  const mono = new Int16Array(total);
  for (let i = 0; i < total; i++) {
    const sample = right ? (left[i] + right[i]) / 2 : left[i];
    const clamped = Math.max(-1, Math.min(1, sample));
    mono[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }

  const encoder = new lame.Mp3Encoder(1, sampleRate, 128);
  const chunks: Uint8Array[] = [];
  const BLOCK = 1152;
  for (let i = 0; i < mono.length; i += BLOCK) {
    const slice = mono.subarray(i, Math.min(i + BLOCK, mono.length));
    const encoded = encoder.encodeBuffer(slice);
    if (encoded.length > 0) chunks.push(new Uint8Array(encoded));
  }
  const flushed = encoder.flush();
  if (flushed.length > 0) chunks.push(new Uint8Array(flushed));

  return new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
}
