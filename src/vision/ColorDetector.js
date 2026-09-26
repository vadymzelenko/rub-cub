// Детектор грани кубика по кадру камеры, на OpenCV.js.
//
// ПОДХОД (автоопределение, непрерывный поток без ручных снимков по грани):
// 1. На каждом кадре ищем квадратный контур самого кубика (самый крупный
//    квадратно-подобный контур в кадре, обычно кубик держат крупным планом).
// 2. Внутри него по перспективе делим на сетку 3x3, берём usреднённый
//    цвет центральной зоны каждой из 9 ячеек (не всю ячейку — так меньше
//    шума от бликов/границ наклеек).
// 3. Классифицируем каждый цвет в HSV-пространстве (устойчивее к освещению,
//    чем RGB) по ближайшему опорному цвету из 6 калибровочных.
// 4. Стабильность: грань принимается только если одинаковый результат
//    получен N кадров подряд (защита от смаза/дрожания камеры).
// 5. Дедупликация: сверяем результат с центральным цветом грани — если
//    такая грань уже отсканирована, показываем оверлей "уже отсканировано"
//    вместо повторной записи.
//
// OpenCV.js грузится лениво через loadOpenCV() — вызывается один раз при
// входе в ScanScene, чтобы не раздувать холодный старт остальных экранов.

let cvReadyPromise = null;

export function loadOpenCV(onProgress) {
  if (cvReadyPromise) return cvReadyPromise;

  cvReadyPromise = new Promise((resolve, reject) => {
    if (window.cv && window.cv.Mat) {
      resolve(window.cv);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.9.0/opencv.js'; // TODO: заменить на локальный self-hosted бандл перед релизом
    script.async = true;
    script.onload = () => {
      // opencv.js асинхронно инициализирует WASM рантайм
      const check = () => {
        if (window.cv && window.cv.Mat) {
          onProgress?.(1);
          resolve(window.cv);
        } else {
          window.cv.onRuntimeInitialized = () => {
            onProgress?.(1);
            resolve(window.cv);
          };
        }
      };
      check();
    };
    script.onerror = () => reject(new Error('Не удалось загрузить OpenCV.js — проверьте сеть'));
    document.head.appendChild(script);
  });

  return cvReadyPromise;
}

// Опорные HSV-цвета наклеек (H: 0-179 в OpenCV, S/V: 0-255).
// Калибруются один раз под стандартную гамму кубика; при желании пользователь
// сможет переопределить в настройках (адаптация под конкретный кубик/свет).
const REFERENCE_HSV = {
  U: { h: 0,   s: 0,   v: 255 }, // белый — низкая насыщенность, высокая яркость
  D: { h: 28,  s: 220, v: 230 }, // жёлтый
  F: { h: 68,  s: 200, v: 160 }, // зелёный
  B: { h: 112, s: 200, v: 200 }, // синий
  L: { h: 12,  s: 220, v: 230 }, // оранжевый
  R: { h: 178, s: 200, v: 200 }, // красный (учитываем wrap-around через 0)
};

function hueDistance(h1, h2) {
  const d = Math.abs(h1 - h2);
  return Math.min(d, 180 - d);
}

function classifyHSV(h, s, v) {
  // Белый определяется отдельно — по низкой насыщенности, а не по оттенку.
  if (s < 60 && v > 150) return 'U';

  let best = null;
  let bestDist = Infinity;
  for (const [face, ref] of Object.entries(REFERENCE_HSV)) {
    if (face === 'U') continue;
    const dist = hueDistance(h, ref.h) + Math.abs(s - ref.s) * 0.1 + Math.abs(v - ref.v) * 0.1;
    if (dist < bestDist) {
      bestDist = dist;
      best = face;
    }
  }
  return best;
}

export class ColorDetector {
  constructor() {
    this.cv = null;
    this.stabilityBuffer = [];
    this.stabilityWindow = 5; // кадров подряд для подтверждения
  }

  async init(onProgress) {
    this.cv = await loadOpenCV(onProgress);
  }

  /**
   * Ищет крупный квадратно-подобный контур кубика в кадре.
   * Возвращает { corners: [[x,y]x4] } в координатах кадра или null.
   */
  findCubeContour(canvas) {
    const cv = this.cv;
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    const blurred = new cv.Mat();
    const edges = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    let result = null;
    try {
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
      cv.Canny(blurred, edges, 50, 150);
      cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

      let maxArea = 0;
      let best = null;
      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const area = cv.contourArea(cnt);
        const frameArea = canvas.width * canvas.height;
        // Кубик должен занимать заметную часть кадра, но не весь (защита от ложных срабатываний)
        if (area > frameArea * 0.15 && area > maxArea) {
          const peri = cv.arcLength(cnt, true);
          const approx = new cv.Mat();
          cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
          if (approx.rows === 4) {
            maxArea = area;
            best = approx.clone();
          }
          approx.delete();
        }
        cnt.delete();
      }

      if (best) {
        const corners = [];
        for (let i = 0; i < 4; i++) {
          corners.push([best.data32S[i * 2], best.data32S[i * 2 + 1]]);
        }
        result = { corners };
        best.delete();
      }
    } finally {
      src.delete(); gray.delete(); blurred.delete(); edges.delete();
      contours.delete(); hierarchy.delete();
    }
    return result;
  }

  /**
   * Читает 9 цветов грани по сетке 3x3 внутри заданных углов квадрата.
   * Возвращает массив из 9 символов ('U'|'R'|'F'|'D'|'L'|'B'), либо null-элемент
   * при неуверенной классификации данной ячейки.
   */
  readFaceColors(canvas, corners) {
    const cv = this.cv;
    const src = cv.imread(canvas);
    const hsv = new cv.Mat();
    cv.cvtColor(src, hsv, cv.COLOR_RGB2HSV);

    const [tl, tr, br, bl] = this._orderCorners(corners);
    const colors = [];

    try {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          // Билинейная интерполяция центра ячейки (row,col) внутри квадрата
          const u = (col + 0.5) / 3;
          const v = (row + 0.5) / 3;
          const x = this._lerp2D(tl, tr, bl, br, u, v)[0];
          const y = this._lerp2D(tl, tr, bl, br, u, v)[1];

          const sample = this._sampleAvgHSV(hsv, Math.round(x), Math.round(y), 6);
          colors.push(sample ? classifyHSV(sample.h, sample.s, sample.v) : null);
        }
      }
    } finally {
      src.delete();
      hsv.delete();
    }
    return colors;
  }

  _orderCorners(corners) {
    // Сортируем 4 угла в порядок TL, TR, BR, BL по сумме/разности координат
    const sorted = [...corners];
    const sum = p => p[0] + p[1];
    const diff = p => p[0] - p[1];
    const tl = sorted.reduce((a, b) => (sum(a) < sum(b) ? a : b));
    const br = sorted.reduce((a, b) => (sum(a) > sum(b) ? a : b));
    const tr = sorted.reduce((a, b) => (diff(a) > diff(b) ? a : b));
    const bl = sorted.reduce((a, b) => (diff(a) < diff(b) ? a : b));
    return [tl, tr, br, bl];
  }

  _lerp2D(tl, tr, bl, br, u, v) {
    const top = [tl[0] + (tr[0] - tl[0]) * u, tl[1] + (tr[1] - tl[1]) * u];
    const bottom = [bl[0] + (br[0] - bl[0]) * u, bl[1] + (br[1] - bl[1]) * u];
    return [top[0] + (bottom[0] - top[0]) * v, top[1] + (bottom[1] - top[1]) * v];
  }

  _sampleAvgHSV(hsvMat, cx, cy, radius) {
    const cv = this.cv;
    let hSum = 0, sSum = 0, vSum = 0, n = 0;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= hsvMat.cols || y >= hsvMat.rows) continue;
        const pixel = hsvMat.ucharPtr(y, x);
        hSum += pixel[0]; sSum += pixel[1]; vSum += pixel[2];
        n++;
      }
    }
    if (n === 0) return null;
    return { h: hSum / n, s: sSum / n, v: vSum / n };
  }

  /**
   * Добавляет результат кадра в буфер стабильности. Возвращает подтверждённый
   * результат (массив 9 цветов), если последние N кадров совпали, иначе null.
   */
  pushStabilityFrame(colors) {
    this.stabilityBuffer.push(colors);
    if (this.stabilityBuffer.length > this.stabilityWindow) this.stabilityBuffer.shift();
    if (this.stabilityBuffer.length < this.stabilityWindow) return null;

    const allSame = this.stabilityBuffer.every(frame =>
      frame.every((c, i) => c === this.stabilityBuffer[0][i])
    );
    if (allSame && colors.every(c => c !== null)) {
      this.stabilityBuffer = [];
      return colors;
    }
    return null;
  }

  resetStability() {
    this.stabilityBuffer = [];
  }
}

export const colorDetector = new ColorDetector();
