// Panel layouts for the cover: where each panel sits inside the cover rectangle.
// A rect is { x, y, w, h } in cover pixels. Layouts: 1 full-bleed, 2 side by side,
// 3 with one tall panel and two stacked, 4 in a two-by-two grid.

export const LAYOUT_COUNTS = [1, 2, 3, 4];

/** Rects for `count` panels inside a cover of width `w` and height `h`, with a `gap` between panels. */
export function layoutPanelRects(count, w, h, gap) {
  const g = Math.max(0, gap);
  if (count === 1) {
    return [{ x: 0, y: 0, w, h }];
  }
  if (count === 2) {
    const half = (w - g) / 2;
    return [
      { x: 0, y: 0, w: half, h },
      { x: half + g, y: 0, w: half, h },
    ];
  }
  if (count === 3) {
    const leftW = Math.round(w * 0.62);
    const rightX = leftW + g;
    const rightW = w - rightX;
    const halfH = (h - g) / 2;
    return [
      { x: 0, y: 0, w: leftW, h },
      { x: rightX, y: 0, w: rightW, h: halfH },
      { x: rightX, y: halfH + g, w: rightW, h: halfH },
    ];
  }
  const halfW = (w - g) / 2;
  const halfH = (h - g) / 2;
  return [
    { x: 0, y: 0, w: halfW, h: halfH },
    { x: halfW + g, y: 0, w: halfW, h: halfH },
    { x: 0, y: halfH + g, w: halfW, h: halfH },
    { x: halfW + g, y: halfH + g, w: halfW, h: halfH },
  ];
}

/** Index of the panel containing point (px, py) in cover pixels, or -1 when on a gap. */
export function panelAtPoint(rects, px, py) {
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return i;
  }
  return -1;
}

/** Gap between panels, in cover pixels, scaled to the cover's short side. */
export function panelGapFor(w, h) {
  return Math.round(Math.min(w, h) * 0.008);
}
