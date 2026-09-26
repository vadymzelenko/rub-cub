import { COLORS, isTablet } from '../ui/theme.js';
import { TopBar } from '../ui/TopBar.js';
import { applySceneHiDPI } from '../core/hidpi.js';

/**
 * Базовый класс для всех сцен-экранов.
 * Даёт: заливку фона, safe-area отступы, флаг isTablet, единообразный TopBar.
 *
 * Адаптация под экраны: весь контент сцены кладётся в масштабируемый контейнер
 * `this.content`. Контейнер равномерно сжимается (uiScale <= 1), когда доступной
 * высоты меньше эталонной, и при этом остаётся прижатым к верхней кромке и
 * отцентрированным по горизонтали. Благодаря этому интерфейс никогда не
 * вылезает за экран — на маленьких/коротких экранах он просто чуть меньше.
 */
export class BaseScene extends Phaser.Scene {
  create() {
    const { width, height } = this.scale;
    this.isTablet = isTablet(width);

    this.cameras.main.setBackgroundColor(COLORS.bgHex);

    // Safe-area из CSS env(), проброшенная в window при старте (main.js)
    this.safeTop = window.__SAFE_AREA__?.top || 0;
    this.safeBottom = window.__SAFE_AREA__?.bottom || 0;

    this.contentTop = this.safeTop;
    this.contentHeight = height - this.safeTop - this.safeBottom;

    // HiDPI: вьюпорт камеры в пикселях устройства + zoom, чтобы мир оставался в CSS-пикселях.
    applySceneHiDPI(this);

    // Корневой контейнер контента: масштабируется, чтобы влезть в доступную высоту.
    this.content = this.add.container(0, 0);
    this._layoutContent();

    // При повороте/изменении вьюпорта пересчитываем масштаб и позицию контейнера.
    this._resizeHandler = () => this._layoutContent();
    this.scale.on(Phaser.Scale.Events.RESIZE, this._resizeHandler);
    this.events.once('shutdown', () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this._resizeHandler);
    });
  }

  /**
   * Эталонная высота контента, под которую писаны раскладки сцен.
   * Если доступно меньше — контент сжимается, если больше — остаётся 1:1.
   */
  _computeUIScale() {
    const REF_H = 660;
    const s = this.contentHeight / REF_H;
    return Phaser.Math.Clamp(s, 0.4, 1);
  }

  _layoutContent() {
    const width = this.scale.width;
    this.uiScale = this._computeUIScale();
    const s = this.uiScale;

    // Масштаб вокруг origin (0,0) + смещение так, чтобы центр остался в центре,
    // а верх контента — на contentTop (под TopBar).
    this.content.setScale(s);
    this.content.setPosition(width / 2 * (1 - s), this.contentTop * (1 - s));
  }

  addTopBar(title, onBack) {
    this.topBar = new TopBar(this, this.scale.width, {
      title,
      safeTop: this.safeTop,
      onBack,
    });
    this.contentTop = this.safeTop + this.topBar.height;
    this.contentHeight = this.scale.height - this.contentTop - this.safeBottom;
    this._layoutContent();
    return this.topBar;
  }

  // --- Хелперы: создают объект и сразу кладут его в масштабируемый контейнер ---

  uiText(x, y, str, style) {
    const t = this.add.text(x, y, str, style);
    this.content.add(t);
    return t;
  }

  uiGraphics() {
    const g = this.add.graphics();
    this.content.add(g);
    return g;
  }

  uiRect(x, y, w, h, fill, alpha) {
    const r = this.add.rectangle(x, y, w, h, fill, alpha);
    this.content.add(r);
    return r;
  }

  uiCircle(x, y, r, fill, alpha) {
    const c = this.add.circle(x, y, r, fill, alpha);
    this.content.add(c);
    return c;
  }

  goTo(sceneKey, data) {
    this.scene.start(sceneKey, data);
  }
}

