import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { COLORS, CUBE_COLORS, FONT, SPACING } from '../ui/theme.js';
import { FACE_ORDER, validateState } from '../cube/CubeModel.js';

const FACE_LABELS = { U: 'Верх', R: 'Право', F: 'Перёд', D: 'Низ', L: 'Лево', B: 'Зад' };

/**
 * Экран подтверждения: показывает развёртку по итогам скана/ручного ввода
 * (только для просмотра — правки возвращают в ManualInput с предзаполнением).
 */
export class ScanReviewScene extends BaseScene {
  constructor() {
    super('ScanReview');
  }

  init(data) {
    this.faceletState = data?.faceletState;
    this.algorithm = data?.algorithm || 'kociemba';
  }

  create() {
    super.create();
    this.addTopBar('Проверка', () => this.goTo('SolverEntry'));

    const { width } = this.scale;
    const cx = width / 2;

    const { valid, errors } = validateState(this.faceletState);

    this._drawNetPreview(cx, this.contentTop + SPACING.lg);

    if (!valid) {
      this.uiText(cx, this.contentTop + 250, 'Обнаружены несоответствия:\n' + errors.join('\n'), {
        fontFamily: FONT.family, fontSize: `${FONT.sizes.sm}px`, color: COLORS.dangerHex,
        align: 'center', wordWrap: { width: width - SPACING.lg * 2 },
      }).setOrigin(0.5);
    } else {
      this.uiText(cx, this.contentTop + 250, 'Всё сходится — можно собирать', {
        fontFamily: FONT.family, fontSize: `${FONT.sizes.sm}px`, color: COLORS.successHex,
      }).setOrigin(0.5);
    }

    new Button(this, cx, this.contentTop + 310, {
      label: 'Исправить вручную',
      width: 240,
      variant: 'secondary',
      onClick: () => this.goTo('ManualInput', { algorithm: this.algorithm, prefill: this.faceletState }),
    });

    this.solveBtn = new Button(this, cx, this.contentTop + 370, {
      label: 'Начать сборку',
      width: 240,
      variant: 'primary',
      disabled: !valid,
      onClick: () => this.goTo('Solver', { faceletState: this.faceletState, algorithm: this.algorithm }),
    });
  }

  _drawNetPreview(cx, topY) {
    const s = 18, g = 2;
    const faceW = s * 3 + g * 2;
    const faceGap = 8;
    const layout = { U: { col: 1, row: 0 }, L: { col: 0, row: 1 }, F: { col: 1, row: 1 }, R: { col: 2, row: 1 }, B: { col: 3, row: 1 }, D: { col: 1, row: 2 } };
    const totalW = 4 * faceW + 3 * faceGap;
    const originX = cx - totalW / 2;

    FACE_ORDER.forEach((face, fi) => {
      const { col, row } = layout[face];
      const fx = originX + col * (faceW + faceGap);
      const fy = topY + row * (faceW + faceGap);
      const faceStr = this.faceletState.slice(fi * 9, fi * 9 + 9);

      for (let i = 0; i < 9; i++) {
        const cRow = Math.floor(i / 3), cCol = i % 3;
        const x = fx + cCol * (s + g) + s / 2;
        const y = fy + cRow * (s + g) + s / 2;
        const colorKey = faceStr[i];
        this.uiRect(x, y, s, s, CUBE_COLORS[colorKey] ?? COLORS.surface2)
          .setStrokeStyle(1, COLORS.border);
      }
    });
  }
}
