# Services Hero — Video Clips

Drop your MP4 clips here to activate the floating video cards on the Services page hero.

## File names (exact)

| Slot | File | Card shows |
|------|------|------------|
| 1 | `clip-1.mp4` | Skincare / serum social post |
| 2 | `clip-2.mp4` | Real-estate "Dream Home" ad |
| 3 | `clip-3.mp4` | Podcast / content social card |
| 4 | `clip-4.mp4` | Product lifestyle photography |
| 5 | `clip-5.mp4` | Brand strategy marketing card |

## Behaviour without clips

Until a clip file is uploaded the card shows its **poster image** (e.g. `poster-1.webp`).
The hero looks identical to the static-picture version — no broken video icons, no errors.

## Recommended clip specs

- **Format**: H.264 MP4 (widest browser support) or VP9 WebM
- **Duration**: 6–15 s loop (seamless loop preferred)
- **Resolution**: 600–900 px wide, any height matching the poster aspect ratio
- **File size**: < 3 MB per clip
- **Audio**: none (cards are always muted)

## Poster images (already generated)

`poster-1.webp … poster-5.webp` — cropped from the designs-collage source image.
`poster-1.jpg  … poster-5.jpg`  — JPEG fallback for older browsers.

Do **not** delete the poster files — they are the fallback when no clip is present,
and they are also shown on mobile (video autoplay is disabled there to save data).

## Play / pause behaviour

- **Desktop**: videos autoplay when the hero scrolls into the viewport,
  pause automatically when the user scrolls away (saves CPU / battery).
- **Mobile (< 768 px)**: poster images only — no video element is rendered.
