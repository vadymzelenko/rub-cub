import { useMemo, useRef } from 'react';
import { FiAward, FiChevronsRight, FiRotateCw, FiRepeat } from 'react-icons/fi';
import TopBar from '../components/TopBar.jsx';
import Cube3D from '../components/Cube3D.jsx';
import { MoveStrip, PlayerControls, moveText } from '../components/Player.jsx';
import { tutorSolve } from '../cube/tutor.js';
import { SOLVED_STATE, applyMoves, randomScramble } from '../cube/CubeModel.js';
import { CUBE_COLORS } from '../vision/ColorDetector.js';
import { useSettings, SPEED_MS } from '../settings.js';
import { useMovePlayer } from '../hooks/useMovePlayer.js';
import { useWakeLock } from '../hooks/useWakeLock.js';
import { useT } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';

const STAGES = [1, 2, 3, 4, 5, 6, 7];

function stageName(t, n) {
  return n === 0 ? t('tutor.stage0') : t('l.' + n + '.t').replace(/^\d+\.\s*/, '');
}

/**
 * Step-by-step beginner's method on a real cube. `faceletState` = the user's
 * scanned cube; or `scramble` (practice) = start from solved, scramble, then solve.
 */
export default function TutorScreen({ faceletState, scramble }) {
  const { t } = useT();
  const { home, navigate } = useNav();
  const { speed } = useSettings();
  const cubeRef = useRef(null);

  const { start, steps, moves, error } = useMemo(() => {
    try {
      const begin = scramble ? SOLVED_STATE : faceletState;
      const target = scramble ? applyMoves(SOLVED_STATE, scramble) : faceletState;
      const res = tutorSolve(target);
      const all = scramble ? [{ stage: 0, key: 'tutor.scramble', moves: scramble }, ...res.steps] : res.steps;
      let offset = 0;
      const withOffsets = all.map((s) => { const o = offset; offset += s.moves.length; return { ...s, offset: o }; });
      return { start: begin, steps: withOffsets, moves: withOffsets.flatMap((s) => s.moves) };
    } catch {
      return { start: faceletState || SOLVED_STATE, steps: [], moves: [], error: true };
    }
  }, [faceletState, scramble]);

  const player = useMovePlayer(cubeRef, start, moves, SPEED_MS[speed] || 520);
  useWakeLock(moves.length > 0);

  const total = moves.length;
  const at = Math.min(player.active, Math.max(0, total - 1));
  const stepIndex = Math.max(0, steps.findIndex((s) => at >= s.offset && at < s.offset + s.moves.length));
  const step = steps[stepIndex];
  const finished = player.done && total > 0;
  const stage = finished ? 8 : step?.stage ?? 1;

  const stepEnd = step ? step.offset + step.moves.length : 0;
  const nextStep = () => player.goTo(stepEnd);
  const prevStep = () => {
    if (!step) return;
    const s = player.step > step.offset ? step : steps[stepIndex - 1];
    player.goTo(s ? s.offset : 0);
  };

  const key = step?.key === 'tutor.rotate' ? 'tutor.rotate.' + step.stage : step?.key;
  const current = moves[player.active];

  if (error) {
    return (
      <div className="page">
        <TopBar title={t('tutor.title')} />
        <div className="status-card bad"><div className="status-head">{t('solve.error')}</div><p className="status-foot">{t('solve.errorHint')}</p></div>
      </div>
    );
  }

  return (
    <div className="page page-solve">
      <TopBar
        title={t('tutor.title')}
        subtitle={finished ? t('solve.done') : stage === 0 ? stageName(t, 0) : t('tutor.stageOf', { n: stage, name: stageName(t, stage) })}
      />

      <div className="stage-bar" aria-hidden="true">
        {STAGES.map((n) => (
          <span key={n} className={'stage-seg' + (n < stage ? ' done' : '') + (n === stage ? ' current' : '')} />
        ))}
      </div>

      {total === 0 ? (
        <div className="status-card ok"><div className="status-head"><FiAward /> {t('solve.already')}</div></div>
      ) : finished ? (
        <div className="tutor-card done">
          <span className="done-badge"><FiAward size={28} /></span>
          <h2>{t('tutor.doneTitle')}</h2>
          <p>{t('tutor.doneText', { n: total - (scramble?.length || 0) })}</p>
        </div>
      ) : (
        <div className="tutor-card" key={stepIndex}>
          <div className="tutor-card-head">
            <span className="tutor-step">{t('tutor.step', { n: stepIndex + 1, total: steps.length })}</span>
            {step?.colors && (
              <span className="piece-chips">
                {step.colors.map((c, i) => <span key={i} className="piece-chip" style={{ '--c': CUBE_COLORS[c] }} />)}
              </span>
            )}
          </div>
          <p className="tutor-text">
            {step?.key === 'tutor.rotate' || step?.key === 'tutor.flip' ? <FiRotateCw className="inline-icon" /> : null}
            {t(key, { repeat: step?.repeat })}
          </p>
          {step?.alg && (
            <div className="algo compact">
              {step.repeat > 1 && <span className="algo-repeat"><FiRepeat /> {step.repeat}×</span>}
              {step.alg.split(' ').map((m, i) => <span key={i} className="algo-move">{m}</span>)}
            </div>
          )}
        </div>
      )}

      <div className="cube-stage small">
        <Cube3D ref={cubeRef} initialState={start} />
      </div>

      {!finished && total > 0 && (
        <>
          <div className="move-now">
            <span className={'move-big' + ('xyz'.includes(current?.[0]) ? ' rot' : '')} key={player.active}>{current || '…'}</span>
            <span className="move-desc">{moveText(t, current)}</span>
          </div>
          {step && <MoveStrip moves={step.moves} offset={step.offset} active={player.active} onPick={player.goTo} />}
        </>
      )}

      {total > 0 && (
        <PlayerControls
          player={player}
          onPlay={() => player.play(stepEnd)}
          onStart={prevStep}
          onEnd={nextStep}
          startLabel={t('tutor.prevStep')}
          endLabel={t('tutor.nextStep')}
        />
      )}

      {finished ? (
        <div className="btn-row">
          {scramble && <button className="btn btn-secondary" onClick={() => navigate('tutor', { scramble: randomScramble() }, { replace: true })}><FiRepeat /> {t('tutor.again')}</button>}
          <button className="btn btn-primary grow" onClick={home}>{t('solve.home')}</button>
        </div>
      ) : total > 0 && (
        <button className="btn btn-secondary full" onClick={nextStep}>
          <FiChevronsRight /> {t('tutor.nextStep')}
        </button>
      )}
    </div>
  );
}
