// Facelet model of a 3x3 cube, in the Kociemba / cubejs string format:
// 54 characters, faces in the order U R F D L B, 9 stickers each, row by row.
// Index 4 of each face is the centre; it never moves.
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
/** A state with only the centres set; '?' marks an unknown sticker. */
export const EMPTY_STATE = FACE_ORDER.map((f) => '????' + f + '????').join('');

const FACE_INDEX = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };
const idx = (face, i) => FACE_INDEX[face] + i;

// Each quarter turn = rotate the face itself + three 4-cycles of the adjacent strips.
// Verified against cubejs for every move.
const MOVE_DEFS = {
  U: [[idx('F', 0), idx('L', 0), idx('B', 0), idx('R', 0)], [idx('F', 1), idx('L', 1), idx('B', 1), idx('R', 1)], [idx('F', 2), idx('L', 2), idx('B', 2), idx('R', 2)]],
  D: [[idx('F', 6), idx('R', 6), idx('B', 6), idx('L', 6)], [idx('F', 7), idx('R', 7), idx('B', 7), idx('L', 7)], [idx('F', 8), idx('R', 8), idx('B', 8), idx('L', 8)]],
  F: [[idx('U', 6), idx('R', 0), idx('D', 2), idx('L', 8)], [idx('U', 7), idx('R', 3), idx('D', 1), idx('L', 5)], [idx('U', 8), idx('R', 6), idx('D', 0), idx('L', 2)]],
  B: [[idx('U', 0), idx('L', 6), idx('D', 8), idx('R', 2)], [idx('U', 1), idx('L', 3), idx('D', 7), idx('R', 5)], [idx('U', 2), idx('L', 0), idx('D', 6), idx('R', 8)]],
  L: [[idx('U', 0), idx('F', 0), idx('D', 0), idx('B', 8)], [idx('U', 3), idx('F', 3), idx('D', 3), idx('B', 5)], [idx('U', 6), idx('F', 6), idx('D', 6), idx('B', 2)]],
  R: [[idx('U', 2), idx('B', 6), idx('D', 2), idx('F', 2)], [idx('U', 5), idx('B', 3), idx('D', 5), idx('F', 5)], [idx('U', 8), idx('B', 0), idx('D', 8), idx('F', 8)]],
};
const CW = [6, 3, 0, 7, 4, 1, 8, 5, 2];

function quarterTurn(arr, face) {
  const b = FACE_INDEX[face];
  const src = arr.slice(b, b + 9);
  CW.forEach((from, to) => { arr[b + to] = src[from]; });
  for (const [a, c1, c2, d] of MOVE_DEFS[face]) {
    const tmp = arr[d];
    arr[d] = arr[c2]; arr[c2] = arr[c1]; arr[c1] = arr[a]; arr[a] = tmp;
  }
}

export function isValidMove(move) {
  return /^[URFDLB](2|')?$/.test(move);
}

/** Applies a single move ("R", "U'", "F2") and returns the new state. */
export function applyMove(state, move) {
  if (!isValidMove(move)) throw new Error('Bad move: ' + move);
  const times = move[1] === "'" ? 3 : move[1] === '2' ? 2 : 1;
  const arr = state.split('');
  for (let t = 0; t < times; t++) quarterTurn(arr, move[0]);
  return arr.join('');
}

export function parseMoves(moves) {
  if (Array.isArray(moves)) return moves;
  return String(moves || '').trim().split(/\s+/).filter(Boolean);
}

export function applyMoves(state, moves) {
  return parseMoves(moves).reduce(applyMove, state);
}

export function invertMove(move) {
  if (move[1] === '2') return move;
  return move[1] === "'" ? move[0] : move[0] + "'";
}

export function invertMoves(moves) {
  return parseMoves(moves).slice().reverse().map(invertMove);
}

export function isSolved(state) {
  return FACE_ORDER.every((face) => {
    const b = FACE_INDEX[face];
    for (let i = 0; i < 9; i++) if (state[b + i] !== state[b + 4]) return false;
    return true;
  });
}

// Physical pieces: sticker indices in cubejs order (first sticker is U/D for every corner
// and edge in the U/D layers, F/B for the middle-layer edges).
const CORNERS = [
  ['URF', [8, 9, 20]], ['UFL', [6, 18, 38]], ['ULB', [0, 36, 47]], ['UBR', [2, 45, 11]],
  ['DFR', [29, 26, 15]], ['DLF', [27, 44, 24]], ['DBL', [33, 53, 42]], ['DRB', [35, 17, 51]],
];
const EDGES = [
  ['UR', [5, 10]], ['UF', [7, 19]], ['UL', [3, 37]], ['UB', [1, 46]],
  ['DR', [32, 16]], ['DF', [28, 25]], ['DL', [30, 43]], ['DB', [34, 52]],
  ['FR', [23, 12]], ['FL', [21, 41]], ['BL', [50, 39]], ['BR', [48, 14]],
];

function parity(perm) {
  let p = 0;
  const seen = new Array(perm.length).fill(false);
  for (let i = 0; i < perm.length; i++) {
    if (seen[i]) continue;
    let len = 0;
    for (let j = i; !seen[j]; j = perm[j]) { seen[j] = true; len++; }
    p += len - 1;
  }
  return p % 2;
}

/**
 * Full solvability check. Returns { valid, errors } where every error is
 * { key, vars } — an i18n key plus values, so the UI can show it in any language.
 * `vars.piece` is a position name such as "URF" (translate each letter with face.*).
 */
export function analyzeState(state) {
  const errors = [];
  if (!state || state.length !== 54) return { valid: false, errors: [{ key: 'err.length' }] };

  const unknown = [...state].filter((c) => !FACE_ORDER.includes(c)).length;
  if (unknown) return { valid: false, errors: [{ key: 'err.unknown', vars: { n: unknown } }] };

  const centers = FACE_ORDER.map((f) => state[FACE_INDEX[f] + 4]);
  if (new Set(centers).size !== 6) errors.push({ key: 'err.centers' });

  const counts = Object.fromEntries(FACE_ORDER.map((f) => [f, 0]));
  for (const ch of state) counts[ch]++;
  for (const f of FACE_ORDER) {
    if (counts[f] !== 9) errors.push({ key: 'err.count', vars: { color: f, n: counts[f] } });
  }
  if (errors.length) return { valid: false, errors };

  // Corners
  const cornerPerm = [];
  let twist = 0;
  let piecesOk = true;
  for (const [name, ids] of CORNERS) {
    const c = ids.map((i) => state[i]);
    const ori = c.findIndex((x) => x === 'U' || x === 'D');
    const rot = ori < 0 ? null : [c[ori], c[(ori + 1) % 3], c[(ori + 2) % 3]].join('');
    const piece = rot ? CORNERS.findIndex(([, d]) => d.map((i) => SOLVED_STATE[i]).join('') === rot) : -1;
    if (piece < 0) {
      piecesOk = false;
      errors.push({ key: new Set(c).size < 3 ? 'err.cornerSame' : 'err.cornerBad', vars: { piece: name } });
      continue;
    }
    cornerPerm.push(piece);
    twist += ori;
  }

  // Edges
  const edgePerm = [];
  let flip = 0;
  for (const [name, ids] of EDGES) {
    const [a, b] = ids.map((i) => state[i]);
    let piece = -1, f = 0;
    EDGES.forEach(([, d], j) => {
      const [x, y] = d.map((i) => SOLVED_STATE[i]);
      if (x === a && y === b) { piece = j; f = 0; }
      else if (x === b && y === a) { piece = j; f = 1; }
    });
    if (piece < 0) {
      piecesOk = false;
      errors.push({ key: a === b ? 'err.edgeSame' : 'err.edgeBad', vars: { piece: name } });
      continue;
    }
    edgePerm.push(piece);
    flip += f;
  }
  if (!piecesOk) return { valid: false, errors };

  if (new Set(cornerPerm).size !== 8) errors.push({ key: 'err.cornerDup' });
  if (new Set(edgePerm).size !== 12) errors.push({ key: 'err.edgeDup' });
  if (errors.length) return { valid: false, errors };

  if (twist % 3 !== 0) errors.push({ key: 'err.twist' });
  if (flip % 2 !== 0) errors.push({ key: 'err.flip' });
  if (parity(cornerPerm) !== parity(edgePerm)) errors.push({ key: 'err.parity' });
  return { valid: errors.length === 0, errors };
}

/** Random solvable state (used by the "scramble" demo in manual input). */
export function randomScramble(length = 22) {
  const faces = FACE_ORDER;
  const axis = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 };
  const out = [];
  while (out.length < length) {
    const f = faces[Math.floor(Math.random() * 6)];
    const prev = out[out.length - 1];
    const prev2 = out[out.length - 2];
    if (prev && prev[0] === f) continue;
    if (prev && prev2 && axis[prev[0]] === axis[f] && prev2[0] === f) continue;
    out.push(f + ['', "'", '2'][Math.floor(Math.random() * 3)]);
  }
  return out;
}
