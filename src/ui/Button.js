import { COLORS, FONT, RADIUS, SPACING, MOTION } from './theme.js';

/**
 * Плоская кнопка с hairline-границей.
 * variant: 'primary' (accent-заливка) | 'secondary' (surface + border) | 'ghost' (только текст)
 */
export class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, { label, width = 220, height = 48, variant = 'secondary', onClick, disabled = false }) {
    super(scene, x, y);
    this.scene = scene;
    this._width = width;
    this._height = height;
    this.variant = variant;
    this.disabled = disabled;
    this.onClick = onClick;

    this.bg = scene.add.graphics();
    this.label = scene.add.text(0, 0, label, {
      fontFamily: FONT.family,
      fontSize: `${FONT.sizes.sm}px`,
      color: this._textColor(),
      fontStyle: '500',
    }).setOrigin(0.5);

    this.add([this.bg, this.label]);
    this._draw();

    this.setSize(width, height);
    this.setInteractive({ useHandCursor: !disabled })
      .on('pointerover', () => !this.disabled && this._setHover(true))
      .on('pointerout', () => !this.disabled && this._setHover(false))
      .on('pointerdown', () => !this.disabled && this._setPress(true))
      .on('pointerup', () => {
        if (this.disabled) return;
        this._setPress(false);
        this.onClick && this.onClick();
      });

    if (scene.content) {
      scene.content.add(this);
    } else {
      scene.add.existing(this);
    }
  }

  _textColor() {
    if (this.disabled) return COLORS.mutedHex;
    if (this.variant === 'primary') return '#0A0A0A';
    return COLORS.textHex;
  }

  _draw(state = 'idle') {
    const g = this.bg;
    g.clear();
    const w = this._width, h = this._height, r = RADIUS.md;
    let fill, border;

    if (this.disabled) {
      fill = COLORS.surface;
      border = COLORS.border;
    } else if (this.variant === 'primary') {
      fill = state === 'hover' ? COLORS.accentDim : COLORS.accent;
      border = null;
    } else if (this.variant === 'secondary') {
      fill = state === 'hover' ? COLORS.surface2 : COLORS.surface;
      border = COLORS.border;
    } else {
      fill = state === 'hover' ? COLORS.surface : null;
      border = null;
    }

    if (fill !== null) {
      g.fillStyle(fill, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    }
    if (border !== null) {
      g.lineStyle(1, border, 1);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    }
  }

  _setHover(on) {
    this._draw(on ? 'hover' : 'idle');
    this.scene.tweens.add({ targets: this, scale: on ? 1.01 : 1, duration: MOTION.fast });
  }

  _setPress(on) {
    this.scene.tweens.add({ targets: this, scale: on ? 0.97 : 1.01, duration: 80 });
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    this.label.setColor(this._textColor());
    this._draw();
    this.input.cursor = disabled ? 'default' : 'pointer';
  }

  setLabel(text) {
    this.label.setText(text);
  }

  setVariant(variant) {
    this.variant = variant;
    this.label.setColor(this._textColor());
    this._draw();
  }
}
