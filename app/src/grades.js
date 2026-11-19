// Colour grades: named presets applied to the photos themselves (via a
// ctx.filter) and as colour washes on top of the panels (under the caption,
// so the lettering stays crisp). The grades are deliberately heavy — a
// lightly graded photo reads as a daylight snapshot, not a poster — so each
// grade pushes saturation and contrast hard and lays a deep translucent wash
// over the panel.

export const GRADES = [
  { id: 'sunset', name: 'Sunset', hint: 'Heavy warm orange and pink, like a Vice City evening.' },
  { id: 'neon', name: 'Neon Nights', hint: 'Soaked magenta and cyan neon glow.' },
  { id: 'teal', name: 'Vice Teal', hint: 'Deep cool teal water and dark blue shadow.' },
  { id: 'mono', name: 'Mono', hint: 'Black and white with hard, crushed contrast.' },
];

/** True when the grade id is one this module knows. */
export function isGradeId(id) {
  return GRADES.some((g) => g.id === id);
}

/**
 * A ctx.filter string that grades the photo itself as it is drawn.
 * Returns '' for unknown ids (no grading).
 */
export function gradePhotoFilter(gradeId) {
  if (gradeId === 'sunset') return 'saturate(1.4) contrast(1.18) sepia(0.32) brightness(1.04)';
  if (gradeId === 'neon') return 'saturate(1.7) contrast(1.22)';
  if (gradeId === 'teal') return 'saturate(1.4) contrast(1.15)';
  if (gradeId === 'mono') return 'grayscale(1) contrast(1.28) brightness(1.05)';
  return '';
}

/** Applies the grade's colour washes and vignette to `ctx` over a cover of width `w` and height `h`. */
export function applyGradeOverlay(ctx, gradeId, w, h) {
  applyGradeOverlayToRect(ctx, gradeId, 0, 0, w, h);
}

/**
 * Same washes as applyGradeOverlay, but clipped to the rect (x, y, w, h) —
 * used to grade one panel on its own. The vignette is drawn inside the rect
 * too, so each panel's edges darken a little.
 */
export function applyGradeOverlayToRect(ctx, gradeId, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (gradeId === 'sunset') {
    // Deep warm orange-pink-purple wash, laid down twice: once as a 'color'
    // pass that re-tints the photo, once as an 'overlay' pass for punch.
    const tint = ctx.createLinearGradient(x, y, x + w, y + h);
    tint.addColorStop(0, 'rgba(255, 122, 61, 0.42)');
    tint.addColorStop(0.55, 'rgba(255, 46, 136, 0.30)');
    tint.addColorStop(1, 'rgba(122, 30, 110, 0.52)');
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = tint;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = tint;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const low = ctx.createLinearGradient(x, y + h * 0.45, x, y + h);
    low.addColorStop(0, 'rgba(255, 90, 60, 0)');
    low.addColorStop(1, 'rgba(255, 46, 136, 0.58)');
    ctx.fillStyle = low;
    ctx.fillRect(x, y, w, h);
  } else if (gradeId === 'neon') {
    const wash = ctx.createLinearGradient(x, y, x + w, y + h);
    wash.addColorStop(0, 'rgba(255, 0, 200, 0.62)');
    wash.addColorStop(0.5, 'rgba(120, 0, 255, 0.26)');
    wash.addColorStop(1, 'rgba(0, 229, 255, 0.62)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const glow = ctx.createLinearGradient(x, y + h, x, y);
    glow.addColorStop(0, 'rgba(0, 229, 255, 0.36)');
    glow.addColorStop(1, 'rgba(255, 0, 200, 0.22)');
    ctx.fillStyle = glow;
    ctx.fillRect(x, y, w, h);
  } else if (gradeId === 'teal') {
    const wash = ctx.createLinearGradient(x, y, x + w, y + h);
    wash.addColorStop(0, 'rgba(25, 194, 184, 0.52)');
    wash.addColorStop(0.6, 'rgba(10, 77, 110, 0.32)');
    wash.addColorStop(1, 'rgba(4, 24, 60, 0.60)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const cool = ctx.createLinearGradient(x, y, x, y + h);
    cool.addColorStop(0, 'rgba(25, 194, 184, 0.24)');
    cool.addColorStop(1, 'rgba(4, 24, 60, 0.42)');
    ctx.fillStyle = cool;
    ctx.fillRect(x, y, w, h);
  } else if (gradeId === 'mono') {
    const shade = ctx.createLinearGradient(x, y, x, y + h);
    shade.addColorStop(0, 'rgba(0, 0, 0, 0.20)');
    shade.addColorStop(1, 'rgba(0, 0, 0, 0.58)');
    ctx.fillStyle = shade;
    ctx.fillRect(x, y, w, h);
  }
  drawVignetteInRect(ctx, x, y, w, h);
  ctx.restore();
}

/** Darkens the corners and edges a little so the caption pops. */
export function drawVignette(ctx, w, h) {
  drawVignetteInRect(ctx, 0, 0, w, h);
}

/** The vignette, clipped to the rect (x, y, w, h). */
export function drawVignetteInRect(ctx, x, y, w, h) {
  const radius = Math.hypot(w, h) / 2;
  const glow = ctx.createRadialGradient(x + w / 2, y + h / 2, radius * 0.45, x + w / 2, y + h / 2, radius);
  glow.addColorStop(0, 'rgba(0, 0, 0, 0)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
}
