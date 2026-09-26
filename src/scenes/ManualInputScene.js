import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { COLORS, CUBE_COLORS, FONT, SPACING } from '../ui/theme.js';
import { FACE_ORDER, SOLVED_STATE, validateState } from '../cube/CubeModel.js';

const FACE_LABELS = { U: 'Верх', R: 'Право', F: 'Перёд', D: 'Низ', L: 'Лево', B: 'Зад' };

/**
 * Развёртка кубика: пользователь тапает по ячейкам и выбирает цвет из палитры.
 * Плоский крест-layout граней (как разворот куба), плюс палитра цветов снизу.
 */
export class ManualInputScene extends BaseScene {
  constructor() {
    super('ManualInput');
  }

  init(data) {
    this.algorithm = data?.algorithm || 'kociemba';
  }

  create() {
    super.create();
    this.addTopBar('Ручной ввод', () => this.goTo('SolverEntry'));

    const { width } = this.scale;
    const cx = width / 2;

    this.faceColors = {}; // face -> array(9) of face-letter, стартуем с "решённого" как дефолт-заготовки
    FACE_ORDER.forEach(f => { this.faceColors[f] = new Array(9).fill(f); });
    this.faceColors.U[4] = 'U'; // центры зафиксированы и не редактируются

    this.selectedColor = 'U';
    this.cellSize = this.isTablet ? 26 : 20;
    this.cellGap = 2;

    this._buildNet(cx, this.contentTop + SPACING.md);
    this._buildPalette(cx, this.scale.height - this.safeBottom - 130);

    this.solveBtn = new Button(this, cx, this.scale.height - this.safeBottom - 60, {
      label: 'Решить',
      width: 200,
      variant: 'primary',
      onClick: () => this._onSolve(),
    });

    this.errorText = this.uiText(cx, this.scale.height - this.safeBottom - 88, '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.sizes.xs}px`,
      color: COLORS.dangerHex,
      align: 'center',
      wordWrap: { width: width - SPACING.lg * 2 },
    }).setOrigin(0.5);
  }

  _buildNet(cx, topY) {
    const s = this.cellSize, g = this.cellGap;
    const faceW = s * 3 + g * 2;
    const faceGap = 10;

    // Крест-раскладка: строка [_, U, _, _], [L, F, R, B], [_, D, _, _]
    const layout = {
      U: { col: 1, row: 0 },
      L: { col: 0, row: 1 },
      F: { col: 1, row: 1 },
      R: { col: 2, row: 1 },
      B: { col: 3, row: 1 },
      D: { col: 1, row: 2 },
    };

    const totalW = 4 * faceW + 3 * faceGap;
    const originX = cx - totalW / 2;

    this.cellRects = {}; // face -> array(9) rects

    FACE_ORDER.forEach(face => {
      const { col, row } = layout[face];
      const fx = originX + col * (faceW + faceGap);
      const fy = topY + row * (faceW + faceGap);

      this.uiText(fx + faceW / 2, fy - 12, FACE_LABELS[face], {
        fontFamily: FONT.family, fontSize: '11px', color: COLORS.mutedHex,
      }).setOrigin(0.5);

      this.cellRects[face] = [];
      for (let i = 0; i < 9; i++) {
        const cRow = Math.floor(i / 3), cCol = i % 3;
        const x = fx + cCol * (s + g);
        const y = fy + cRow * (s + g);
        const isCenter = i === 4;

        const rect = this.uiRect(x + s / 2, y + s / 2, s, s, CUBE_COLORS[this.faceColors[face][i]])
          .setStrokeStyle(1, COLORS.border);

        if (!isCenter) {
          rect.setInteractive({ useHandCursor: true })
            .on('pointerup', () => this._paintCell(face, i, rect));
        }
        this.cellRects[face].push(rect);
      }
    });
  }

  _buildPalette(cx, y) {
    const swatchSize = 36;
    const gap = 10;
    const totalW = FACE_ORDER.length * swatchSize + (FACE_ORDER.length - 1) * gap;
    const originX = cx - totalW / 2;

    this.paletteSwatches = {};
    FACE_ORDER.forEach((face, i) => {
      const x = originX + i * (swatchSize + gap) + swatchSize / 2;
      const swatch = this.uiRect(x, y, swatchSize, swatchSize, CUBE_COLORS[face])
        .setStrokeStyle(face === this.selectedColor ? 3 : 1, face === this.selectedColor ? COLORS.accent : COLORS.border)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => this._selectColor(face));
      this.paletteSwatches[face] = swatch;
    });
  }

  _selectColor(face) {
    this.selectedColor = face;
    FACE_ORDER.forEach(f => {
      const sw = this.paletteSwatches[f];
      sw.setStrokeStyle(f === face ? 3 : 1, f === face ? COLORS.accent : COLORS.border);
    });
  }

  _paintCell(face, i, rect) {
    this.faceColors[face][i] = this.selectedColor;
    rect.setFillStyle(CUBE_COLORS[this.selectedColor]);
    this.errorText.setText('');
  }

  _onSolve() {
    const faceletState = FACE_ORDER.map(f => this.faceColors[f].join('')).join('');
    const { valid, errors } = validateState(faceletState);
    if (!valid) {
      this.errorText.setText(errors.join('\n'));
      return;
    }
    this.goTo('ScanReview', { faceletState, algorithm: this.algorithm });
  }
}
