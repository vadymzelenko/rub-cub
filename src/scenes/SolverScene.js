import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { COLORS, FONT, SPACING } from '../ui/theme.js';
import { kociembaSolver } from '../solvers/kociemba.js';
import { cfopSolver } from '../solvers/cfop.js';

/**
 * Экран сборки: показывает последовательность ходов и позволяет листать её.
 * 3D-визуализация вырезана — вместо неё крупный текущий ход и лента ходов.
 */
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

    this.moveText = this.uiText(cx, this.contentTop + SPACING.xl + 26, '', {
      fontFamily: FONT.mono, fontSize: '34px', color: COLORS.textHex, fontStyle: '600',
    }).setOrigin(0.5);

    this.counterText = this.uiText(cx, this.contentTop + SPACING.xl + 72, '', {
      fontFamily: FONT.family, fontSize: `${FONT.sizes.xs}px`, color: COLORS.mutedHex,
    }).setOrigin(0.5);

    this.movesText = this.uiText(cx, this.contentTop + 150, '', {
      fontFamily: FONT.mono, fontSize: `${FONT.sizes.sm}px`, color: COLORS.textHex,
      align: 'center', wordWrap: { width: width - SPACING.lg * 2 }, lineSpacing: 6,
    }).setOrigin(0.5, 0);

    this._buildControls(cx, height - this.safeBottom - 56);

    await this._computeSolution();
  }

  _buildControls(cx, y) {
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
      this.statusText.setText(`Решение: ${this.moves.length} ходов`);
      this._updateDisplay();
    } catch (err) {
      this.statusText.setText('Решатель пока не подключён');
      this.statusText.setColor(COLORS.dangerHex);
      this.movesText.setText(
        'Ввод кубика работает.\nДля расчёта решения нужно подключить движок решателя (например, min2phase.js).'
      );
    }
  }

  _updateDisplay() {
    this.moveText.setText(this.moves[this.currentStep] || '—');
    this.counterText.setText(`${this.currentStep} / ${this.moves.length}`);
    const from = Math.max(0, this.currentStep - 4);
    const to = Math.min(this.moves.length, this.currentStep + 5);
    this.movesText.setText(this.moves.slice(from, to).join(' '));
  }

  _step(dir) {
    const next = this.currentStep + dir;
    if (next < 0 || next > this.moves.length) return;
    this.currentStep = next;
    this._updateDisplay();
  }

  _toStep(step) {
    this.currentStep = Phaser.Math.Clamp(step, 0, this.moves.length);
    this._updateDisplay();
  }

  _togglePlay() {
    this.playing = !this.playing;
    this.playBtn.setLabel(this.playing ? '❚❚' : '▶');
    if (this.playing) this._playLoop();
  }

  async _playLoop() {
    while (this.playing && this.currentStep < this.moves.length) {
      this._step(1);
      await new Promise(r => this.time.delayedCall(400, r));
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
  }
}

