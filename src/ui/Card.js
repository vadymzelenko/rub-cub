import { COLORS, FONT, RADIUS, SPACING, MOTION } from './theme.js';

/**
 * Карточка пункта меню: заголовок + подпись + опциональная иконка-глиф слева.
 * Плоская поверхность, тонкая граница, лёгкий hover-сдвиг границы в accent.
 */
export class Card extends Phaser.GameObjects.Container {
  constructor(scene, x, y, { width = 320, height = 84, title, subtitle, glyph = '', onClick }) {
    super(scene, x, y);
    this.scene = scene;
    this._width = width;
    this._height = height;
    this.onClick = onClick;

    this.bg = scene.add.graphics();

    this.glyphText = scene.add.text(-width / 2 + SPACING.md, 0, glyph, {
      fontFamily: FONT.family,
      fontSize: '22px',
      color: COLORS.textHex,
    }).setOrigin(0, 0.5);

    const textX = -width / 2 + SPACING.md + (glyph ? 40 : 0);

    this.titleText = scene.add.text(textX, subtitle ? -10 : 0, title, {
      fontFamily: FONT.family,
      fontSize: `${FONT.sizes.base}px`,
      color: COLORS.textHex,
      fontStyle: '500',
    }).setOrigin(0, 0.5);

    this.children = [this.bg, this.glyphText, this.titleText];

    if (subtitle) {
      this.subtitleText = scene.add.text(textX, 12, subtitle, {
        fontFamily: FONT.family,
        fontSize: `${FONT.sizes.xs}px`,
        color: COLORS.mutedHex,
      }).setOrigin(0, 0.5);
      this.children.push(this.subtitleText);
    }

    // Шеврон-стрелка справа — обозначает переход
    this.chevron = scene.add.text(width / 2 - SPACING.md, 0, '›', {
      fontFamily: FONT.family,
      fontSize: '20px',
      color: COLORS.mutedHex,
    }).setOrigin(1, 0.5);
    this.children.push(this.chevron);

    this.add(this.children);
    this._draw('idle');

    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true })
      .on('pointerover', () => this._draw('hover'))
      .on('pointerout', () => this._draw('idle'))
      .on('pointerdown', () => this._draw('press'))
      .on('pointerup', () => {
        this._draw('hover');
        this.onClick && this.onClick();
      });

    if (scene.content) {
      scene.content.add(this);
    } else {
      scene.add.existing(this);
    }
  }

  _draw(state) {
    const g = this.bg;
    g.clear();
    const w = this._width, h = this._height, r = RADIUS.lg;

    const fill = state === 'press' ? COLORS.surface2 : COLORS.surface;
    const border = state === 'idle' ? COLORS.border : COLORS.accent;

    g.fillStyle(fill, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    g.lineStyle(1, border, state === 'idle' ? 1 : 0.9);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
  }
}
