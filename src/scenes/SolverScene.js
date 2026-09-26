import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { COLORS, FONT, SPACING } from '../ui/theme.js';
import { CubeRenderer3D } from '../cube/CubeRenderer3D.js';
import { kociembaSolver } from '../solvers/kociemba.js';
import { cfopSolver } from '../solvers/cfop.js';

export class SolverScene extends BaseScene {
  constructor() {
    super('Solver');
  }

  init(data) {
    this.faceletState = data?.faceletState;
    this.algorithm = data?.algorithm || 'kociemba';
    this.moves = [];
    this.currentStep = 0;
    this.playing = false;
  }

  async create() {
    super.create();
    this.addTopBar('Сборка', () => this._exit());

    const { width, height } = this.scale;
    const cx = width / 2;

    this.statusText = this.uiText(cx, this.contentTop + SPACING.md, 'Вычисляем решение…', {
      fontFamily: FONT.family, fontSize: `${FONT.sizes.sm}px`, color: COLORS.mutedHex,
    }).setOrigin(0.5);

    this.moveText = this.uiText(cx, height - this.safeBottom - 170, '', {
      fontFamily: FONT.mono, fontSize: `${FONT.sizes.lg}px`, color: COLORS.textHex, fontStyle: '600',
    }).setOrigin(0.5);

    this.counterText = this.uiText(cx, height - this.safeBottom - 138, '', {
      fontFamily: FONT.family, fontSize: `${FONT.sizes.xs}px`, color: COLORS.mutedHex,
    }).setOrigin(0.5);

    // 3D-канвас монтируется поверх Phaser в #three-root (interactive для orbit-контролов)
    const threeRoot = document.getElementById('three-root');
    threeRoot.classList.add('interactive');
    document.getElementById('phaser-root').style.background = 'transparent';
    this.renderer3D = new CubeRenderer3D(threeRoot);
    this.renderer3D.setState(this.faceletState);
    this.renderer3D.startRenderLoop();

    this._buildTransportControls(cx, height - this.safeBottom - 70);

    this.events.once('shutdown', () => this._cleanup());

    await this._computeSolution();
  }

  _buildTransportControls(cx, y) {
    const gap = 60;
    new Button(this, cx - gap * 2, y, { label: '⏮', width: 48, height: 48, variant: 'secondary', onClick: () => this._toStep(0) });
    new Button(this, cx - gap, y, { label: '‹', width: 48, height: 48, variant: 'secondary', onClick: () => this._step(-1) });
    this.playBtn = new Button(this, cx, y, { label: '▶', width: 56, height: 48, variant: 'primary', onClick: () => this._togglePlay() });
    new Button(this, cx + gap, y, { label: '›', width: 48, height: 48, variant: 'secondary', onClick: () => this._step(1) });
    new Button(this, cx + gap * 2, y, { label: '⏭', width: 48, height: 48, variant: 'secondary', onClick: () => this._toStep(this.moves.length) });
  }

  async _computeSolution() {
    try {
      const solver = this.algorithm === 'cfop' ? cfopSolver : kociembaSolver;
      const result = await solver.solve(this.faceletState);
      this.moves = (result.moveString || '').trim().split(/\s+/).filter(Boolean);
      this.statusText.setText(`Решение найдено: ${this.moves.length} ходов`);
      this._updateMoveDisplay();
    } catch (err) {
      this.statusText.setText('Решатель пока не подключён');
      this.statusText.setColor(COLORS.dangerHex);
      this.moveText.setText(err.message.includes('не подключён') ? 'Заглушка: подключите min2phase.js' : err.message);
    }
  }

  _updateMoveDisplay() {
    const current = this.moves[this.currentStep] || '—';
    this.moveText.setText(current);
    this.counterText.setText(`${this.currentStep} / ${this.moves.length}`);
  }

  async _step(dir) {
    if (this.renderer3D._animating) return;
    const next = this.currentStep + dir;
    if (next < 0 || next > this.moves.length) return;

    if (dir > 0 && this.moves[this.currentStep]) {
      await this.renderer3D.playMove(this.moves[this.currentStep]);
    }
    // TODO: обратный ход (dir < 0) требует инверсии хода и обратного проигрывания анимации

    this.currentStep = next;
    this._updateMoveDisplay();
  }

  _toStep(step) {
    this.currentStep = Phaser.Math.Clamp(step, 0, this.moves.length);
    this._updateMoveDisplay();
    // TODO: пересчитать 3D-состояние куба напрямую в целевой шаг без анимации промежуточных ходов
  }

  _togglePlay() {
    this.playing = !this.playing;
    this.playBtn.setLabel(this.playing ? '❚❚' : '▶');
    if (this.playing) this._playLoop();
  }

  async _playLoop() {
    while (this.playing && this.currentStep < this.moves.length) {
      await this._step(1);
      await new Promise(r => this.time.delayedCall(300, r));
    }
    this.playing = false;
    this.playBtn.setLabel('▶');
  }

  _exit() {
    this._cleanup();
    this.goTo('MainMenu');
  }

  _cleanup() {
    this.playing = false;
    this.renderer3D?.dispose();
    const threeRoot = document.getElementById('three-root');
    threeRoot.classList.remove('interactive');
    document.getElementById('phaser-root').style.background = '';
  }
}
