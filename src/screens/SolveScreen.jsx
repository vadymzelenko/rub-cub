import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import { solveKociemba } from '../solvers/kociemba.js';
import { solveCfop } from '../solvers/cfop.js';
import { FiSkipBack, FiChevronLeft, FiPlay, FiPause, FiChevronRight, FiSkipForward } from 'react-icons/fi';

export default function SolveScreen({ navigate, faceletState, algorithm }) {
  const [moves, setMoves] = useState([]);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('Вычисляем решение…');
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setMoves([]);
    setStep(0);
    setStatus('Вычисляем решение…');
    setError('');
    (async () => {
      try {
        const result = algorithm === 'cfop' ? await solveCfop(faceletState) : await solveKociemba(faceletState);
        if (cancelled) return;
        setMoves(result.moves);
        setStatus(`Решение: ${result.length} ходов`);
      } catch (e) {
        if (!cancelled) { setStatus('Ошибка'); setError(e.message); }
      }
    })();
    return () => { cancelled = true; };
  }, [faceletState, algorithm]);

  useEffect(() => {
    if (!playing || step >= moves.length) { setPlaying(false); return; }
    const t = setTimeout(() => setStep((s) => s + 1), 500);
    return () => clearTimeout(t);
  }, [playing, step, moves]);

  const strip = moves.slice(Math.max(0, step - 4), step + 5).join(' ');

  return (
    <div className="app">
      <TopBar title="Сборка" onBack={() => navigate('home')} />

      <div className="status" style={{ marginTop: 8 }}>{status}</div>
      <div className="move-big">{moves[step] || '—'}</div>
      <div className="status">{step} / {moves.length}</div>
      <div className="move-strip">{strip}</div>
      {error && <div className="status error" style={{ marginTop: 8 }}>{error}</div>}

      <div className="controls">
        <button className="btn" onClick={() => setStep(0)}><FiSkipBack /></button>
        <button className="btn" onClick={() => setStep((s) => Math.max(0, s - 1))}><FiChevronLeft /></button>
        <button className="btn primary" onClick={() => setPlaying((p) => !p)}>
          {playing ? <FiPause /> : <FiPlay />}
        </button>
        <button className="btn" onClick={() => setStep((s) => Math.min(moves.length, s + 1))}><FiChevronRight /></button>
        <button className="btn" onClick={() => setStep(moves.length)}><FiSkipForward /></button>
      </div>
    </div>
  );
}
