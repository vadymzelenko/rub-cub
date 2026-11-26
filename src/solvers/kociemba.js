// Promise wrapper around the solver worker.
let worker = null;
let seq = 0;
const pending = new Map();

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./solver.worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => {
    const { id, ok, moves, error } = e.data;
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    if (ok) p.resolve(moves || []);
    else p.reject(new Error(error));
  };
  worker.onerror = (e) => {
    for (const p of pending.values()) p.reject(new Error(e.message || 'worker error'));
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

function call(msg) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, ...msg });
  });
}

/** Builds the solver tables in the background so the first solve is instant. */
export function warmupSolver() {
  return call({ type: 'warmup' }).catch(() => {});
}

/** Resolves to an array of moves such as ["R", "U'", "F2"]. */
export function solveKociemba(facelets) {
  return call({ type: 'solve', facelets });
}
