import { useEffect, useRef, useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import Cube3D from '../components/Cube3D.jsx';
import { solveKociemba } from '../solvers/kociemba.js';
import { solveCfop } from '../solvers/cfop.js';
import { applyMoves } from '../cube/CubeModel.js';
import { FiSkipBack, FiChevronLeft, FiPlay, FiPause, FiChevronRight, FiSkipForward } from 'react-icons/fi';
import { useT } from '../i18n.jsx';

const SPEED_MS = { slow: 2400, normal: 1500, fast: 800 };

export default function SolveScreen({ navigate, faceletState, algorithm }) {
  const { t } = useT();
  const cubeRef = useRef(null);
  const [moves, setMoves] = useState([]);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState(t('solve.computing'));
  const [playing, setPlaying] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [error, setError] = useState('');
  const stepRef = useRef(0);
  const playingRef = useRef(false);

  const duration = SPEED_MS[localStorage.getItem('cubeSpeed')] || 1500;

  useEffect(() => {
    let cancelled = false;
    setMoves([]); setStep(0); stepRef.current = 0;
    setStatus(t('solve.computing')); setError('');
    (async () => {
      try {
        const result = algorithm === 'cfop' ? await solveCfop(faceletState) : await solveKociemba(faceletState);
        if (cancelled) return;
        setMoves(result.moves);
        setStatus(t('solve.solution', { n: result.length }));
        cubeRef.current?.setState(faceletState);
      } catch (e) {
        if (!cancelled) { setStatus('Error'); setError(e.message); }
      }
    })();
    return () => { cancelled = true; };
  }, [faceletState, algorithm]);

  useEffect(() => () => { playingRef.current = false; }, []);

  const doMove = async (i) => {
    if (i < 0 || i >= moves.length) return;
    setAnimating(true);
    await cubeRef.current?.playMove(moves[i], duration);
    setAnimating(false);
    stepRef.current = i + 1;
    setStep(i + 1);
  };

  const play = async () => {
    if (playingRef.current) return;
    playingRef.current = true;
    setPlaying(true);
    for (let i = stepRef.current; i < moves.length; i++) {
      if (!playingRef.current) break;
      await doMove(i);
    }
    playingRef.current = false;
    setPlaying(false);
  };

  const stop = () => { playingRef.current = false; setPlaying(false); };

  const reset = () => {
    stop();
    stepRef.current = 0;
    setStep(0);
    cubeRef.current?.setState(faceletState);
  };

  const skipEnd = () => {
    stop();
    stepRef.current = moves.length;
    setStep(moves.length);
    cubeRef.current?.setState(applyMoves(faceletState, moves.join(' ')));
  };

  const strip = moves.slice(Math.max(0, step - 4), step + 5).join(' ');

  return (
    <div className="app">
      <TopBar title={t('solve.title')} onBack={() => navigate('home')} />

      <div className="status" style={{ marginTop: 8 }}>{status}</div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
        <Cube3D ref={cubeRef} size={260} />
      </div>

      <div className="move-big">{moves[step] || '—'}</div>
      <div className="status">{step} / {moves.length}</div>
      <div className="move-strip">{strip}</div>
      {error && <div className="status error" style={{ marginTop: 8 }}>{error}</div>}

      <div className="controls">
        <button className="btn" onClick={reset}><FiSkipBack /></button>
        <button className="btn" onClick={() => { stop(); stepRef.current = Math.max(0, stepRef.current - 1); setStep(stepRef.current); }}>
          <FiChevronLeft />
        </button>
        <button className="btn primary" onClick={playing ? stop : play}>
          {playing ? <FiPause /> : <FiPlay />}
        </button>
        <button className="btn" disabled={animating} onClick={() => { stop(); doMove(stepRef.current); }}>
          <FiChevronRight />
        </button>
        <button className="btn" onClick={skipEnd}><FiSkipForward /></button>
      </div>
    </div>
  );
}
