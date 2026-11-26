// Sticker colour detection without OpenCV: average pixels from a canvas, convert
// to CIELAB and pick the nearest reference colour. References come from the
// user's calibration (or sensible defaults) and from the centres already scanned,
// so the detector adapts to the actual cube and lighting.

import { FACE_ORDER } from '../cube/CubeModel.js';

export { FACE_ORDER };

export const CUBE_COLORS = {
  U: '#f5f5f4', // white
  R: '#e0283c', // red
  F: '#00a85a', // green
  D: '#ffd60a', // yellow
  L: '#ff7a1a', // orange
  B: '#1f6fe5', // blue
};

/** Readable text colour on top of a sticker. */
export const ON_COLOR = { U: '#18181b', D: '#18181b', R: '#fff', F: '#fff', L: '#fff', B: '#fff' };

// Neighbouring centres around each face as it is held for scanning (standard
// orientation: white up, green front). Matches the unfolded net exactly.
export const FACE_NEIGHBORS = {
  U: { top: 'B', right: 'R', bottom: 'F', left: 'L' },
  D: { top: 'F', right: 'R', bottom: 'B', left: 'L' },
  F: { top: 'U', right: 'R', bottom: 'D', left: 'L' },
  B: { top: 'U', right: 'L', bottom: 'D', left: 'R' },
  L: { top: 'U', right: 'F', bottom: 'D', left: 'B' },
  R: { top: 'U', right: 'B', bottom: 'D', left: 'F' },
};

// Typical camera readings of real stickers under indoor light.
const DEFAULT_RGB = {
  U: [215, 218, 220],
  R: [185, 30, 45],
  F: [30, 160, 90],
  D: [215, 205, 45],
  L: [235, 110, 35],
  B: [25, 85, 185],
};

// ---------- colour maths ----------
function srgbToLinear(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function rgbToLab(r, g, b) {
  const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  let y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x); y = f(y); z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

// Lightness varies a lot with shadows, so it counts for less than hue/chroma.
function labDistance(p, q) {
  const dL = (p[0] - q[0]) * 0.45;
  const da = p[1] - q[1];
  const db = p[2] - q[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

// ---------- calibration ----------
const CALIB_KEY = 'rubcub.calibration.v2';

function loadCalibration() {
  try {
    const obj = JSON.parse(localStorage.getItem(CALIB_KEY) || '{}');
    const out = {};
    for (const f of FACE_ORDER) {
      const v = obj && obj[f];
      if (Array.isArray(v) && v.length === 3 && v.every(Number.isFinite)) out[f] = v;
    }
    return out;
  } catch { return {}; }
}

let calibration = loadCalibration();

export function calibrateColor(face, rgb) {
  if (!FACE_ORDER.includes(face)) return;
  calibration[face] = rgb.map((v) => Math.round(v));
  try { localStorage.setItem(CALIB_KEY, JSON.stringify(calibration)); } catch { /* ignore */ }
}

export function resetCalibration() {
  calibration = {};
  try { localStorage.removeItem(CALIB_KEY); } catch { /* ignore */ }
}

export function calibrationCount() {
  return Object.keys(calibration).length;
}

/** Lab references: per-scan centres override calibration, which overrides defaults. */
export function buildReferences(scannedCenters = {}) {
  const refs = {};
  for (const f of FACE_ORDER) {
    const rgb = scannedCenters[f] || calibration[f] || DEFAULT_RGB[f];
    refs[f] = rgbToLab(...rgb);
  }
  return refs;
}

export function classifyRgb(rgb, refs) {
  const lab = rgbToLab(...rgb);
  let best = null, bestD = Infinity;
  for (const f of FACE_ORDER) {
    const d = labDistance(lab, refs[f]);
    if (d < bestD) { bestD = d; best = f; }
  }
  return best;
}

// ---------- sampling ----------
/** Average colour of a square around (cx, cy); a trimmed mean drops glare and edges. */
export function averageColor(ctx, cx, cy, radius) {
  const r = Math.max(1, Math.floor(radius));
  const x0 = Math.max(0, Math.round(cx - r));
  const y0 = Math.max(0, Math.round(cy - r));
  const x1 = Math.min(ctx.canvas.width, Math.round(cx + r));
  const y1 = Math.min(ctx.canvas.height, Math.round(cy + r));
  if (x1 <= x0 || y1 <= y0) return [0, 0, 0];
  let data;
  try { data = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data; } catch { return [0, 0, 0]; }
  const px = [];
  for (let i = 0; i < data.length; i += 4) px.push([data[i], data[i + 1], data[i + 2], data[i] + data[i + 1] + data[i + 2]]);
  if (!px.length) return [0, 0, 0];
  px.sort((a, b) => a[3] - b[3]);
  const lo = Math.floor(px.length * 0.15), hi = Math.max(lo + 1, Math.ceil(px.length * 0.85));
  let sr = 0, sg = 0, sb = 0, n = 0;
  for (let i = lo; i < hi; i++) { sr += px[i][0]; sg += px[i][1]; sb += px[i][2]; n++; }
  return [sr / n, sg / n, sb / n];
}

/** Raw RGB of the 9 stickers inside rect {x, y, size} (canvas pixels). */
export function sampleFace(canvas, rect) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const cell = rect.size / 3;
  const out = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      out.push(averageColor(ctx, rect.x + cell * (col + 0.5), rect.y + cell * (row + 0.5), cell * 0.2));
    }
  }
  return out;
}

/**
 * Final pass once all six faces are captured: every sticker is matched against
 * the six measured centres with a balanced assignment (exactly 9 of each colour).
 * `samples` is { face: [9 rgb] }; `locked` is { index: letter } for stickers the
 * user corrected by hand, which are kept as is.
 */
export function classifyBalanced(samples, locked = {}) {
  const centers = Object.fromEntries(FACE_ORDER.map((f) => [f, samples[f][4]]));
  const refs = buildReferences(centers);
  const result = new Array(54).fill(null);
  const left = Object.fromEntries(FACE_ORDER.map((f) => [f, 9]));
  const pairs = [];

  FACE_ORDER.forEach((face, fi) => {
    samples[face].forEach((rgb, i) => {
      const k = fi * 9 + i;
      const fixed = i === 4 ? face : locked[k];
      if (fixed) { result[k] = fixed; left[fixed]--; return; }
      const lab = rgbToLab(...rgb);
      for (const f of FACE_ORDER) pairs.push([labDistance(lab, refs[f]), k, f]);
    });
  });

  pairs.sort((a, b) => a[0] - b[0]);
  for (const [, k, f] of pairs) {
    if (result[k] || left[f] <= 0) continue;
    result[k] = f;
    left[f]--;
  }
  return result.map((c) => c || '?').join('');
}
