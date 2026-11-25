// Beginner's (layer-by-layer) solution for a concrete cube, split into teachable
// steps. Unlike the Kociemba solver (shortest solution, impossible to learn from),
// every step here follows the 7-stage method from the Learn screen and uses only
// the algorithms taught there.
//
// Stage 1  white cross (white on top)          — intuitive moves, one edge at a time
//          flip the cube: white to the bottom (z2)
// Stage 2  white corners                       — R U R' U' repeated
// Stage 3  middle layer edges                  — right / left insert algorithms
// Stage 4  yellow cross                        — F R U R' U' F'
// Stage 5  yellow face                         — Sune
// Stage 6  last-layer corners in place         — A-perm
// Stage 7  last-layer edges in place           — U-perm

import {
  FACE_ORDER, FACE_INDEX, CORNERS, EDGES, applyMoves, applyPerm, sequencePerm,
  parseMoves, isSolved,
} from './CubeModel.js';

export const ALGS = {
  cornerInsert: "R U R' U'",
  edgeRight: "U R U' R' U' F' U F",
  edgeLeft: "U' L' U L U F U' F'",
  yellowCross: "F R U R' U' F'",
  sune: "R U R' U R U2 R'",
  aPerm: "R' F R' B2 R F' R' B2 R2",
  uPermA: "F2 U' R' L F2 R L' U' F2",
  uPermB: "F2 U L R' F2 L' R U F2",
};

const faceOf = (i) => FACE_ORDER[(i / 9) | 0];
const ctr = (s, f) => s[FACE_INDEX[f] + 4];
const fits = (s, i) => s[i] === s[(((i / 9) | 0) * 9) + 4];
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const colorsAt = (s, idxs) => idxs.map((i) => s[i]);
const ROT_Y = ['', 'y', 'y2', "y'"];
const TURN_U = ['', 'U', 'U2', "U'"];

// ---------- stage 1: cross via IDA* on tracked stickers ----------
const FACE_MOVES = FACE_ORDER.flatMap((f) => [f, f + "'", f + '2']);
const MOVE_PERMS = Object.fromEntries(FACE_MOVES.map((m) => [m, sequencePerm([m])]));
const OPPOSITE = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };
const AXIS_ORDER = { U: 0, D: 1, R: 0, L: 1, F: 0, B: 1 };

function distTable(home) {
  const key = (p) => p.join(',');
  const dist = new Map([[key(home), 0]]);
  let frontier = [home];
  for (let d = 1; frontier.length; d++) {
    const next = [];
    for (const p of frontier) {
      for (const m of FACE_MOVES) {
        const q = p.map((i) => MOVE_PERMS[m][i]);
        const k = key(q);
        if (!dist.has(k)) { dist.set(k, d); next.push(q); }
      }
    }
    frontier = next;
  }
  return dist;
}

const tableCache = new Map();
function tableFor(home) {
  const k = home.join(',');
  if (!tableCache.has(k)) tableCache.set(k, distTable(home));
  return tableCache.get(k);
}

/** Moves bringing every tracked piece ({cur, home} sticker indices) home. */
function solvePieces(pieces, maxDepth = 10) {
  const tables = pieces.map((p) => tableFor(p.home));
  const h = (pos) => Math.max(...pos.map((p, i) => tables[i].get(p.join(','))));
  const path = [];
  const dfs = (pos, g, bound, last) => {
    const est = h(pos);
    if (est === 0) return true;
    if (g + est > bound) return false;
    for (const m of FACE_MOVES) {
      const f = m[0];
      if (last && (f === last || (OPPOSITE[f] === last && AXIS_ORDER[f] === 0))) continue;
      const next = pos.map((p) => p.map((i) => MOVE_PERMS[m][i]));
      path.push(m);
      if (dfs(next, g + 1, bound, f)) return true;
      path.pop();
    }
    return false;
  };
  const start = pieces.map((p) => p.cur);
  for (let bound = h(start); bound <= maxDepth; bound++) {
    if (dfs(start, 0, bound, null)) return path.slice();
  }
  return null;
}

function crossStage(s, steps) {
  const W = ctr(s, 'U');
  const slots = EDGES.filter(([name]) => name[0] === 'U'); // UR UF UL UB: [uIdx, sideIdx]
  const done = [];
  const remaining = slots.map(([, [u, side]]) => ({ color: ctr(s, faceOf(side)), home: [u, side] }));

  const locate = (state, color) => {
    for (const [, [a, b]] of EDGES) {
      if (state[a] === W && state[b] === color) return [a, b];
      if (state[b] === W && state[a] === color) return [b, a];
    }
    return null;
  };

  while (remaining.length) {
    // Pick the edge that is quickest to place next.
    let best = null;
    for (const e of remaining) {
      const cur = locate(s, e.color);
      const d = tableFor(e.home).get(cur.join(','));
      if (!best || d < best.d) best = { e, cur, d };
    }
    const pieces = [...done.map((d) => ({ cur: locate(s, d.color), home: d.home })), { cur: best.cur, home: best.e.home }];
    const moves = best.d === 0 ? [] : solvePieces(pieces);
    if (moves === null) throw new Error('cross');
    if (moves.length) {
      steps.push({ stage: 1, key: 'tutor.cross', colors: [W, best.e.color], moves });
      s = applyMoves(s, moves);
    }
    done.push(best.e);
    remaining.splice(remaining.indexOf(best.e), 1);
  }
  return s;
}

// ---------- helpers for the algorithmic stages ----------
function push(steps, stage, key, moves, extra = {}) {
  const list = parseMoves(moves);
  if (list.length) steps.push({ stage, key, moves: list, ...extra });
}

/** First rotation r in ROT_Y (and U turn u) that makes pred(state) true. */
function findOrientation(s, pred, turns = ['']) {
  for (const r of ROT_Y) {
    for (const u of turns) {
      const t = applyMoves(s, [r, u].filter(Boolean));
      if (pred(t)) return { r, u, state: t };
    }
  }
  return null;
}

// ---------- stage 2: white corners (white on the bottom) ----------
const DFR = [29, 26, 15], UFR = [8, 20, 9];
const D_CORNERS = CORNERS.filter(([n]) => n[0] === 'D').map(([, idx]) => idx);
const U_CORNERS = CORNERS.filter(([n]) => n[0] === 'U').map(([, idx]) => idx);

function cornersStage(s, steps) {
  const W = ctr(s, 'D');
  const solved = (t, idx) => idx.every((i) => fits(t, i));
  for (let guard = 0; guard < 12 && !D_CORNERS.every((c) => solved(s, c)); guard++) {
    const upCorner = U_CORNERS.find((c) => colorsAt(s, c).includes(W));
    if (upCorner) {
      const colors = colorsAt(s, upCorner);
      const target = colors.filter((c) => c !== W);
      // Hold the cube so the corner's slot is front-right-bottom...
      const o = findOrientation(s, (t) => sameSet([ctr(t, 'F'), ctr(t, 'R')], target));
      push(steps, 2, 'tutor.rotate', o.r, { colors });
      s = o.state;
      // ...then turn the top until the corner is right above it.
      const k = TURN_U.find((u) => sameSet(colorsAt(applyMoves(s, [u].filter(Boolean)), UFR), colors));
      push(steps, 2, 'tutor.corner.align', k, { colors });
      s = applyMoves(s, [k].filter(Boolean));
      let n = 0, moves = [];
      while (!solved(s, DFR) && n < 6) { s = applyMoves(s, ALGS.cornerInsert); moves.push(...parseMoves(ALGS.cornerInsert)); n++; }
      push(steps, 2, 'tutor.corner.insert', moves, { colors, repeat: n, alg: ALGS.cornerInsert });
    } else {
      // A white corner sits in the bottom layer the wrong way: lift it out first.
      const o = findOrientation(s, (t) => !solved(t, DFR) && colorsAt(t, DFR).includes(W));
      push(steps, 2, 'tutor.rotate', o.r, { colors: colorsAt(o.state, DFR) });
      s = o.state;
      push(steps, 2, 'tutor.corner.pop', ALGS.cornerInsert, { colors: colorsAt(s, DFR), alg: ALGS.cornerInsert });
      s = applyMoves(s, ALGS.cornerInsert);
    }
  }
  return s;
}

// ---------- stage 3: middle layer ----------
const U_EDGES = EDGES.filter(([n]) => n[0] === 'U').map(([, idx]) => idx);
const MID_EDGES = EDGES.filter(([n]) => n[0] !== 'U' && n[0] !== 'D').map(([, idx]) => idx);
const UF = [7, 19], FR = [23, 12];

function middleStage(s, steps) {
  const Y = ctr(s, 'U');
  const solved = (t, idx) => idx.every((i) => fits(t, i));
  for (let guard = 0; guard < 12 && !MID_EDGES.every((e) => solved(s, e)); guard++) {
    const up = U_EDGES.find((e) => !colorsAt(s, e).includes(Y));
    if (up) {
      const [top, side] = colorsAt(s, up);
      const o = findOrientation(s, (t) => t[UF[1]] === side && t[UF[0]] === top && ctr(t, 'F') === side, TURN_U);
      push(steps, 3, 'tutor.rotate', o.r, { colors: [side, top] });
      push(steps, 3, 'tutor.edge.align', o.u, { colors: [side, top] });
      s = o.state;
      const right = top === ctr(s, 'R');
      push(steps, 3, right ? 'tutor.edge.right' : 'tutor.edge.left', right ? ALGS.edgeRight : ALGS.edgeLeft, { colors: [side, top], alg: right ? ALGS.edgeRight : ALGS.edgeLeft });
      s = applyMoves(s, right ? ALGS.edgeRight : ALGS.edgeLeft);
    } else {
      const o = findOrientation(s, (t) => !solved(t, FR));
      push(steps, 3, 'tutor.rotate', o.r, { colors: colorsAt(o.state, FR) });
      s = o.state;
      push(steps, 3, 'tutor.edge.pop', ALGS.edgeRight, { colors: colorsAt(s, FR), alg: ALGS.edgeRight });
      s = applyMoves(s, ALGS.edgeRight);
    }
  }
  return s;
}

// ---------- stages 4-7: search over "turn the top" + one algorithm ----------
const AUF = ['U', "U'", 'U2'].map((m) => ({ name: m, moves: [m], perm: sequencePerm([m]), auf: true }));

function macroSearch(s, algs, goal, maxDepth = 8) {
  const macros = [...AUF, ...algs.map((a) => ({ name: a, moves: parseMoves(a), perm: sequencePerm(a) }))];
  const path = [];
  const dfs = (t, depth, lastAuf) => {
    if (goal(t)) return true;
    if (!depth) return false;
    for (const m of macros) {
      if (m.auf && lastAuf) continue;
      path.push(m);
      if (dfs(applyPerm(t, m.perm), depth - 1, !!m.auf)) return true;
      path.pop();
    }
    return false;
  };
  for (let d = 0; d <= maxDepth; d++) if (dfs(s, d, false)) return path.slice();
  throw new Error('macro');
}

function lastLayerStage(s, steps, stage, algs, goal, keys) {
  const plan = macroSearch(s, algs, goal);
  for (const m of plan) {
    if (m.auf) push(steps, stage, keys.align, m.moves);
    else push(steps, stage, keys.alg, m.moves, { alg: m.name });
    s = applyMoves(s, m.moves);
  }
  return s;
}

const U_IDX = [0, 1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Returns { steps, moves } — steps: [{ stage, key, moves, colors?, alg?, repeat? }].
 * `state` must be a valid, solvable cube in the standard orientation.
 */
export function tutorSolve(state) {
  const steps = [];
  let s = state;
  if (isSolved(s)) return { steps, moves: [] };
  s = crossStage(s, steps);
  push(steps, 2, 'tutor.flip', 'z2');
  s = applyMoves(s, 'z2');
  s = cornersStage(s, steps);
  s = middleStage(s, steps);
  const Y = ctr(s, 'U');
  s = lastLayerStage(s, steps, 4, [ALGS.yellowCross], (t) => [1, 3, 5, 7].every((i) => t[i] === Y),
    { align: 'tutor.ll.align', alg: 'tutor.yellowCross' });
  s = lastLayerStage(s, steps, 5, [ALGS.sune], (t) => U_IDX.every((i) => t[i] === Y),
    { align: 'tutor.ll.align', alg: 'tutor.sune' });
  s = lastLayerStage(s, steps, 6, [ALGS.aPerm], (t) => U_CORNERS.every((c) => c.every((i) => fits(t, i))),
    { align: 'tutor.ll.align', alg: 'tutor.aPerm' });
  s = lastLayerStage(s, steps, 7, [ALGS.uPermA, ALGS.uPermB], isSolved,
    { align: 'tutor.ll.align', alg: 'tutor.uPerm' });
  if (!isSolved(s)) throw new Error('tutor failed');
  return { steps, moves: steps.flatMap((st) => st.moves) };
}

export const STAGES = [1, 2, 3, 4, 5, 6, 7];
