// Footage links: folders keep the original link as stored footage; transcription uses one audio/video file inside.
export type SourceFile = { name: string; path: string; size: number; url: string };
const AUDIO = /\.(wav|mp3|m4a|aac|flac|aiff?)$/i;
const VIDEO = /\.(mp4|mov|m4v|mkv|webm)$/i;

export function footageLinkKind(url: string): 'youtube' | 'dropbox-folder' | 'drive-folder' | 'file' {
  if (/youtu\.?be/i.test(url)) return 'youtube';
  if (/dropbox\.com\/(scl\/fo|sh)\//i.test(url)) return 'dropbox-folder';
  if (/drive\.google\.com\/(drive\/)?(u\/\d+\/)?folders\//i.test(url)) return 'drive-folder';
  return 'file';
}
export const isFolderLink = (url: string) => footageLinkKind(url).endsWith('folder');

/** Mixed audio first, else largest audio, else smallest video. Warns when only per-person tracks exist. */
export function pickTranscriptionFile(files: SourceFile[]): { file: SourceFile | null; warning?: string } {
  const audio = files.filter((f) => AUDIO.test(f.name));
  const mix = audio.find((f) => /mix|program|master|combined/i.test(f.name));
  if (mix) return { file: mix };
  if (audio.length) {
    const largest = [...audio].sort((a, b) => b.size - a.size)[0];
    return { file: largest, warning: audio.length > 1 ? 'No mixed track found. Separate tracks may only contain one speaker; choose the file with every voice.' : undefined };
  }
  const video = files.filter((f) => VIDEO.test(f.name)).sort((a, b) => a.size - b.size);
  if (video.length) return { file: video[0], warning: video[0].size > 20e9 ? 'Only very large camera files were found. Ask for a mixed audio file for faster, more reliable transcription.' : undefined };
  return { file: null, warning: 'No audio or video files were found in this folder.' };
}
export const isMediaFile = (name: string) => AUDIO.test(name) || VIDEO.test(name);
export const COPY_LIMIT_BYTES = 5e9;
