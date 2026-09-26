import { BaseScene } from './BaseScene.js';
import { Card } from '../ui/Card.js';
import { COLORS, FONT, SPACING } from '../ui/theme.js';

// Обучение построено на CFOP_STAGES / beginner method — 7 этапов классического
// послойного метода, каждый со своим объяснением и интерактивной демонстрацией на 3D-кубе.
const LESSONS = [
  { id: 'cross', title: '1. Крест', desc: 'Собираем белый крест на первой грани' },
  { id: 'corners', title: '2. Угловые элементы', desc: 'Завершаем первый слой' },
  { id: 'middle', title: '3. Второй слой', desc: 'Вставляем рёбра среднего слоя' },
  { id: 'oll-cross', title: '4. Жёлтый крест', desc: 'Ориентируем рёбра последнего слоя' },
  { id: 'oll-corners', title: '5. Жёлтые углы', desc: 'Ориентируем углы последнего слоя' },
  { id: 'pll-corners', title: '6. Расстановка углов', desc: 'Переставляем угловые элементы' },
  { id: 'pll-edges', title: '7. Расстановка рёбер', desc: 'Финальный шаг сборки' },
];

export class LearnScene extends BaseScene {
  constructor() {
    super('Learn');
  }

  create() {
    super.create();
    this.addTopBar('Обучение', () => this.goTo('MainMenu'));

    const { width } = this.scale;
    const cx = width / 2;
    const cardWidth = Math.min(380, width - SPACING.lg * 2);

    this.uiText(cx, this.contentTop + SPACING.md, 'Простой послойный метод — 7 шагов', {
      fontFamily: FONT.family, fontSize: `${FONT.sizes.sm}px`, color: COLORS.mutedHex,
    }).setOrigin(0.5, 0);

    LESSONS.forEach((lesson, i) => {
      new Card(this, cx, this.contentTop + 60 + i * 72, {
        width: cardWidth,
        height: 62,
        title: lesson.title,
        subtitle: lesson.desc,
        onClick: () => this._openLesson(lesson.id),
      });
    });
  }

  _openLesson(id) {
    // TODO: отдельная сцена LessonDetailScene с показом конкретного шага.
    console.log('Открыть урок:', id);
  }
}
