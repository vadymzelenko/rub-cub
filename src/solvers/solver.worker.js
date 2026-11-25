// Runs the Kociemba two-phase solver off the main thread: building the pruning
// tables takes a few seconds on a phone and would otherwise freeze the UI.
import Cube from 'cubejs';
import { applyMoves, isSolved, parseMoves } from '../cube/CubeModel.js';

let ready = false;
function init() {
  if (!ready) { Cube.initSolver(); ready = true; }
}

self.onmessage = (e) => {
  const { id, type, facelets } = e.data || {};
  try {
    if (type === 'warmup') { init(); self.postMessage({ id, ok: true }); return; }
    if (isSolved(facelets)) { self.postMessage({ id, ok: true, moves: [] }); return; }
    init();
    const moves = parseMoves(Cube.fromString(facelets).solve(22));
    if (!isSolved(applyMoves(facelets, moves))) throw new Error('unsolvable');
    self.postMessage({ id, ok: true, moves });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String((err && err.message) || err) });
  }
};
