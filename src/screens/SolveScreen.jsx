import { useEffect, useRef, useState } from 'react';
import { FiAlertTriangle, FiAward, FiBookOpen } from 'react-icons/fi';
import TopBar from '../components/TopBar.jsx';
import Cube3D from '../components/Cube3D.jsx';
import { MoveStrip, PlayerControls, moveText } from '../components/Player.jsx';
import { solveKociemba } from '../solvers/kociemba.js';
import { CUBE_COLORS } from '../vision/ColorDetector.js';
import { useSettings, SPEED_MS } from '../settings.js';
import { useMovePlayer } from '../hooks/useMovePlayer.js';
import { useWakeLock } from '../hooks/useWakeLock.js';
import { useT } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';

export default function SolveScreen({ faceletState }) {
  const { t } = useT();
  const { home, navigate } = useNav();
  const { speed } = useSettings();
  const cubeRef = useRef(null);
  const [moves, setMoves] = useState(null);
  const [error, setError] = useState('');
  const player = useMovePlayer(cubeRef, faceletState, moves, SPEED_MS[speed] || 520);

  useWakeLock(!!moves?.length);

  useEffect(() => {
    let cancelled = false;
    setMoves(null); setError('');
    solveKociemba(faceletState)
      .then((m) => { if (!cancelled) setMoves(m); })
      .catch((e) => { if (!cancelled) setError(String(e?.message || e)); });
    return () => { cancelled = true; };
  }, [faceletState]);

  const total = moves?.length ?? 0;
  const current = moves?.[player.active];

  return (
    <div className="page page-solve">
      <TopBar
        title={t('solve.title')}
        subtitle={moves ? t('solve.solution', { n: total }) : error ? '' : t('solve.computing')}
      />

      <div className="orientation">
        <span className="ori-chip" style={{ '--c': CUBE_COLORS.U }} /><span>{t('solve.holdTop')}</span>
        <span className="ori-chip" style={{ '--c': CUBE_COLORS.F }} /><span>{t('solve.holdFront')}</span>
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
            {player.done && moves ? (
              <>
                <span className="move-big done"><FiAward /></span>
                <span className="move-desc">{total ? t('solve.done') : t('solve.already')}</span>
              </>
            ) : (
              <>
                <span className={'move-big' + (player.animating ? ' pulse' : '')} key={player.active}>{current || '…'}</span>
                <span className="move-desc">{moveText(t, current)}</span>
              </>
            )}
          </div>
          <div className="progress"><span style={{ width: total ? (player.step / total) * 100 + '%' : 0 }} /></div>
          <MoveStrip moves={moves || []} active={player.active} onPick={player.goTo} />
        </>
      )}

      <PlayerControls
        player={player}
        disabled={!moves}
        onPlay={() => player.play()}
        onStart={() => player.goTo(0)}
        onEnd={() => player.goTo(total)}
      />

      {player.done && total > 0 ? (
        <button className="btn btn-secondary full" onClick={home}>{t('solve.home')}</button>
      ) : moves && total > 0 && (
        <button className="btn btn-secondary full" onClick={() => navigate('tutor', { faceletState }, { replace: true })}>
          <FiBookOpen /> {t('solve.learnInstead')}
        </button>
      )}
    </div>
  );
}
