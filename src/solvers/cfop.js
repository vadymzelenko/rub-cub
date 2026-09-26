// CFOP (Fridrich): Cross -> F2L -> OLL -> PLL.
// В отличие от Kociemba (оптимальное число ходов), CFOP даёт решение,
// повторяющее логику реального спидкубера — полезно для обучающего режима.
//
// Реализация: OLL (57 кейсов) и PLL (21 кейс) — табличные алгоритмы по
// распознаванию паттерна верхнего слоя. Cross и F2L считаются эвристическим
// поиском в глубину (достаточно для учебных целей, не оптимальны по длине).
//
// Этот файл — структурный каркас с рабочим интерфейсом; полные таблицы
// OLL/PLL (57+21 паттернов) выносятся в отдельные data-файлы по мере наполнения.

import { CubeModel, applyMoves } from '../cube/CubeModel.js';

export const CFOP_STAGES = ['cross', 'f2l', 'oll', 'pll'];

/** Пример структуры одного PLL-кейса. Полная таблица — в data/pllTable.js (TODO). */
export const PLL_TABLE_EXAMPLE = {
  'Ua': { setup: null, algorithm: "R U' R U R U R U' R' U' R2" },
  'Ub': { setup: null, algorithm: "R2 U R U R' U' R' U' R' U R'" },
  // ...остальные 19 кейсов добавляются по мере наполнения таблицы
};

/** Пример структуры одного OLL-кейса. Полная таблица — в data/ollTable.js (TODO). */
export const OLL_TABLE_EXAMPLE = {
  'OLL-21': { algorithm: "R U2 R' U' R U R' U' R U' R'" },
  // ...остальные 56 кейсов добавляются по мере наполнения таблицы
};

export class CfopSolver {
  /**
   * Решает кубик поэтапно, возвращая шаги с пояснениями — формат
   * заточен под обучающий режим (LearnScene), не только под итог.
   * Возвращает: { stages: [{ name, moves, explanation }], moveString, length }
   */
  async solve(faceletState) {
    const cube = new CubeModel(faceletState);
    const stages = [];

    // TODO: реализовать поиск креста (IDA*, глубина <=8)
    const crossMoves = this._solveCross(cube);
    stages.push({ name: 'cross', moves: crossMoves, explanation: 'Собираем белый крест на нижней грани' });

    // TODO: реализовать F2L — 4 пары угол+ребро, интуитивный подбор по 41 кейсу
    const f2lMoves = this._solveF2L(cube);
    stages.push({ name: 'f2l', moves: f2lMoves, explanation: 'Вставляем 4 пары угол-ребро в первые два слоя' });

    // TODO: распознавание по маске верхних наклеек -> OLL_TABLE
    const ollMoves = this._solveOLL(cube);
    stages.push({ name: 'oll', moves: ollMoves, explanation: 'Ориентируем последний слой в один цвет' });

    // TODO: распознавание перестановки по углам/рёбрам -> PLL_TABLE
    const pllMoves = this._solvePLL(cube);
    stages.push({ name: 'pll', moves: pllMoves, explanation: 'Переставляем детали последнего слоя на места' });

    const allMoves = stages.flatMap(s => s.moves);
    return {
      stages,
      moveString: allMoves.join(' '),
      length: allMoves.length,
    };
  }

  _solveCross(cube) {
    throw new Error('Cross solver ещё не реализован');
  }
  _solveF2L(cube) {
    throw new Error('F2L solver ещё не реализован');
  }
  _solveOLL(cube) {
    throw new Error('OLL recognition ещё не реализован');
  }
  _solvePLL(cube) {
    throw new Error('PLL recognition ещё не реализован');
  }
}

export const cfopSolver = new CfopSolver();
