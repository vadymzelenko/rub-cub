// Kociemba Two-Phase решатель на базе cube.js (проверенный JS-порт).
// Вход — facelet-строка из 54 символов в порядке U R F D L B (совпадает с CubeModel).
import Cube from 'cubejs';

let initialized = false;

/**
 * Решает кубик. Возвращает { moves: string[], moveString, length }.
 * Первый вызов инициализирует таблицы (несколько секунд) — делаем это асинхронно,
 * чтобы UI успел показать индикатор загрузки.
 */
export async function solveKociemba(facelets) {
  if (!initialized) {
    await new Promise((r) => setTimeout(r, 30));
    Cube.initSolver();
    initialized = true;
  }

  const cube = Cube.fromString(facelets);
  const solution = cube.solve();
  const moves = (solution || '').trim().split(/\s+/).filter(Boolean);
  return { moves, moveString: moves.join(' '), length: moves.length };
}
