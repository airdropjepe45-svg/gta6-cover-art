// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample photo;
// ?shot=cover shows the cover alone. Query params: photo (boulevard|pier),
// caption (words), layout (1|2|3|4), grade (sunset|neon|teal|mono), size (1080x1080|1080x1350|1920x1080).
// window.__shotReady is set once painted.

import { addSamplePhoto, setLayout, fillAllPanelsWithPhoto } from './editor.js';
import { isGradeId } from './grades.js';
import { exportSizeById } from './exporter.js';

export async function runShot(shot, query, state, redraw, renderFilmstrip) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photoName = query.get('photo') ?? 'pier';
  const captionText = query.get('caption') ?? 'Sunset Heist';
  const layout = Number(query.get('layout') ?? '3');
  const grade = query.get('grade') ?? 'sunset';
  const sizeId = query.get('size') ?? '1080x1080';
  if (layout >= 1 && layout <= 4) setLayout(state, layout);
  if (isGradeId(grade)) state.grade = grade;
  state.exportSizeId = exportSizeById(sizeId).id;
  state.caption.text = captionText;
  const captionInput = document.getElementById('captionText');
  if (captionInput) captionInput.value = captionText;
  try {
    const photo = await addSamplePhoto(state, photoName);
    fillAllPanelsWithPhoto(state, photo.id);
    const second = query.get('photo2');
    if (second && layout >= 2) {
      const extra = await addSamplePhoto(state, second);
      // addPhoto auto-assigns the new photo to the selected panel; put the
      // first photo back there so the second photo lands ONLY on the last panel.
      state.assignments[state.selectedPanel] = photo.id;
      state.assignments[state.layout - 1] = extra.id;
    }
  } catch (error) {
    // A missing sample still leaves a usable editor scene.
  }
  renderFilmstrip();
  redraw();
  if (document.fonts?.ready) {
    await document.fonts.ready;
    redraw();
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
