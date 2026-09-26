import { BaseScene } from './BaseScene.js';
import { COLORS, FONT, SPACING } from '../ui/theme.js';

export class AboutScene extends BaseScene {
  constructor() {
    super('About');
  }

  create() {
    super.create();
    this.addTopBar('О программе', () => this.goTo('MainMenu'));

    const { width } = this.scale;
    const cx = width / 2;
    let y = this.contentTop + SPACING.xl;

    const lines = [
      { text: 'Cube Solver', size: FONT.sizes.xl, color: COLORS.textHex, weight: '600' },
      { text: 'Версия 0.1.0', size: FONT.sizes.sm, color: COLORS.mutedHex },
      { text: '', size: 12 },
      { text: 'Движок: Phaser 3 + Three.js', size: FONT.sizes.sm, color: COLORS.textHex },
      { text: 'Решатель: Kociemba Two-Phase, CFOP', size: FONT.sizes.sm, color: COLORS.textHex },
      { text: 'Распознавание: OpenCV.js', size: FONT.sizes.sm, color: COLORS.textHex },
      { text: '', size: 12 },
      { text: 'Автор: —', size: FONT.sizes.sm, color: COLORS.mutedHex },
    ];

    lines.forEach(line => {
      if (line.text === '') { y += line.size; return; }
      this.uiText(cx, y, line.text, {
        fontFamily: FONT.family,
        fontSize: `${line.size}px`,
        color: line.color,
        fontStyle: line.weight || '400',
      }).setOrigin(0.5);
      y += line.size + 14;
    });
  }
}
