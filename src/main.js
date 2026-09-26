import Phaser from 'phaser';
import { COLORS } from './ui/theme.js';
import { installHiDPI } from './core/hidpi.js';

import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { SolverEntryScene } from './scenes/SolverEntryScene.js';
import { ScanScene } from './scenes/ScanScene.js';
import { ScanReviewScene } from './scenes/ScanReviewScene.js';
import { ManualInputScene } from './scenes/ManualInputScene.js';
import { SolverScene } from './scenes/SolverScene.js';
import { LearnScene } from './scenes/LearnScene.js';
import { Cube3DScene } from './scenes/Cube3DScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { AboutScene } from './scenes/AboutScene.js';

// Пробрасываем CSS env() safe-area в JS один раз при старте,
// BaseScene читает window.__SAFE_AREA__ для отступов под чёлку/системные бары.
function readSafeArea() {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);visibility:hidden;';
  document.body.appendChild(probe);
  const top = parseInt(getComputedStyle(probe).paddingTop) || 0;
  const bottom = parseInt(getComputedStyle(probe).paddingBottom) || 0;
  document.body.removeChild(probe);
  window.__SAFE_AREA__ = { top, bottom };
}
readSafeArea();

const config = {
  type: Phaser.AUTO,
  parent: 'phaser-root',
  backgroundColor: COLORS.bgHex,
  scale: {
    mode: Phaser.Scale.RESIZE, // подстраивается под реальный вьюпорт телефона/планшета без скролла
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  // Чёткий рендер на retina-дисплеях: HiDPI-разрешение канваса настраивается
  // в core/hidpi.js, а roundPixels устраняет субпиксельное размытие текста.
  render: {
    roundPixels: true,
    antialias: true,
  },
  scene: [
    BootScene,
    MainMenuScene,
    SolverEntryScene,
    ScanScene,
    ScanReviewScene,
    ManualInputScene,
    SolverScene,
    LearnScene,
    Cube3DScene,
    SettingsScene,
    AboutScene,
  ],
  // Запрещаем скролл/зум страницы поверх канваса (мобильный WebView)
  disableContextMenu: true,
};

const game = new Phaser.Game(config);

// Включаем HiDPI-рендеринг (чёткий текст на телефонах/планшетах с retina-экранами).
installHiDPI(game);

// Предотвращаем resize-скачки при появлении/скрытии мобильной клавиатуры и адресной строки
window.addEventListener('resize', () => {
  readSafeArea();
});
