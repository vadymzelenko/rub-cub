import { COLORS, FONT, SPACING } from './theme.js';

/**
 * Верхняя панель: кнопка "назад" (‹) + заголовок по центру.
 * Учитывает safe-area сверху (передаётся safeTop извне из сцены).
 */
export class TopBar extends Phaser.GameObjects.Container {
  constructor(scene, width, { title, safeTop = 0, onBack = null }) {
    super(scene, 0, safeTop);
    this.scene = scene;
    const h = 56;

    this.bg = scene.add.graphics();
    this.bg.fillStyle(COLORS.bg, 1);
    this.bg.fillRect(0, 0, width, h);
    this.bg.lineStyle(1, COLORS.border, 1);
    this.bg.lineBetween(0, h, width, h);

    this.titleText = scene.add.text(width / 2, h / 2, title, {
      fontFamily: FONT.family,
      fontSize: `${FONT.sizes.base}px`,
      color: COLORS.textHex,
      fontStyle: '600',
    }).setOrigin(0.5);

    this.add([this.bg, this.titleText]);

    if (onBack) {
      this.backBtn = scene.add.text(SPACING.md, h / 2, '‹ Назад', {
        fontFamily: FONT.family,
        fontSize: `${FONT.sizes.sm}px`,
        color: COLORS.mutedHex,
      }).setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.backBtn.setColor(COLORS.textHex))
        .on('pointerout', () => this.backBtn.setColor(COLORS.mutedHex))
        .on('pointerup', onBack);
      this.add(this.backBtn);
    }

    this.height = h;
    scene.add.existing(this);
  }
}
