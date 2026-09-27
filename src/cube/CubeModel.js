// Модель состояния кубика 3x3 в формате facelet-строки (как в стандарте Kociemba/cubejs):
// 54 символа, порядок граней U R F D L B, каждая грань по 9 наклеек, слева-направо сверху-вниз.
// Индекс 4 каждой грани (центр) — фиксированный цвет этой грани, не меняется вращениями.
//
//            U1 U2 U3
//            U4 U5 U6
//            U7 U8 U9
//  L1 L2 L3  F1 F2 F3  R1 R2 R3  B1 B2 B3
//  L4 L5 L6  F4 F5 F6  R4 R5 R6  B4 B5 B6
//  L7 L8 L9  F7 F8 F9  R7 R8 R9  B7 B8 B9
//            D1 D2 D3
//            D4 D5 D6
//            D7 D8 D9

export const FACE_ORDER = ['U', 'R', 'F', 'D', 'L', 'B'];

export const SOLVED_STATE = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

// Таблицы циклов для базовых поворотов (индексы в 0..53, face-major порядок из FACE_ORDER).
// Каждый поворот описан как список 4-циклов индексов, которые нужно провернуть.
// Сгенерировано по стандартной cubejs-нумерации.
const FACE_INDEX = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };

function idx(face, i) {
  return FACE_INDEX[face] + i; // i: 0..8
}

// Циклы граней (сама грань поворачивается по кругу) + прилегающие полосы.
const MOVE_DEFS = {
  U: {
    face: 'U',
    strips: [
      [idx('F', 0), idx('L', 0), idx('B', 0), idx('R', 0)],
      [idx('F', 1), idx('L', 1), idx('B', 1), idx('R', 1)],
      [idx('F', 2), idx('L', 2), idx('B', 2), idx('R', 2)],
    ],
  },
  D: {
    face: 'D',
    strips: [
      [idx('F', 6), idx('R', 6), idx('B', 6), idx('L', 6)],
      [idx('F', 7), idx('R', 7), idx('B', 7), idx('L', 7)],
      [idx('F', 8), idx('R', 8), idx('B', 8), idx('L', 8)],
    ],
  },
  F: {
    face: 'F',
    strips: [
      [idx('U', 6), idx('R', 0), idx('D', 2), idx('L', 8)],
      [idx('U', 7), idx('R', 3), idx('D', 1), idx('L', 5)],
      [idx('U', 8), idx('R', 6), idx('D', 0), idx('L', 2)],
    ],
  },
  B: {
    face: 'B',
    strips: [
      [idx('U', 0), idx('L', 6), idx('D', 8), idx('R', 2)],
      [idx('U', 1), idx('L', 3), idx('D', 7), idx('R', 5)],
      [idx('U', 2), idx('L', 0), idx('D', 6), idx('R', 8)],
    ],
  },
  L: {
    face: 'L',
    strips: [
      [idx('U', 0), idx('F', 0), idx('D', 0), idx('B', 8)],
      [idx('U', 3), idx('F', 3), idx('D', 3), idx('B', 5)],
      [idx('U', 6), idx('F', 6), idx('D', 6), idx('B', 2)],
    ],
  },
  R: {
    face: 'R',
    strips: [
      [idx('U', 2), idx('B', 6), idx('D', 2), idx('F', 2)],
      [idx('U', 5), idx('B', 3), idx('D', 5), idx('F', 5)],
      [idx('U', 8), idx('B', 0), idx('D', 8), idx('F', 8)],
    ],
  },
};

function rotateFaceCW(state, face) {
  const b = FACE_INDEX[face];
  const s = state.split('');
  const src = [s[b], s[b+1], s[b+2], s[b+3], s[b+4], s[b+5], s[b+6], s[b+7], s[b+8]];
  // поворот 3x3 по часовой: (0,1,2,3,4,5,6,7,8) -> (6,3,0,7,4,1,8,5,2)
  const order = [6, 3, 0, 7, 4, 1, 8, 5, 2];
  order.forEach((from, to) => { s[b + to] = src[from]; });
  return s.join('');
}

/** Применяет один ход (например "R", "U'", "F2") к facelet-строке, возвращает новую строку. */
export function applyMove(state, move) {
  const base = move[0];
  const mod = move.slice(1); // '', "'", "2"
  let times = 1;
  if (mod === "'") times = 3;
  else if (mod === '2') times = 2;

  let s = state;
  for (let t = 0; t < times; t++) {
    s = _applyQuarterTurn(s, base);
  }
  return s;
}

function _applyQuarterTurn(state, face) {
  let s = rotateFaceCW(state, face);
  const arr = s.split('');
  const def = MOVE_DEFS[face];
  def.strips.forEach(([a, b, c, d]) => {
    const tmp = arr[d];
    arr[d] = arr[c];
    arr[c] = arr[b];
    arr[b] = arr[a];
    arr[a] = tmp;
  });
  return arr.join('');
}

/** Применяет последовательность ходов через пробел, напр. "R U R' U'". */
export function applyMoves(state, moveString) {
  const moves = moveString.trim().split(/\s+/).filter(Boolean);
  return moves.reduce((s, m) => applyMove(s, m), state);
}

/** Проверка: все ли 6 центров разные и по 9 каждого цвета — базовая валидация скана. */
export function validateState(state) {
  const errors = [];
  if (!state || state.length !== 54) {
    errors.push('Некорректная длина состояния куба');
    return { valid: false, errors };
  }
  const counts = {};
  for (const ch of state) counts[ch] = (counts[ch] || 0) + 1;
  const colors = Object.keys(counts);
  if (colors.length !== 6) {
    errors.push(`Обнаружено ${colors.length} цветов вместо 6 — переснимите грани с ошибками`);
  }
  for (const c of colors) {
    if (counts[c] !== 9) {
      errors.push(`Цвет ${c}: найдено ${counts[c]} наклеек вместо 9`);
    }
  }
  return { valid: errors.length === 0, errors };
}

// Физические кусочки кубика: индексы наклеек (0..53) в facelet-строке.
// Углы — по 3 наклейки, рёбра — по 2. Нужны для проверки согласованности скана
// (у реального кусочка все наклейки разных цветов).
const CORNERS = {
  URF: [8, 9, 20], UFL: [6, 18, 38], ULB: [0, 36, 47], UBR: [2, 45, 11],
  DFR: [29, 26, 15], DLF: [27, 44, 24], DBL: [33, 53, 42], DRB: [35, 17, 51],
};

const EDGES = {
  UF: [7, 19], UR: [5, 10], UB: [1, 46], UL: [3, 37],
  DF: [28, 25], DR: [32, 16], DB: [34, 52], DL: [30, 43],
  FR: [23, 12], FL: [21, 41], BL: [50, 39], BR: [48, 14],
};

/**
 * Полная проверка состояния: количество цветов (по 9) + невозможные кусочки
 * (совпадающие наклейки внутри одного угла/ребра). Возвращает { valid, errors }.
 */
export function analyzeState(state) {
  const errors = [];
  if (!state || state.length !== 54) {
    return { valid: false, errors: ['Некорректная длина состояния куба'] };
  }
  const counts = {};
  for (const ch of state) counts[ch] = (counts[ch] || 0) + 1;
  for (const [c, n] of Object.entries(counts)) {
    if (n !== 9) errors.push(`Цвет ${c}: ${n} наклеек вместо 9`);
  }
  for (const [name, idxs] of Object.entries(CORNERS)) {
    const [a, b, c] = idxs.map((i) => state[i]);
    if (a === b || b === c || a === c) errors.push(`Угол ${name}: совпадающие наклейки`);
  }
  for (const [name, idxs] of Object.entries(EDGES)) {
    const [a, b] = idxs.map((i) => state[i]);
    if (a === b) errors.push(`Ребро ${name}: совпадающие наклейки`);
  }
  return { valid: errors.length === 0, errors };
}

export class CubeModel {
  constructor(state = SOLVED_STATE) {
    this.state = state;
    this.history = [];
  }

  move(m) {
    this.state = applyMove(this.state, m);
    this.history.push(m);
    return this.state;
  }

  moveSequence(str) {
    str.trim().split(/\s+/).filter(Boolean).forEach(m => this.move(m));
    return this.state;
  }

  isSolved() {
    return FACE_ORDER.every(face => {
      const b = FACE_INDEX[face];
      const center = this.state[b + 4];
      for (let i = 0; i < 9; i++) if (this.state[b + i] !== center) return false;
      return true;
    });
  }

  reset() {
    this.state = SOLVED_STATE;
    this.history = [];
  }

  clone() {
    const c = new CubeModel(this.state);
    c.history = [...this.history];
    return c;
  }
}
