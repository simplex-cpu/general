import type { AccessRecord } from "./accessCode.server";
import type { PostRow } from "./posts.server";
import { readLinkedPlannerCopy } from "./postCopy.server";
import { transcribe, readSlideText } from "./postTagging.server";
import { readVideoText } from "./inspoRead.server";
import { mergePostCopy, readPostCopy, hashtagsFromCaption, hookFromVideoText, looksLikeSceneDescription } from "./slate/postCopy";
import { serializePublishedSlides } from "./slate/slideFields";
import { normalizeFormat } from "./slate/postMetrics";
import type { ScrapedMedia } from "./slate/statsRefresh";

export async function minePostCopy(access: AccessRecord, token: string, row: PostRow, media?: ScrapedMedia) {
  const saved = readPostCopy(row.fields);
  if (looksLikeSceneDescription(saved.visualHook)) saved.visualHook = "";
  // Old mining saved only slide one. Do not mistake that legacy field for complete slides.
  if (row.fields["Copy Status"] !== "Complete" && !/^Slide 1\s*\n/m.test(saved.slideCopy)) saved.slideCopy = "";
  let copy = mergePostCopy(saved, await readLinkedPlannerCopy(access, token, row));
  const format = normalizeFormat(String(row.fields.Format || ""));
  const errors: string[] = [];
  if (media) {
    copy = mergePostCopy(copy, { caption: media.caption, hashtags: hashtagsFromCaption(media.caption) });
    if (media.mediaType === "video") {
      if (!copy.transcript && format !== "Broll") try { copy.transcript = await transcribe(media.videoUrl); } catch { errors.push("The video audio could not be transcribed."); }
      if (!copy.visualHook || (format === "Broll" && !copy.textOnScreen)) try {
        const raw = await readVideoText(media.videoUrl);
        copy = mergePostCopy(copy, hookFromVideoText(raw));
      } catch (e) { errors.push(e instanceof Error ? e.message : "The video text could not be read."); }
    } else if ((format === "Carousel" && (!copy.slideCopy || !copy.coverCopy)) || (format !== "Carousel" && (!copy.textOnScreen || !copy.coverCopy))) {
      const slides = [];
      for (const url of media.imageUrls) {
        const text = await readSlideText(url);
        if (!text) { errors.push("A slide image could not be read; complete slide copy was not saved."); break; }
        const lines = text.split("\n");
        slides.push({ title: lines[0] || "", subtitle: "", body: lines.slice(1).join("\n") });
      }
      if (slides.length && slides.length === media.imageUrls.length) {
        const first = slides[0];
        copy = mergePostCopy(copy, { slideCopy: format === "Carousel" ? serializePublishedSlides(slides) : "", textOnScreen: format !== "Carousel" ? [first.title, first.body].filter(Boolean).join("\n") : "", coverTitle: first.title, coverCopy: [first.title, first.body].filter(Boolean).join("\n") });
      }
    }
  }
  if (!copy.hashtags) copy.hashtags = hashtagsFromCaption(copy.caption);
  if (!copy.hook) copy.hook = copy.coverTitle || copy.textOnScreen.split("\n")[0] || copy.transcript.split(/(?<=[.!?])\s/)[0] || "";
  const complete = !!copy.caption && (format === "Carousel" ? !!copy.slideCopy && !!copy.coverCopy : format === "Graphic" ? !!copy.textOnScreen : format === "Broll" ? !!copy.textOnScreen : !!copy.transcript && !!copy.visualHook);
  if (!complete && !errors.length) errors.push("Some original post copy is unavailable; it remains marked incomplete.");
  return { copy, status: complete && !errors.length ? "Complete" : "Partial", errors };
}