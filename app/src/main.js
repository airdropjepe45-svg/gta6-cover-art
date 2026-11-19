// Wires the page: controls, filmstrip, live preview and export. A `?shot=` query sets
// up a fixed scene for a screenshot instead (./shots.js).

import { createEditorState, addPhotoFile, addSamplePhoto, assignPhotoToPanel, fillAllPanelsWithPhoto, setLayout, resetSelectedPanelCrop, setSelectedPanelZoom, attachPreviewInteraction } from './editor.js';
import { drawCoverArt, exportCoverPng, exportSizeById } from './exporter.js';
import { isGradeId } from './grades.js';
import { runShot } from './shots.js';

const state = createEditorState();
const canvas = document.getElementById('preview');
const status = document.getElementById('status');
const filmstrip = document.getElementById('filmstrip');
const panelHint = document.getElementById('panelHint');
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');
const previewSize = document.getElementById('previewSize');

let lastRects = [];
let selectedPhotoId = null;

/** Redraws the preview at the current export size and repaints the selection outline. */
function redraw() {
  const size = exportSizeById(state.exportSizeId);
  lastRects = drawCoverArt(canvas, state, size.width, size.height);
  drawSelectionOutline();
  previewSize.textContent = `${size.width} × ${size.height}`;
  syncControls();
}

/** Draws the pink outline around the selected panel on the preview (preview only, never exported). */
function drawSelectionOutline() {
  if (state.layout <= 1) return;
  if (document.body.classList.contains('shot-cover')) return;
  const rect = lastRects[state.selectedPanel];
  if (!rect) return;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = Math.max(3, canvas.width * 0.004);
  ctx.setLineDash([18, 10]);
  ctx.strokeRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8);
  ctx.restore();
}

/** Keeps every control in sync with the state (active buttons, slider, hint text). */
function syncControls() {
  document.querySelectorAll('#layoutPicker button').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.layout) === state.layout);
  });
  document.querySelectorAll('#gradePicker button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#captionPosition button').forEach((b) => {
    b.classList.toggle('active', b.dataset.position === state.caption.position);
  });
  const t = state.transforms[state.selectedPanel];
  zoomSlider.value = String(Math.round(t.zoom * 100));
  zoomValue.textContent = `${Math.round(t.zoom * 100)}%`;
  panelHint.textContent = `Panel ${state.selectedPanel + 1} of ${state.layout} selected — drag its photo to pan, scroll to zoom.`;
  filmstrip.querySelectorAll('.thumb').forEach((thumb) => {
    thumb.classList.toggle('active', Number(thumb.dataset.photoId) === selectedPhotoId);
  });
}

/** Rebuilds the filmstrip of loaded photos; clicking one assigns it to the selected panel. */
function renderFilmstrip() {
  filmstrip.innerHTML = '';
  if (state.photos.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'empty';
    empty.textContent = 'No photos yet — add yours or try a sample.';
    filmstrip.appendChild(empty);
    return;
  }
  for (const photo of state.photos) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb';
    button.dataset.photoId = String(photo.id);
    button.title = photo.name;
    const img = document.createElement('img');
    img.src = photo.img.src;
    img.alt = photo.name;
    button.appendChild(img);
    button.addEventListener('click', () => {
      selectedPhotoId = photo.id;
      assignPhotoToPanel(state, state.selectedPanel, photo.id);
      redraw();
    });
    filmstrip.appendChild(button);
  }
}

/** Adds uploaded files one by one, then redraws. */
async function handleFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const photo = await addPhotoFile(state, file);
      selectedPhotoId = photo.id;
    } catch (error) {
      status.textContent = error.message;
    }
  }
  renderFilmstrip();
  redraw();
}

// ---------- photo inputs ----------
document.getElementById('photoInput').addEventListener('change', (event) => {
  handleFiles(event.target.files);
  event.target.value = '';
});
document.getElementById('sampleBoulevard').addEventListener('click', async () => {
  const photo = await addSamplePhoto(state, 'boulevard');
  selectedPhotoId = photo.id;
  renderFilmstrip();
  redraw();
});
document.getElementById('samplePier').addEventListener('click', async () => {
  const photo = await addSamplePhoto(state, 'pier');
  selectedPhotoId = photo.id;
  renderFilmstrip();
  redraw();
});
document.getElementById('spanAll').addEventListener('click', () => {
  const id = selectedPhotoId ?? state.assignments[state.selectedPanel];
  if (!id) {
    status.textContent = 'Pick a photo first.';
    return;
  }
  fillAllPanelsWithPhoto(state, id);
  redraw();
});
document.getElementById('resetCrop').addEventListener('click', () => {
  resetSelectedPanelCrop(state);
  redraw();
});

// ---------- drag and drop onto the preview ----------
canvas.addEventListener('dragover', (event) => event.preventDefault());
canvas.addEventListener('drop', (event) => {
  event.preventDefault();
  handleFiles(event.dataTransfer.files);
});

// ---------- layout, grade, caption ----------
document.getElementById('layoutPicker').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-layout]');
  if (!button) return;
  setLayout(state, Number(button.dataset.layout));
  redraw();
});
document.getElementById('gradePicker').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-grade]');
  if (!button || !isGradeId(button.dataset.grade)) return;
  state.grade = button.dataset.grade;
  redraw();
});
document.getElementById('captionPosition').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-position]');
  if (!button) return;
  state.caption.position = button.dataset.position;
  redraw();
});
const captionText = document.getElementById('captionText');
captionText.addEventListener('input', () => {
  state.caption.text = captionText.value;
  redraw();
});
const captionSize = document.getElementById('captionSize');
const captionSizeLabel = document.getElementById('captionSizeLabel');
captionSize.addEventListener('input', () => {
  state.caption.sizePct = Number(captionSize.value);
  captionSizeLabel.textContent = `${captionSize.value}%`;
  redraw();
});
const effectIds = [
  ['effectOutline', 'outline'],
  ['effectShadow', 'shadow'],
  ['effectGradient', 'gradient'],
  ['effectUppercase', 'uppercase'],
];
for (const [id, key] of effectIds) {
  document.getElementById(id).addEventListener('change', (event) => {
    state.caption[key] = event.target.checked;
    redraw();
  });
}
zoomSlider.addEventListener('input', () => {
  setSelectedPanelZoom(state, Number(zoomSlider.value) / 100);
  redraw();
});

// ---------- export ----------
async function exportAt(sizeId) {
  const size = exportSizeById(sizeId);
  state.exportSizeId = sizeId;
  redraw();
  try {
    const fileName = await exportCoverPng(state, size);
    status.textContent = `Saved ${fileName}`;
  } catch (error) {
    status.textContent = error.message;
  }
}
document.getElementById('exportSquare').addEventListener('click', () => exportAt('1080x1080'));
document.getElementById('exportPortrait').addEventListener('click', () => exportAt('1080x1350'));
document.getElementById('exportWide').addEventListener('click', () => exportAt('1920x1080'));

// ---------- preview interaction (pan / zoom / select) ----------
attachPreviewInteraction(canvas, state, () => lastRects, () => redraw());

// ---------- boot ----------
async function boot() {
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), state, redraw, renderFilmstrip);
    return;
  }
  renderFilmstrip();
  redraw();
  try {
    const photo = await addSamplePhoto(state, 'pier');
    selectedPhotoId = photo.id;
    renderFilmstrip();
  } catch (error) {
    status.textContent = 'Sample photo could not load — add your own photo to start.';
  }
  redraw();
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => redraw());
  }
}

boot();
