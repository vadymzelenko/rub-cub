import { useCallback, useEffect, useRef, useState } from 'react';
import { applyMoves, invertMove } from '../cube/CubeModel.js';

/**
 * Drives a Cube3D through a list of moves: step forward/back with animation,
 * autoplay, and jumping to any position. `step` = number of moves already done;
 * `active` = index of the move to highlight (the one animating, else the next one).
 */
export function useMovePlayer(cubeRef, start, moves, duration) {
  const [step, setStep] = useState(0);
  const [anim, setAnim] = useState(null);
  const [playing, setPlaying] = useState(false);
  const stepRef = useRef(0);
  const busy = useRef(false);
  const gen = useRef(0);
  const playingRef = useRef(false);
  const durRef = useRef(duration);
  durRef.current = duration;
  const movesRef = useRef(moves);
  movesRef.current = moves;

  const stop = useCallback(() => { playingRef.current = false; setPlaying(false); }, []);

  const goTo = useCallback((n) => {
    const list = movesRef.current || [];
    playingRef.current = false; setPlaying(false);
    gen.current++;
    busy.current = false;
    n = Math.max(0, Math.min(list.length, n));
    stepRef.current = n;
    setStep(n);
    setAnim(null);
    cubeRef.current?.setState(applyMoves(start, list.slice(0, n)));
  }, [cubeRef, start]);

  // New solution -> back to the start.
  useEffect(() => { if (moves) goTo(0); }, [moves, goTo]);
  useEffect(() => () => { playingRef.current = false; gen.current++; }, []);

  const animate = async (i, move) => {
    busy.current = true;
    const g = gen.current;
    setAnim(i);
    await cubeRef.current?.playMove(move, durRef.current);
    if (g !== gen.current) return false; // interrupted by goTo
    busy.current = false;
    setAnim(null);
    return true;
  };

  const forward = useCallback(async () => {
    const list = movesRef.current;
    if (busy.current || !list || stepRef.current >= list.length) return false;
    const i = stepRef.current;
    if (!(await animate(i, list[i]))) return false;
    stepRef.current = i + 1;
    setStep(i + 1);
    return true;
  }, []);

  const backward = useCallback(async () => {
    const list = movesRef.current;
    stop();
    if (busy.current || !list || stepRef.current <= 0) return;
    const i = stepRef.current - 1;
    if (!(await animate(i, invertMove(list[i])))) return;
    stepRef.current = i;
    setStep(i);
  }, [stop]);

  /** Plays until `until` (exclusive end index), default: the end. */
  const play = useCallback(async (until) => {
    const list = movesRef.current;
    if (playingRef.current || !list?.length) return;
    if (stepRef.current >= list.length) goTo(0);
    const end = Math.min(until ?? list.length, list.length);
    playingRef.current = true;
    setPlaying(true);
    while (playingRef.current && stepRef.current < end) {
      if (!(await forward())) break;
      await new Promise((r) => setTimeout(r, Math.min(450, durRef.current * 0.4)));
    }
    playingRef.current = false;
    setPlaying(false);
  }, [forward, goTo]);

  const total = moves?.length ?? 0;
  return { step, active: anim ?? step, animating: anim !== null, playing, total, done: !!moves && step >= total, forward, backward, play, stop, goTo };
}
