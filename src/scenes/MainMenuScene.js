import { BaseScene } from './BaseScene.js';
import { Card } from '../ui/Card.js';
import { COLORS, FONT, SPACING } from '../ui/theme.js';

const MENU_ITEMS = [
  { key: 'SolverEntry', glyph: '◱', title: 'Собрать кубик', subtitle: 'Скан камерой или ручной ввод' },
  { key: 'Learn', glyph: '◇', title: 'Обучение', subtitle: 'Разбор по шагам, простой метод' },
  { key: 'Settings', glyph: '⚙', title: 'Настройки', subtitle: 'Тема, язык, управление' },
  { key: 'About', glyph: 'ⓘ', title: 'О программе', subtitle: 'Автор, версия, источники' },
];

export class MainMenuScene extends BaseScene {
  constructor() {
    super('MainMenu');
  }

  create() {
    super.create();
    const { width } = this.scale;
    const cx = width / 2;

    // Заголовок — единственный акцентный момент экрана, без ALLCAPS-эйброла.
    this.uiText(cx, this.contentTop + SPACING.xxl, 'Кубик', {
      fontFamily: FONT.family,
      fontSize: `${this.isTablet ? 40 : FONT.sizes.xxl}px`,
      color: COLORS.textHex,
      fontStyle: '600',
    }).setOrigin(0.5);

    this.uiText(cx, this.contentTop + SPACING.xxl + 36, 'Сканируй, собирай, изучай', {
      fontFamily: FONT.family,
      fontSize: `${FONT.sizes.sm}px`,
      color: COLORS.mutedHex,
    }).setOrigin(0.5);

    // Список карточек: на планшете — шире и в 2 колонки, на телефоне — 1 колонка.
    const cardWidth = this.isTablet ? Math.min(420, width * 0.42) : Math.min(360, width - SPACING.lg * 2);
    const cardHeight = 84;
    const gap = SPACING.md;
    const startY = this.contentTop + 150;

    if (this.isTablet) {
      const cols = 2;
      const colGap = SPACING.lg;
      const totalW = cardWidth * cols + colGap;
      const originX = cx - totalW / 2 + cardWidth / 2;
      MENU_ITEMS.forEach((item, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = originX + col * (cardWidth + colGap);
        const y = startY + row * (cardHeight + gap);
        new Card(this, x, y, {
          width: cardWidth,
          height: cardHeight,
          glyph: item.glyph,
          title: item.title,
          subtitle: item.subtitle,
          onClick: () => this.goTo(item.key),
        });
      });
    } else {
      MENU_ITEMS.forEach((item, i) => {
        const y = startY + i * (cardHeight + gap);
        new Card(this, cx, y, {
          width: cardWidth,
          height: cardHeight,
          glyph: item.glyph,
          title: item.title,
          subtitle: item.subtitle,
          onClick: () => this.goTo(item.key),
        });
      });
    }
  }
}
