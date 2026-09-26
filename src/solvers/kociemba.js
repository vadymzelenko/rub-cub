// Обёртка над Kociemba Two-Phase алгоритмом.
//
// РЕШЕНИЕ ПО ИНТЕГРАЦИИ: не переизобретаем алгоритм — используем готовый
// проверенный JS-порт (напр. `min2phase.js` / `cubejs`). Расчёт запускаем
// в Web Worker, чтобы не блокировать анимацию/UI-поток на телефоне.
//
// Здесь — фасад с реальным интерфейсом, который будет использовать остальное
// приложение; внутренняя реализация solveRaw() подключится к воркеру когда
// библиотека будет добавлена в /src/solvers/vendor/min2phase.js.

export class KociembaSolver {
  constructor() {
    this.ready = false;
    this.worker = null;
  }

  /** Инициализация: поднимает Web Worker и прогревает таблицы поиска (может занять 1-2 сек первый раз). */
  async init(onProgress) {
    if (this.ready) return;
    // TODO: заменить на реальный воркер после подключения min2phase.js:
    // this.worker = new Worker(new URL('./kociembaWorker.js', import.meta.url), { type: 'module' });
    onProgress?.(1);
    this.ready = true;
  }

  /**
   * Решает кубик из facelet-строки (54 символа, порядок URFDLB).
   * Возвращает { moves: string[], moveString: string, length: number }.
   */
  async solve(faceletState) {
    if (!this.ready) await this.init();

    // Заглушка до подключения реальной библиотеки — интерфейс финальный,
    // реализация solveRaw заменяется без изменений в остальном приложении.
    const result = await this._solveRaw(faceletState);
    return result;
  }

  async _solveRaw(faceletState) {
    throw new Error(
      'Kociemba solver ещё не подключён: добавьте min2phase.js в src/solvers/vendor/ ' +
      'и реализуйте _solveRaw через postMessage к воркеру.'
    );
  }
}

export const kociembaSolver = new KociembaSolver();
