import { useEffect, useRef } from 'react';
import { FiSkipBack, FiChevronLeft, FiPlay, FiPause, FiChevronRight, FiSkipForward } from 'react-icons/fi';
import { useT } from '../i18n.jsx';

/** "R'" -> "Right — counter-clockwise"; rotations get their own wording. */
export function moveText(t, m) {
  if (!m) return '';
  const mod = m[1] === '2' ? '2' : m[1] === "'" ? 'ccw' : 'cw';
  if ('xyz'.includes(m[0])) return t('move.rot.' + m[0] + (mod === 'cw' ? '' : mod === 'ccw' ? "'" : '2'));
  const dir = mod === '2' ? t('move.twice') : mod === 'ccw' ? t('move.ccw') : t('move.cw');
  return t('move.face.' + m[0]) + ' — ' + dir;
}

/** Horizontal list of move chips; scrolls the active one into view. */
export function MoveStrip({ moves, offset = 0, active, onPick }) {
  const ref = useRef(null);
  useEffect(() => {
    const strip = ref.current;
    const el = strip?.querySelector('.move-chip.current');
    if (!strip || !el) return;
    strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
  }, [active, moves]);
  return (
    <div className="move-strip" ref={ref}>
      {moves.map((m, i) => {
        const k = offset + i;
        return (
          <button
            key={k}
            className={'move-chip' + (k < active ? ' past' : '') + (k === active ? ' current' : '') + ('xyz'.includes(m[0]) ? ' rot' : '')}
            onClick={() => onPick(k)}
          >{m}</button>
        );
      })}
    </div>
  );
}

export function PlayerControls({ player, disabled, onPlay, onStart, onEnd, startLabel, endLabel }) {
  const { t } = useT();
  const { step, total, playing, done } = player;
  return (
    <div className="player">
      <button className="icon-btn big" onClick={onStart} disabled={disabled || step === 0} aria-label={startLabel || t('solve.restart')}><FiSkipBack size={20} /></button>
      <button className="icon-btn big" onClick={player.backward} disabled={disabled || step === 0} aria-label={t('solve.prev')}><FiChevronLeft size={26} /></button>
      <button className="play-btn" onClick={playing ? player.stop : onPlay} disabled={disabled || !total} aria-label={playing ? t('solve.pause') : t('solve.play')}>
        {playing ? <FiPause size={26} /> : <FiPlay size={26} />}
      </button>
      <button className="icon-btn big" onClick={() => { player.stop(); player.forward(); }} disabled={disabled || done} aria-label={t('solve.next')}><FiChevronRight size={26} /></button>
      <button className="icon-btn big" onClick={onEnd} disabled={disabled || done} aria-label={endLabel || t('solve.end')}><FiSkipForward size={20} /></button>
    </div>
  );
}
