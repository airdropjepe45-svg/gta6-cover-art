[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/airdropjepe45-svg/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/airdropjepe45-svg/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# VICE COVER — GTA 6-style cover art maker

An offline web app that turns your own photo and a caption into GTA 6-style cover art: a multi-panel Vice City poster with bold display lettering and heavy, poster-strength colour grades — each panel can even carry its own grade — exported as a PNG to share. Built by an AI agent for make.fun's [gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01) bounty.

Open `app/index.html` in desktop Chrome (or run `node serve.ts` and open http://localhost:8080). No build step, no network — everything loads from local files, and your photos never leave your machine.

## How it works

1. **Add photos** — upload your own photos (or tap a built-in sample: Boulevard, Pier). Photos are read locally with FileReader and never uploaded anywhere.
2. **Pick a layout** — 1 full-bleed panel, 2 side-by-side, 3 panels, or a 4-panel grid. Click a panel to select it, then click a photo to fill it — or fill all panels with one photo. The **Panels** section has per-panel controls: a panel picker (one button per panel), a **Panel grade** dropdown to override the cover grade for just that panel, and a **Use selected photo for this panel** button that drops the selected photo into the selected panel. The selected panel is marked in the preview with a solid bright-pink outline and a white outer line.
3. **Crop each photo** — drag to pan, scroll to zoom (1x–3x), or use the zoom slider and Reset crop.
4. **Write the caption** — big bold Anton lettering with size, position (top/bottom/center), outline, drop shadow, gradient fill and uppercase options.
5. **Pick a grade** — Sunset, Neon Nights, Vice Teal or Mono colour grades, applied to preview and export alike. The grades are deliberately heavy, so a photo reads as a poster, not a daylight snapshot: each one first re-grades the photo itself (a canvas filter) and then lays deep translucent colour washes over the panel, finished with a strong vignette. **Sunset** pushes saturation and a sepia warmth, then washes the panel twice — a warm orange-pink-purple tint pass plus an overlay pass for punch, with a hot pink glow at the bottom. **Neon Nights** cranks saturation to 1.7 and soaks the panel in magenta and cyan. **Vice Teal** cools everything into deep teal water and dark blue shadow. **Mono** strips the colour and crushes the contrast for a hard black-and-white look. Any single panel can break away from the cover grade with its own **Panel grade** override (section 2); leave it on “Cover grade” to follow the grade picked here.
6. **Export** — one click downloads a PNG at 1080x1080, 1080x1350 or 1920x1080, exactly as the live preview shows it.

## Notes

- Original design: no Rockstar Games logo, wordmark, official artwork, character or game font. The display font is Anton (SIL Open Font License, vendored under `app/fonts/` with its license text). The two sample photos under `app/samples/` were made with an image model for make.fun and are free to use.
- Fully offline: the app loads no network resources at all — every script, image and font is a file under `app/`.
