// Draws the whole cover and exports it as a PNG. drawCoverArt renders the state
// (panels, photos, caption, grade) onto any canvas at any size, so the preview
// and the exported file are the same composition.

import { layoutPanelRects, panelGapFor } from './panels.js';
import { applyGradeOverlayToRect, drawVignette, gradePhotoFilter } from './grades.js';
import { effectiveGrade } from './editor.js';

export const EXPORT_SIZES = [
  { id: '1080x1080', label: '1080 × 1080', width: 1080, height: 1080 },
  { id: '1080x1350', label: '1080 × 1350', width: 1080, height: 1350 },
  { id: '1920x1080', label: '1920 × 1080', width: 1920, height: 1080 },
];

/** Finds an export size by its id, defaulting to the square one. */
export function exportSizeById(id) {
  return EXPORT_SIZES.find((s) => s.id === id) ?? EXPORT_SIZES[0];
}

/** Draws the full cover for `state` onto `canvas` (resized to `width` x `height` first). */
export function drawCoverArt(canvas, state, width, height) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0d0714';
  ctx.fillRect(0, 0, width, height);
  const gap = panelGapFor(width, height);
  const rects = layoutPanelRects(state.layout, width, height, gap);
  for (let i = 0; i < rects.length; i += 1) {
    drawPanelPhoto(ctx, rects[i], state, i);
  }
  // Each panel gets its own grade wash, clipped to its rect (a panel override
  // wins over the cover grade). No full-cover wash here — that would double
  // the grading on every panel.
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    applyGradeOverlayToRect(ctx, effectiveGrade(state, i), r.x, r.y, r.w, r.h);
  }
  drawPanelSeparators(ctx, rects, width, height);
  drawVignette(ctx, width, height);
  drawCaption(ctx, state.caption, width, height);
  return rects;
}

/** Draws one panel's photo, cover-fit, with that panel's pan and zoom applied. */
export function drawPanelPhoto(ctx, rect, state, panelIndex) {
  const photoId = state.assignments[panelIndex];
  const photo = state.photos.find((p) => p.id === photoId) ?? null;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!photo) {
    drawEmptyPanel(ctx, rect, panelIndex);
    ctx.restore();
    return;
  }
  const img = photo.img;
  const transform = state.transforms[panelIndex] ?? { zoom: 1, dx: 0, dy: 0 };
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * transform.zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const cx = rect.x + rect.w / 2 + transform.dx;
  const cy = rect.y + rect.h / 2 + transform.dy;
  const filter = gradePhotoFilter(effectiveGrade(state, panelIndex));
  if (filter) ctx.filter = filter;
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.filter = 'none';
  const sheen = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
  sheen.addColorStop(0.4, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Placeholder pattern for a panel with no photo yet. */
export function drawEmptyPanel(ctx, rect, panelIndex) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, '#2a1740');
  grad.addColorStop(1, '#160b24');
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(255, 179, 71, 0.55)';
  ctx.lineWidth = Math.max(2, rect.w * 0.004);
  ctx.setLineDash([14, 10]);
  ctx.strokeRect(rect.x + 10, rect.y + 10, rect.w - 20, rect.h - 20);
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(245, 238, 247, 0.75)';
  let size = Math.min(rect.w, rect.h) * 0.09;
  const label = `Panel ${panelIndex + 1} — add a photo`;
  ctx.font = `${size}px system-ui, sans-serif`;
  while (ctx.measureText(label).width > rect.w * 0.86 && size > 10) {
    size -= 2;
    ctx.font = `${size}px system-ui, sans-serif`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

/** Thin dark frame lines around the panels and the cover edge. */
export function drawPanelSeparators(ctx, rects, width, height) {
  ctx.save();
  ctx.strokeStyle = '#0d0714';
  ctx.lineWidth = Math.max(2, Math.min(width, height) * 0.006);
  for (const r of rects) {
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  }
  ctx.strokeRect(0, 0, width, height);
  ctx.restore();
}

/** Draws the caption in big bold Anton lettering with the chosen effects. */
export function drawCaption(ctx, caption, width, height) {
  let text = (caption.text ?? '').trim();
  if (!text) return;
  if (caption.uppercase) text = text.toUpperCase();
  let size = height * 0.115 * ((caption.sizePct ?? 100) / 100);
  const maxWidth = width * 0.92;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontFor = (s) => `${s}px Anton, 'Arial Narrow', sans-serif`;
  ctx.font = fontFor(size);
  while (ctx.measureText(text).width > maxWidth && size > 16) {
    size -= 2;
    ctx.font = fontFor(size);
  }
  const y = caption.position === 'top'
    ? height * 0.11
    : caption.position === 'center'
      ? height * 0.5
      : height * 0.89;
  ctx.save();
  ctx.translate(width / 2, y);
  ctx.rotate(-0.035);
  if (caption.shadow) {
    ctx.shadowColor = 'rgba(10, 2, 18, 0.85)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetX = size * 0.045;
    ctx.shadowOffsetY = size * 0.06;
  }
  if (caption.gradient) {
    const fill = ctx.createLinearGradient(0, -size * 0.55, 0, size * 0.55);
    fill.addColorStop(0, '#ffe259');
    fill.addColorStop(0.45, '#ff7a3d');
    fill.addColorStop(1, '#ff2e88');
    ctx.fillStyle = fill;
  } else {
    ctx.fillStyle = '#ffffff';
  }
  if (caption.outline) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeStyle = '#160826';
    ctx.strokeText(text, 0, 0);
  }
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** Renders the cover at `size` and downloads it as a PNG file. Resolves to the file name. */
export function exportCoverPng(state, size) {
  const offscreen = document.createElement('canvas');
  drawCoverArt(offscreen, state, size.width, size.height);
  return new Promise((resolve, reject) => {
    offscreen.toBlob((blob) => {
      if (!blob) {
        reject(new Error('The browser could not make the PNG.'));
        return;
      }
      const fileName = `vice-cover-${size.width}x${size.height}.png`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve(fileName);
    }, 'image/png');
  });
}
