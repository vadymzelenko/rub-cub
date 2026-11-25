import { useEffect, useRef, useState, useCallback } from 'react';
import { FiSkipBack, FiChevronLeft, FiPlay, FiPause, FiChevronRight, FiSkipForward, FiAlertTriangle, FiAward } from 'react-icons/fi';
import TopBar from '../components/TopBar.jsx';
import Cube3D from '../components/Cube3D.jsx';
import { solveKociemba } from '../solvers/kociemba.js';
import { applyMoves, invertMove } from '../cube/CubeModel.js';
import { CUBE_COLORS } from '../vision/ColorDetector.js';
import { useSettings, SPEED_MS } from '../settings.js';
import { useT } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';

// Keeps the screen on while the user follows the moves (where supported).
function useWakeLock(active) {
  useEffect(() => {
    if (!active || !navigator.wakeLock) return;
    let lock = null, released = false;
    const acquire = () => navigator.wakeLock.request('screen').then((l) => { if (released) l.release(); else lock = l; }).catch(() => {});
    acquire();
    const onVis = () => { if (!document.hidden && !released) acquire(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { released = true; lock?.release().catch(() => {}); document.removeEventListener('visibilitychange', onVis); };
  }, [active]);
}

function moveText(t, m) {
  if (!m) return '';
  const dir = m[1] === '2' ? t('move.twice') : m[1] === "'" ? t('move.ccw') : t('move.cw');
  return t('move.face.' + m[0]) + ' — ' + dir;
}

export default function SolveScreen({ faceletState }) {
  const { t } = useT();
  const { home } = useNav();
  const { speed } = useSettings();
  const duration = SPEED_MS[speed] || 520;
  const cubeRef = useRef(null);
  const stripRef = useRef(null);

  const [moves, setMoves] = useState(null); // null = computing
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const busy = useRef(false);
  const stepRef = useRef(0);
  const playingRef = useRef(false);
  const durationRef = useRef(duration);
  durationRef.current = duration;

  useWakeLock(!!moves?.length);

  useEffect(() => {
    let cancelled = false;
    setMoves(null); setError(''); setStep(0); stepRef.current = 0;
    solveKociemba(faceletState)
      .then((m) => { if (!cancelled) { setMoves(m); cubeRef.current?.setState(faceletState); } })
      .catch((e) => { if (!cancelled) setError(String(e?.message || e)); });
    return () => { cancelled = true; };
  }, [faceletState]);

  useEffect(() => () => { playingRef.current = false; }, []);

  // Keep the current move chip in view.
  useEffect(() => {
    const el = stripRef.current?.querySelector('.move-chip.current');
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [step, moves]);

  const goTo = useCallback((n) => {
    if (!moves) return;
    stop();
    n = Math.max(0, Math.min(moves.length, n));
    stepRef.current = n;
    setStep(n);
    cubeRef.current?.setState(applyMoves(faceletState, moves.slice(0, n)));
  }, [moves, faceletState]);

  const forward = async () => {
    if (busy.current || !moves || stepRef.current >= moves.length) return false;
    busy.current = true;
    const i = stepRef.current;
    stepRef.current = i + 1;
    setStep(i + 1);
    await cubeRef.current?.playMove(moves[i], durationRef.current);
    busy.current = false;
    return true;
  };

  const backward = async () => {
    stop();
    if (busy.current || !moves || stepRef.current <= 0) return;
    busy.current = true;
    const i = stepRef.current - 1;
    stepRef.current = i;
    setStep(i);
    await cubeRef.current?.playMove(invertMove(moves[i]), durationRef.current);
    busy.current = false;
  };

  const play = async () => {
    if (playingRef.current || !moves) return;
    if (stepRef.current >= moves.length) goTo(0);
    playingRef.current = true;
    setPlaying(true);
    while (playingRef.current && stepRef.current < moves.length) {
      if (!(await forward())) break;
      await new Promise((r) => setTimeout(r, Math.min(260, durationRef.current * 0.4)));
    }
    playingRef.current = false;
    setPlaying(false);
  };

  function stop() { playingRef.current = false; setPlaying(false); }

  const total = moves?.length ?? 0;
  const solved = moves && step >= total;
  const nextMove = moves?.[step];

  return (
    <div className="page page-solve">
      <TopBar
        title={t('solve.title')}
        subtitle={moves ? t('solve.solution', { n: total }) : error ? '' : t('solve.computing')}
      />

      <div className="orientation">
        <span className="ori-chip" style={{ '--c': CUBE_COLORS.U }} />
        <span>{t('solve.holdTop')}</span>
        <span className="ori-chip" style={{ '--c': CUBE_COLORS.F }} />
        <span>{t('solve.holdFront')}</span>
      </div>

      <div className="cube-stage">
        <Cube3D ref={cubeRef} initialState={faceletState} />
        {!moves && !error && <div className="cube-stage-overlay"><div className="spinner" /></div>}
      </div>

      {error ? (
        <div className="status-card bad">
          <div className="status-head"><FiAlertTriangle /> {t('solve.error')}</div>
          <p className="status-foot">{t('solve.errorHint')}</p>
        </div>
      ) : (
        <>
          <div className="move-now">
            {solved ? (
              <>
                <span className="move-big done"><FiAward /></span>
                <span className="move-desc">{total ? t('solve.done') : t('solve.already')}</span>
              </>
            ) : (
              <>
                <span className="move-big">{nextMove || '…'}</span>
                <span className="move-desc">{moves ? moveText(t, nextMove) : ''}</span>
              </>
            )}
          </div>

          <div className="progress"><span style={{ width: total ? (step / total) * 100 + '%' : 0 }} /></div>

          <div className="move-strip" ref={stripRef}>
            {(moves || []).map((m, i) => (
              <button
                key={i}
                className={'move-chip' + (i < step ? ' past' : '') + (i === step ? ' current' : '')}
                onClick={() => goTo(i)}
              >{m}</button>
            ))}
          </div>
        </>
      )}

      <div className="player">
        <button className="icon-btn big" onClick={() => goTo(0)} disabled={!moves || step === 0} aria-label={t('solve.restart')}><FiSkipBack size={20} /></button>
        <button className="icon-btn big" onClick={backward} disabled={!moves || step === 0} aria-label={t('solve.prev')}><FiChevronLeft size={26} /></button>
        <button className="play-btn" onClick={playing ? stop : play} disabled={!moves || !total} aria-label={playing ? t('solve.pause') : t('solve.play')}>
          {playing ? <FiPause size={26} /> : <FiPlay size={26} />}
        </button>
        <button className="icon-btn big" onClick={() => { stop(); forward(); }} disabled={!moves || solved} aria-label={t('solve.next')}><FiChevronRight size={26} /></button>
        <button className="icon-btn big" onClick={() => goTo(total)} disabled={!moves || solved} aria-label={t('solve.end')}><FiSkipForward size={20} /></button>
      </div>

      {solved && total > 0 && (
        <button className="btn btn-secondary full" onClick={home}>{t('solve.home')}</button>
      )}
    </div>
  );
}
