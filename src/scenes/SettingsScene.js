import { BaseScene } from './BaseScene.js';
import { Card } from '../ui/Card.js';
import { COLORS, FONT, SPACING } from '../ui/theme.js';

// Простое хранилище настроек (без персистентности — можно позже подключить localStorage).
export const settingsStore = {
  theme: 0,          // 0 тёмная, 1 светлая
  language: 0,       // 0 русский, 1 english
  notation: 0,       // 0 стандартная
  speed: 0,          // 0 обычная, 1 быстрая, 2 медленная
};

const OPTIONS = {
  theme: ['Тёмная', 'Светлая'],
  language: ['Русский', 'English'],
  notation: ['Стандартная', 'Singmaster'],
  speed: ['Обычная', 'Быстрая', 'Медленная'],
};

export class SettingsScene extends BaseScene {
  constructor() {
    super('Settings');
  }

  create() {
    super.create();
    this.addTopBar('Настройки', () => this.goTo('MainMenu'));

    const { width } = this.scale;
    const cx = width / 2;
    const cardWidth = Math.min(380, width - SPACING.lg * 2);

    this.cards = {};

    const items = [
      { id: 'theme', glyph: '◐', title: 'Тема' },
      { id: 'language', glyph: '文', title: 'Язык' },
      { id: 'notation', glyph: '⌘', title: 'Нотация ходов' },
      { id: 'speed', glyph: '▶', title: 'Скорость анимации' },
    ];

    items.forEach((item, i) => {
      const card = new Card(this, cx, this.contentTop + 50 + i * 72, {
        width: cardWidth,
        height: 62,
        glyph: item.glyph,
        title: item.title,
        subtitle: OPTIONS[item.id][settingsStore[item.id]],
        onClick: () => this._cycle(item.id),
      });
      this.cards[item.id] = card;
    });

    this.statusText = this.uiText(cx, this.scale.height - this.safeBottom - 40, '', {
      fontFamily: FONT.family, fontSize: `${FONT.sizes.xs}px`, color: COLORS.mutedHex,
    }).setOrigin(0.5);

    this._applyTheme();
  }

  _cycle(id) {
    const opts = OPTIONS[id];
    settingsStore[id] = (settingsStore[id] + 1) % opts.length;
    this.cards[id].subtitleText.setText(opts[settingsStore[id]]);

    if (id === 'theme') this._applyTheme();

    this.statusText.setText(`${this._title(id)}: ${opts[settingsStore[id]]}`);
    this._flashStatus();
  }

  _title(id) {
    return { theme: 'Тема', language: 'Язык', notation: 'Нотация', speed: 'Скорость' }[id];
  }

  _applyTheme() {
    // Лёгкая смена фона как наглядный отклик (полный ре-темминг — отдельная задача).
    const light = settingsStore.theme === 1;
    const bg = light ? '#F5F5F5' : COLORS.bgHex;
    this.cameras.main.setBackgroundColor(bg);
    document.body.style.background = bg;
  }

  _flashStatus() {
    this.statusText.setColor(COLORS.accentHex);
    this.time.delayedCall(800, () => this.statusText.setColor(COLORS.mutedHex));
  }
}

