import Phaser from 'phaser';

/**
 * HiDPI / retina-рендеринг для Phaser 3.
 *
 * Проблема: в режиме Scale.RESIZE Phaser ставит backing-буфер канваса равным
 * CSS-размеру вьюпорта (canvas.width = 390, а на экране devicePixelRatio = 3).
 * Браузер растягивает канвас в 3 раза — и текст, который Phaser растеризует
 * в битмап размером с fontSize, получается мыльным.
 *
 * Решение (без изменения логической системы координат сцен — все размеры
 * остаются в CSS-пикселях):
 *   1. backing-буфер канваса и WebGL-вьюпорт умножаются на DPR;
 *   2. камера получает viewport = CSS*DPR и zoom = DPR, чтобы мир в CSS-пикселях
 *      занимал весь вьюпорт (scissor/фон не обрезались);
 *   3. displayScale = DPR, чтобы координаты тапов корректно маппились
 *      из CSS-пикселей в вьюпорт;
 *   4. каждому Text задаётся style.resolution = DPR — глифы растеризуются в
 *      fontSize*DPR пикселей и выводятся 1:1 с пикселями устройства.
 *
 * Graphics (кнопки/карточки) — это векторная геометрия WebGL, они чёткие при
 * любом разрешении и не требуют дополнительной обработки.
 */

const MAX_DPR = 3;

function computeDPR() {
  const raw = window.devicePixelRatio || 1;
  return Math.min(Math.max(1, raw), MAX_DPR);
}

let dpr = computeDPR();

export function getDPR() {
  return dpr;
}

export function refreshDPR() {
  dpr = computeDPR();
  return dpr;
}

// Делаем DPR-разрешение дефолтом для всех новых Text-объектов.
// Phaser рендерит текст во внутренний canvas размером fontSize*resolution и
// выводит его размером fontSize; без этого глифы апскейлятся и выглядят мыльно.
const _textStyleInitialize = Phaser.GameObjects.TextStyle.prototype.initialize;
Phaser.GameObjects.TextStyle.prototype.initialize = function (text, style) {
  _textStyleInitialize.call(this, text, style);
  if (!this.resolution) {
    this.resolution = getDPR();
  }
};

/**
 * Применяет HiDPI-настройки к главной камере конкретной сцены.
 * Вызывается из BaseScene.create() для каждой вновь созданной сцены.
 */
export function applySceneHiDPI(scene) {
  const cam = scene && scene.cameras && scene.cameras.main;
  if (!cam) return;

  const scale = scene.scale;
  const w = Math.max(1, Math.round(scale.width));  // CSS-пиксели (gameSize)
  const h = Math.max(1, Math.round(scale.height));
  const bw = Math.max(1, Math.round(w * dpr));     // вьюпорт в пикселях устройства
  const bh = Math.max(1, Math.round(h * dpr));

  const zoomX = bw / w;
  const zoomY = bh / h;

  cam.setSize(bw, bh);
  cam.setZoom(zoomX, zoomY);

  // Phaser зумит камеру относительно её центра, а UI-миру нужен top-left
  // [0,w]x[0,h] в вьюпорте [0,bw]x[0,bh]. Компенсируем сдвигом скролла.
  cam.setScroll((w - bw) / 2, (h - bh) / 2);
}

/**
 * Устанавливает HiDPI-пайплайн: канвас + рендерер + displayScale + камеры.
 * Вызывается по READY и по RESIZE.
 */
export function installHiDPI(game) {
  const applyAll = () => {
    refreshDPR();

    const scale = game.scale;
    const w = Math.max(1, Math.round(scale.width));
    const h = Math.max(1, Math.round(scale.height));
    const bw = Math.max(1, Math.round(w * dpr));
    const bh = Math.max(1, Math.round(h * dpr));

    const canvas = game.canvas;
    if (canvas) {
      canvas.width = bw;
      canvas.height = bh;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    }

    // baseSize управляет renderer'ом и вьюпортом камер; gameSize (layout) оставляем в CSS.
    scale.baseSize.setSize(bw, bh);

    if (game.renderer && typeof game.renderer.resize === 'function') {
      game.renderer.resize(bw, bh);
    }

    // Маппинг указателя: CSS-координаты -> координаты вьюпорта (DPR).
    scale.displayScale.set(bw / w, bh / h);

    game.scene.getScenes(true).forEach(applySceneHiDPI);
  };

  game.events.once(Phaser.Core.Events.READY, applyAll);
  game.scale.on(Phaser.Scale.Events.RESIZE, applyAll);
}
