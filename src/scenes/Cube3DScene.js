import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { COLORS, FONT, SPACING } from '../ui/theme.js';
import { CubeRenderer3D } from '../cube/CubeRenderer3D.js';
import { CubeModel } from '../cube/CubeModel.js';

const MOVE_BUTTONS = ['U', "U'", 'D', "D'", 'F', "F'", 'B', "B'", 'L', "L'", 'R', "R'"];

/**
 * Свободный 3D-визуализатор: вращение куба пальцем/мышью (orbit),
 * ряд кнопок ходов для тренировки алгоритмов, кнопка "перемешать" и "сброс".
 */
export class Cube3DScene extends BaseScene {
  constructor() {
    super('Cube3D');
  }

  create() {
    super.create();
    this.addTopBar('3D-визуализатор', () => this._exit());

    const { width, height } = this.scale;
    const cx = width / 2;

    this.model = new CubeModel();

    const threeRoot = document.getElementById('three-root');
    threeRoot.classList.add('interactive');
    document.getElementById('phaser-root').style.background = 'transparent';
    this.renderer3D = new CubeRenderer3D(threeRoot);
    this.renderer3D.startRenderLoop();

    this._setupOrbitDrag(threeRoot);
    this._buildMoveGrid(cx, height - this.safeBottom - 180);
    this._buildActionRow(cx, height - this.safeBottom - 50);

    this.events.once('shutdown', () => this._cleanup());
  }

  _setupOrbitDrag(el) {
    this.theta = Math.PI / 4;
    this.phi = Math.PI / 3;
    let dragging = false, lastX = 0, lastY = 0;

    el.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener('pointerup', () => { dragging = false; });
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      this.theta -= dx * 0.008;
      this.phi = Phaser.Math.Clamp(this.phi - dy * 0.008, 0.3, Math.PI - 0.3);
      this.renderer3D.setOrbit(this.theta, this.phi);
    });
    this.renderer3D.setOrbit(this.theta, this.phi);
    this._orbitDragEl = el;
  }

  _buildMoveGrid(cx, y) {
    const cols = 6;
    const btnW = 48, btnH = 40, gap = 6;
    const totalW = cols * btnW + (cols - 1) * gap;
    const originX = cx - totalW / 2 + btnW / 2;

    MOVE_BUTTONS.forEach((move, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = originX + col * (btnW + gap);
      const rowY = y + row * (btnH + gap);
      new Button(this, x, rowY, {
        label: move, width: btnW, height: btnH, variant: 'secondary',
        onClick: () => this._doMove(move),
      });
    });
  }

  _buildActionRow(cx, y) {
    new Button(this, cx - 110, y, { label: 'Перемешать', width: 140, variant: 'secondary', onClick: () => this._scramble() });
    new Button(this, cx + 60, y, { label: 'Сброс', width: 100, variant: 'ghost', onClick: () => this._reset() });
  }

  async _doMove(move) {
    this.model.move(move);
    await this.renderer3D.playMove(move);
  }

  async _scramble() {
    const faces = ['U', 'D', 'F', 'B', 'L', 'R'];
    const mods = ['', "'", '2'];
    for (let i = 0; i < 20; i++) {
      const move = faces[Phaser.Math.Between(0, 5)] + mods[Phaser.Math.Between(0, 2)];
      await this._doMove(move);
    }
  }

  _reset() {
    this.model.reset();
    this.renderer3D.setState(this.model.state);
  }

  _exit() {
    this._cleanup();
    this.goTo('MainMenu');
  }

  _cleanup() {
    this.renderer3D?.dispose();
    const threeRoot = document.getElementById('three-root');
    threeRoot.classList.remove('interactive');
    document.getElementById('phaser-root').style.background = '';
  }
}
