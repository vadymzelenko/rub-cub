import { BaseScene } from './BaseScene.js';
import { Card } from '../ui/Card.js';
import { COLORS, FONT, SPACING } from '../ui/theme.js';

const SETTINGS_ITEMS = [
  { id: 'theme', title: 'Тема', subtitle: 'Тёмная', glyph: '◐' },
  { id: 'language', title: 'Язык', subtitle: 'Русский', glyph: '文' },
  { id: 'camera-calibration', title: 'Калибровка камеры', subtitle: 'Настроить эталонные цвета наклеек', glyph: '⎗' },
  { id: 'move-notation', title: 'Нотация ходов', subtitle: 'Стандартная (U R F D L B)', glyph: '⌘' },
  { id: 'animation-speed', title: 'Скорость анимации', subtitle: 'Обычная', glyph: '▶' },
];

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

    SETTINGS_ITEMS.forEach((item, i) => {
      new Card(this, cx, this.contentTop + 50 + i * 72, {
        width: cardWidth,
        height: 62,
        glyph: item.glyph,
        title: item.title,
        subtitle: item.subtitle,
        onClick: () => this._openSetting(item.id),
      });
    });
  }

  _openSetting(id) {
    // TODO: подэкраны настроек (переключатель темы применяет COLORS-профиль,
    // язык — подключает i18n/ru.js или i18n/en.js, калибровка камеры открывает
    // отдельный флоу для пересъёмки REFERENCE_HSV под конкретный кубик/освещение).
    console.log('Открыть настройку:', id);
  }
}
