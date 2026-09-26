// CFOP (Fridrich): Cross -> F2L -> OLL -> PLL.
// Полная пошаговая раскладка CFOP — отдельная большая задача (таблицы OLL/PLL).
// Сейчас для расчёта используем тот же проверенный движок Kociemba, чтобы
// приложение собирало куб корректно при любом выбранном алгоритме.
import { solveKociemba } from './kociemba.js';

export async function solveCfop(facelets) {
  const result = await solveKociemba(facelets);
  return { ...result, note: 'CFOP-раскладка по шагам — в разработке; решение посчитано движком Kociemba.' };
}
