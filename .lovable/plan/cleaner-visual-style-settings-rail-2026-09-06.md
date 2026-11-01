# Cleaner Visual style settings rail

## Goal
Make the Visual style settings column calmer, better organised, and easier to read, and rename two labels.

## New structure of the settings rail

Two collapsible groups, each with clear sub-sections:

```text
VIDEO SETTINGS
  Font style
    Visual Hook        (font picker)
    Transcription      (font picker)
  Font colour
    Visual Hook        (colour + optional backing)
    Transcription      (colour + optional backing)

GRAPHIC SETTINGS
  Backgrounds
    Cover background
    Slides background
  Font colour
    Title
    Subtitle
    Body text
```

- Groups open by default, can be collapsed to reduce noise.
- The "Save changes" button stays pinned at the bottom of the rail.

## Visual clean-up
- One consistent field style: label above, single rounded input row, no double borders.
- Colour swatch, hex field, and the "no backing" option combined into one compact row instead of stacked controls.
- Remove the per-field helper texts under the font pickers; the group headings carry the meaning.
- Slightly wider rail with more breathing room between fields, quieter section headings, subtle dividers between groups only.

## Renames
- "Hook style" / "Hook colour" / "Hook backing" -> Visual Hook
- "Caption style" / "Caption colour" / "Caption backing" -> Transcription
- Preview buttons follow: "Preview hook" -> "Preview Visual Hook", "Preview captions" -> "Preview Transcription".
- Sample text labels in the preview follow the same wording.

## Technical details
- Changes are confined to `src/components/slate/VisualStylePanel.tsx` (rail markup, new `Group`/`SubSection` helpers, reworked `ColorField`) and label strings in `src/components/slate/StylePhonePreview.tsx`.
- Underlying saved field keys stay exactly as they are, so nothing breaks in saving or reloading.
