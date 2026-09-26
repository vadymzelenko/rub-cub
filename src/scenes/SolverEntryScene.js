import { BaseScene } from './BaseScene.js';
import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { COLORS, FONT, SPACING } from '../ui/theme.js';

const ALGORITHMS = [
  { id: 'kociemba', label: 'Kociemba (Two-Phase)', desc: 'Оптимальное число ходов, быстрый расчёт' },
  { id: 'cfop', label: 'Fridrich (CFOP)', desc: 'Пошагово как собирает спидкубер' },
];

export class SolverEntryScene extends BaseScene {
  constructor() {
    super('SolverEntry');
  }

  create() {
    super.create();
    this.addTopBar('Собрать кубик', () => this.goTo('MainMenu'));

    const { width } = this.scale;
    const cx = width / 2;
    const cardWidth = Math.min(380, width - SPACING.lg * 2);

    this.selectedAlgo = 'kociemba';

    this.uiText(cx, this.contentTop + SPACING.lg, 'Способ ввода', {
      fontFamily: FONT.family,
      fontSize: `${FONT.sizes.sm}px`,
      color: COLORS.mutedHex,
    }).setOrigin(0.5, 0);

    new Card(this, cx, this.contentTop + 70, {
      width: cardWidth,
      glyph: '⎗',
      title: 'Сканировать камерой',
      subtitle: 'Наведите камеру, крутите кубик — определим автоматически',
      onClick: () => this.goTo('Scan', { algorithm: this.selectedAlgo }),
    });

    new Card(this, cx, this.contentTop + 164, {
      width: cardWidth,
      glyph: '⌨',
      title: 'Ввести вручную',
      subtitle: 'Отметьте цвета на развёртке кубика',
      onClick: () => this.goTo('ManualInput', { algorithm: this.selectedAlgo }),
    });

    // Выбор алгоритма
    this.uiText(cx, this.contentTop + 250, 'Алгоритм сборки', {
      fontFamily: FONT.family,
      fontSize: `${FONT.sizes.sm}px`,
      color: COLORS.mutedHex,
    }).setOrigin(0.5, 0);

    this.algoCards = [];
    ALGORITHMS.forEach((algo, i) => {
      const card = new Card(this, cx, this.contentTop + 300 + i * 78, {
        width: cardWidth,
        height: 66,
        glyph: this.selectedAlgo === algo.id ? '●' : '○',
        title: algo.label,
        subtitle: algo.desc,
        onClick: () => this._selectAlgo(algo.id),
      });
      card._algoId = algo.id;
      this.algoCards.push(card);
    });
  }

  _selectAlgo(id) {
    this.selectedAlgo = id;
    this.algoCards.forEach(card => {
      card.glyphText.setText(card._algoId === id ? '●' : '○');
      card.glyphText.setColor(card._algoId === id ? COLORS.accentHex : COLORS.textHex);
    });
  }
}
