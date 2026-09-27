// Лёгкий детектор цветов грани кубика БЕЗ OpenCV.
// Берём пиксели с canvas, переводим в HSV и классифицируем по ближайшему
// эталонному цвету наклейки. Надёжно и без внешних зависимостей.

export const CUBE_COLORS = {
  U: '#ffffff', // белый
  D: '#ffd500', // жёлтый
  F: '#009e60', // зелёный
  B: '#0051ba', // синий
  L: '#ff5800', // оранжевый
  R: '#c41e3a', // красный
};

export const FACE_ORDER = ['U', 'R', 'F', 'D', 'L', 'B'];

// Соседние грани вокруг каждой сканируемой грани: { top, right, bottom, left }.
// Стандартная ориентация кубика: белый сверху (U), зелёный спереди (F),
// красный справа (R), оранжевый слева (L), синий сзади (B), жёлтый снизу (D).
// При скане белой (U) сверху синяя (B), справа красная (R), снизу зелёная (F),
// слева оранжевая (L) — как при взгляде на кубик сверху. Таблица согласована
// (реальная развёртка), поэтому подсказки верны при переходах между гранями.
export const FACE_NEIGHBORS = {
  U: { top: 'B', right: 'R', bottom: 'F', left: 'L' },
  D: { top: 'F', right: 'R', bottom: 'B', left: 'L' },
  F: { top: 'U', right: 'R', bottom: 'D', left: 'L' },
  B: { top: 'U', right: 'L', bottom: 'D', left: 'R' },
  L: { top: 'U', right: 'F', bottom: 'D', left: 'B' },
  R: { top: 'U', right: 'B', bottom: 'D', left: 'F' },
};

// Эталонные HSV-цвета (H: 0-360, S/V: 0-1).
const REFERENCE_HSV = {
  U: { h: 0, s: 0, v: 1 },       // белый
  D: { h: 50, s: 1, v: 1 },      // жёлтый
  F: { h: 150, s: 1, v: 0.62 },  // зелёный
  B: { h: 220, s: 1, v: 0.75 },  // синий
  L: { h: 25, s: 1, v: 1 },      // оранжевый
  R: { h: 350, s: 0.95, v: 0.75 }, // красный
};

export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return [h, s, v];
}

function hueDistance(h1, h2) {
  const d = Math.abs(h1 - h2);
  return Math.min(d, 360 - d);
}

export function classifyColor(r, g, b, exclude) {
  const [h, s, v] = rgbToHsv(r, g, b);
  // Белый — низкая насыщенность и высокая яркость.
  if (s < 0.25 && v > 0.6 && exclude !== 'U') return 'U';

  let best = null;
  let bestD = Infinity;
  for (const [face, ref] of Object.entries(REFERENCE_HSV)) {
    if (face === 'U' || face === exclude) continue;
    const d = hueDistance(h, ref.h) + Math.abs(s - ref.s) * 1.2 + Math.abs(v - ref.v) * 1.2;
    if (d < bestD) { bestD = d; best = face; }
  }
  return best;
}

/** Средний цвет в квадратной области вокруг (cx, cy). */
export function averageColor(ctx, cx, cy, radius) {
  const r = Math.max(1, Math.floor(radius));
  let sumR = 0, sumG = 0, sumB = 0, n = 0;
  const x0 = Math.max(0, Math.round(cx - r));
  const y0 = Math.max(0, Math.round(cy - r));
  const x1 = Math.min(ctx.canvas.width, Math.round(cx + r));
  const y1 = Math.min(ctx.canvas.height, Math.round(cy + r));
  if (x1 <= x0 || y1 <= y0) return { r: 0, g: 0, b: 0 };
  try {
    const data = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    for (let i = 0; i < data.length; i += 4) {
      sumR += data[i]; sumG += data[i + 1]; sumB += data[i + 2]; n++;
    }
  } catch (e) {
    return { r: 0, g: 0, b: 0 };
  }
  if (!n) return { r: 0, g: 0, b: 0 };
  return { r: sumR / n, g: sumG / n, b: sumB / n };
}

/**
 * Считывает 9 цветов грани по сетке 3x3 внутри заданной области rect {x, y, size}
 * (в координатах canvas). Возвращает массив из 9 символов ('U'|'R'|'F'|'D'|'L'|'B').
 * centerFace — грань, которую сканируем: её цвет не может встречаться на остальных
 * ячейках этой грани (автокоррекция «растекания» цвета центра).
 */
export function sampleFaceColors(canvas, rect, centerFace) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const colors = [];
  const cell = rect.size / 3;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (centerFace && row === 1 && col === 1) {
        colors.push(centerFace);
        continue;
      }
      const cx = rect.x + cell * (col + 0.5);
      const cy = rect.y + cell * (row + 0.5);
      const { r, g, b } = averageColor(ctx, cx, cy, cell * 0.22);
      colors.push(classifyColor(r, g, b, centerFace));
    }
  }
  return colors;
}
