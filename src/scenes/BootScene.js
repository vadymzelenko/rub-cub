export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Здесь позже: шрифты (WebFont), звуки кликов (опционально), иконки-спрайты.
    // OpenCV.js и Three.js НЕ грузим тут — только по требованию нужных сцен,
    // чтобы не раздувать время холодного старта приложения.
  }

  create() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';

    this.scene.start('MainMenu');
  }
}
