import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { COLORS, FONT, SPACING } from '../ui/theme.js';
import { cameraCapture } from '../vision/CameraCapture.js';
import { colorDetector } from '../vision/ColorDetector.js';
import { FACE_ORDER } from '../cube/CubeModel.js';

// Подсказки удержания кубика — показываются по очереди, пока не собраны все 6 граней.
// Идея как в аналогичных сканер-приложениях: понятная иконка/текст "как держать",
// плюс живой прогресс какие грани уже пойманы.
const FACE_HINTS = {
  U: 'Покажите камере белую грань (верх)',
  R: 'Поверните кубик — красная грань к камере',
  F: 'Зелёная грань к камере',
  D: 'Переверните кубик — жёлтая грань вверх, к камере',
  L: 'Оранжевая грань к камере',
  B: 'Синяя грань к камере (последняя)',
};

export class ScanScene extends BaseScene {
  constructor() {
    super('Scan');
  }

  init(data) {
    this.algorithm = data?.algorithm || 'kociemba';
  }

  async create() {
    super.create();
    this.addTopBar('Скан кубика', () => this._exit());

    const { width, height } = this.scale;
    const cx = width / 2;

    // Прогресс граней — точки сверху
    this.faceDots = {};
    this.capturedFaces = {}; // face -> [9 colors]
    this._drawFaceProgress(cx, this.contentTop + 20);

    // Оверлей рамки-гида по центру (сама картинка с камеры — под Phaser в video теге)
    this.guideGraphics = this.uiGraphics();
    this._drawGuideBox();

    this.hintText = this.uiText(cx, height - this.safeBottom - 140, '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.sizes.base}px`,
      color: COLORS.textHex,
      align: 'center',
      wordWrap: { width: width - SPACING.lg * 2 },
    }).setOrigin(0.5);

    this.statusText = this.uiText(cx, height - this.safeBottom - 100, 'Инициализация камеры…', {
      fontFamily: FONT.family,
      fontSize: `${FONT.sizes.xs}px`,
      color: COLORS.mutedHex,
    }).setOrigin(0.5);

    this.manualFallbackBtn = new Button(this, cx, height - this.safeBottom - 44, {
      label: 'Ввести вручную вместо скана',
      width: 260,
      height: 40,
      variant: 'ghost',
      onClick: () => this.goTo('ManualInput', { algorithm: this.algorithm }),
    });

    // Camera canvas должен быть под Phaser canvas визуально — управляем через CSS z-index,
    // но Phaser-фон делаем прозрачным на время скана, чтобы video было видно.
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    document.getElementById('phaser-root').style.background = 'transparent';

    try {
      await cameraCapture.start();
      this.statusText.setText('Загрузка модуля распознавания цвета…');
      await colorDetector.init();
      this.statusText.setText('Наведите камеру на кубик');
      this._updateHint();
      this._startDetectionLoop();
    } catch (err) {
      this.statusText.setText('Камера недоступна');
      this.statusText.setColor(COLORS.dangerHex);
      this.hintText.setText(
        'Не удалось включить камеру.\n\n' +
        '• Камера работает только по HTTPS или на localhost.\n' +
        '• На телефоне открывайте приложение через HTTPS.\n\n' +
        'Пока можно ввести кубик вручную:'
      );
      this.manualFallbackBtn.setLabel('Ввести вручную');
      this.manualFallbackBtn.setVariant('primary');
    }

    this.events.once('shutdown', () => this._cleanup());
  }

  _drawFaceProgress(cx, y) {
    const spacing = 34;
    const totalW = (FACE_ORDER.length - 1) * spacing;
    FACE_ORDER.forEach((face, i) => {
      const x = cx - totalW / 2 + i * spacing;
      const dot = this.uiCircle(x, y, 8, COLORS.surface2, 1)
        .setStrokeStyle(1, COLORS.border);
      this.faceDots[face] = dot;
    });
  }

  _drawGuideBox() {
    const { width, height } = this.scale;
    const size = Math.min(width, height) * 0.55;
    const x = width / 2 - size / 2;
    const y = this.contentTop + 60;

    this.guideBoxRect = { x, y, size };

    this.guideGraphics.clear();
    this.guideGraphics.lineStyle(2, COLORS.accent, 0.9);
    this.guideGraphics.strokeRoundedRect(x, y, size, size, 16);

    // Внутренняя сетка 3x3 — визуальная подсказка выравнивания
    this.guideGraphics.lineStyle(1, COLORS.accent, 0.35);
    for (let i = 1; i < 3; i++) {
      const gx = x + (size / 3) * i;
      const gy = y + (size / 3) * i;
      this.guideGraphics.lineBetween(gx, y, gx, y + size);
      this.guideGraphics.lineBetween(x, gy, x + size, gy);
    }
  }

  _updateHint() {
    const remaining = FACE_ORDER.filter(f => !this.capturedFaces[f]);
    if (remaining.length === 0) {
      this.hintText.setText('Все грани получены — проверяем корректность…');
      return;
    }
    this.hintText.setText(FACE_HINTS[remaining[0]]);
  }

  _startDetectionLoop() {
    // ~6 раз в секунду — достаточно для стабильного детекта, не грузит CPU телефона
    this.detectionTimer = this.time.addEvent({
      delay: 160,
      loop: true,
      callback: () => this._detectFrame(),
    });
  }

  _detectFrame() {
    if (Object.keys(this.capturedFaces).length >= 6) return;

    const frame = cameraCapture.grabFrame();
    if (!frame) return;

    const contour = colorDetector.findCubeContour(frame.canvas);
    if (!contour) {
      colorDetector.resetStability();
      return;
    }

    const colors = colorDetector.readFaceColors(frame.canvas, contour.corners);
    const confirmed = colorDetector.pushStabilityFrame(colors);
    if (!confirmed) return;

    const centerColor = confirmed[4]; // центральная наклейка = цвет/индекс грани
    if (!centerColor || this.capturedFaces[centerColor]) return; // уже есть такая грань

    this.capturedFaces[centerColor] = confirmed;
    this._onFaceCaptured(centerColor);
  }

  _onFaceCaptured(face) {
    const dot = this.faceDots[face];
    this.tweens.add({
      targets: dot,
      scale: 1.4,
      duration: 150,
      yoyo: true,
      onStart: () => dot.setFillStyle(COLORS.accent, 1),
    });
    this.statusText.setText(`Грань поймана: ${face} (${Object.keys(this.capturedFaces).length}/6)`);
    this._updateHint();

    if (Object.keys(this.capturedFaces).length === 6) {
      this._finishScan();
    }
  }

  _finishScan() {
    this.detectionTimer?.remove();
    const faceletState = this._assembleFaceletString();
    this.time.delayedCall(500, () => {
      this.goTo('ScanReview', { faceletState, algorithm: this.algorithm });
    });
  }

  _assembleFaceletString() {
    // Собираем 54-символьную facelet-строку в порядке U R F D L B
    // из по-грани массивов capturedFaces[face] = [9 символов цвета].
    return FACE_ORDER.map(face => this.capturedFaces[face].join('')).join('');
  }

  _exit() {
    this._cleanup();
    this.goTo('SolverEntry');
  }

  _cleanup() {
    this.detectionTimer?.remove();
    cameraCapture.stop();
    document.getElementById('phaser-root').style.background = '';
  }
}
