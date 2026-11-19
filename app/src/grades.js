// Colour grades: named presets applied as overlays on top of the panels (and under
// the caption, so the lettering stays crisp). Each grade lists translucent colour
// washes drawn with a blend mode, plus a warm or cool vignette.

export const GRADES = [
  { id: 'sunset', name: 'Sunset', hint: 'Warm orange and pink, like a Vice City evening.' },
  { id: 'neon', name: 'Neon Nights', hint: 'Magenta and cyan neon glow.' },
  { id: 'teal', name: 'Vice Teal', hint: 'Cool teal water and deep blue shadow.' },
  { id: 'mono', name: 'Mono', hint: 'Black and white with hard contrast.' },
];

/** True when the grade id is one this module knows. */
export function isGradeId(id) {
  return GRADES.some((g) => g.id === id);
}

/** Applies the grade's colour washes and vignette to `ctx` over a cover of width `w` and height `h`. */
export function applyGradeOverlay(ctx, gradeId, w, h) {
  ctx.save();
  if (gradeId === 'sunset') {
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, 'rgba(255, 122, 61, 0.20)');
    wash.addColorStop(0.55, 'rgba(255, 46, 136, 0.10)');
    wash.addColorStop(1, 'rgba(122, 30, 110, 0.28)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const low = ctx.createLinearGradient(0, h * 0.45, 0, h);
    low.addColorStop(0, 'rgba(255, 90, 60, 0)');
    low.addColorStop(1, 'rgba(255, 46, 136, 0.30)');
    ctx.fillStyle = low;
    ctx.fillRect(0, 0, w, h);
  } else if (gradeId === 'neon') {
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, 'rgba(255, 0, 200, 0.34)');
    wash.addColorStop(0.5, 'rgba(120, 0, 255, 0.12)');
    wash.addColorStop(1, 'rgba(0, 229, 255, 0.34)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const glow = ctx.createLinearGradient(0, h, 0, 0);
    glow.addColorStop(0, 'rgba(0, 229, 255, 0.18)');
    glow.addColorStop(1, 'rgba(255, 0, 200, 0.10)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  } else if (gradeId === 'teal') {
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, 'rgba(25, 194, 184, 0.28)');
    wash.addColorStop(0.6, 'rgba(10, 77, 110, 0.16)');
    wash.addColorStop(1, 'rgba(4, 24, 60, 0.34)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const cool = ctx.createLinearGradient(0, 0, 0, h);
    cool.addColorStop(0, 'rgba(25, 194, 184, 0.12)');
    cool.addColorStop(1, 'rgba(4, 24, 60, 0.22)');
    ctx.fillStyle = cool;
    ctx.fillRect(0, 0, w, h);
  } else if (gradeId === 'mono') {
    const shade = ctx.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, 'rgba(0, 0, 0, 0.10)');
    shade.addColorStop(1, 'rgba(0, 0, 0, 0.30)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);
  }
  drawVignette(ctx, w, h);
  ctx.restore();
}

/** Darkens the corners and edges a little so the caption pops. */
export function drawVignette(ctx, w, h) {
  const radius = Math.hypot(w, h) / 2;
  const glow = ctx.createRadialGradient(w / 2, h / 2, radius * 0.45, w / 2, h / 2, radius);
  glow.addColorStop(0, 'rgba(0, 0, 0, 0)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}
