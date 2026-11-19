// Editor state and interaction: photos, panel selection, per-panel crop (drag to pan,
// wheel to zoom), and the live preview's pointer handling.

import { panelAtPoint } from './panels.js';

let nextPhotoId = 1;

/** Fresh editor state: no photos yet, three panels, Sunset grade, bottom caption. */
export function createEditorState() {
  return {
    photos: [],
    layout: 3,
    selectedPanel: 0,
    assignments: [null, null, null, null],
    transforms: [
      { zoom: 1, dx: 0, dy: 0 },
      { zoom: 1, dx: 0, dy: 0 },
      { zoom: 1, dx: 0, dy: 0 },
      { zoom: 1, dx: 0, dy: 0 },
    ],
    caption: {
      text: 'SUNSET HEIST',
      sizePct: 100,
      position: 'bottom',
      outline: true,
      shadow: true,
      gradient: true,
      uppercase: true,
    },
    grade: 'sunset',
    exportSizeId: '1080x1080',
  };
}

/** Loads an image from a data URL or a same-origin relative path. Resolves to the image. */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

/** Reads a File into a data URL with FileReader. The file never leaves the machine. */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

/** Adds an image to the state's photo list and places it on a free panel. Returns the photo. */
export function addPhoto(state, img, name) {
  const photo = { id: nextPhotoId, name: name || `Photo ${nextPhotoId}`, img };
  nextPhotoId += 1;
  state.photos.push(photo);
  const target = firstEmptyPanel(state) ?? state.selectedPanel;
  state.assignments[target] = photo.id;
  state.selectedPanel = target;
  return photo;
}

/** Loads a photo from a File (upload or drop) and adds it. */
export async function addPhotoFile(state, file) {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);
  return addPhoto(state, img, file.name);
}

/** Loads one of the built-in samples (samples/<name>.jpg) and adds it. */
export async function addSamplePhoto(state, name) {
  const img = await loadImage(`samples/${name}.jpg`);
  return addPhoto(state, img, name);
}

/** Index of the first panel with no photo, or null when every panel is filled. */
export function firstEmptyPanel(state) {
  for (let i = 0; i < state.layout; i += 1) {
    if (!state.assignments[i]) return i;
  }
  return null;
}

/** Puts `photoId` on panel `panelIndex` (and selects that panel). */
export function assignPhotoToPanel(state, panelIndex, photoId) {
  state.assignments[panelIndex] = photoId;
  state.selectedPanel = panelIndex;
}

/** Puts `photoId` on every panel of the current layout. */
export function fillAllPanelsWithPhoto(state, photoId) {
  for (let i = 0; i < state.layout; i += 1) {
    state.assignments[i] = photoId;
  }
}

/** Switches the panel layout, keeping photos where they fit. */
export function setLayout(state, count) {
  state.layout = count;
  if (state.selectedPanel >= count) state.selectedPanel = 0;
}

/** Resets the selected panel's crop to the photo's natural cover fit. */
export function resetSelectedPanelCrop(state) {
  state.transforms[state.selectedPanel] = { zoom: 1, dx: 0, dy: 0 };
}

/** Sets the selected panel's zoom (1 = cover fit) and clamps it to 1..3. */
export function setSelectedPanelZoom(state, zoom) {
  const t = state.transforms[state.selectedPanel];
  t.zoom = Math.min(3, Math.max(1, zoom));
}

/**
 * Attaches drag-to-pan and wheel-to-zoom to the preview canvas.
 * `getRects` returns the panel rects of the last preview draw, in cover pixels.
 * `onChange` is called after every pan or zoom so the preview redraws.
 */
export function attachPreviewInteraction(canvas, state, getRects, onChange) {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  function canvasPoint(event) {
    const box = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * canvas.width,
      y: ((event.clientY - box.top) / box.height) * canvas.height,
      scaleX: canvas.width / box.width,
      scaleY: canvas.height / box.height,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    const hit = panelAtPoint(getRects(), point.x, point.y);
    if (hit === -1) return;
    state.selectedPanel = hit;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.classList.add('dragging');
    canvas.setPointerCapture(event.pointerId);
    onChange('select');
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const box = canvas.getBoundingClientRect();
    const scaleX = canvas.width / box.width;
    const scaleY = canvas.height / box.height;
    const t = state.transforms[state.selectedPanel];
    t.dx += (event.clientX - lastX) * scaleX;
    t.dy += (event.clientY - lastY) * scaleY;
    lastX = event.clientX;
    lastY = event.clientY;
    onChange('pan');
  });

  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove('dragging');
    if (event.pointerId !== undefined && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    onChange('pan-end');
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const point = canvasPoint(event);
    const hit = panelAtPoint(getRects(), point.x, point.y);
    if (hit === -1) return;
    state.selectedPanel = hit;
    const t = state.transforms[hit];
    const rects = getRects();
    const rect = rects[hit];
    const oldZoom = t.zoom;
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    const newZoom = Math.min(3, Math.max(1, oldZoom * factor));
    if (newZoom === oldZoom) return;
    const cx = rect.x + rect.w / 2 + t.dx;
    const cy = rect.y + rect.h / 2 + t.dy;
    const k = newZoom / oldZoom;
    t.dx = point.x + (cx - point.x) * k - (rect.x + rect.w / 2);
    t.dy = point.y + (cy - point.y) * k - (rect.y + rect.h / 2);
    t.zoom = newZoom;
    onChange('zoom');
  }, { passive: false });
}
