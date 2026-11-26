import { useMemo, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiEdit3, FiPlay, FiBookOpen, FiInfo } from 'react-icons/fi';
import TopBar from '../components/TopBar.jsx';
import CubeNet from '../components/CubeNet.jsx';
import ColorPicker from '../components/ColorPicker.jsx';
import { analyzeState, FACE_ORDER } from '../cube/CubeModel.js';
import { CUBE_COLORS } from '../vision/ColorDetector.js';
import { useT, errorText } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';

const GLOBAL = new Set(['err.twist', 'err.flip', 'err.parity', 'err.centers', 'err.length', 'err.unknown']);

function ColorBalance({ counts }) {
  const { t } = useT();
  return (
    <div className="balance">
      {FACE_ORDER.map((f) => {
        const n = counts[f], d = n - 9;
        return (
          <div key={f} className={'balance-item' + (d > 0 ? ' over' : d < 0 ? ' under' : ' ok')} title={t('color.' + f)}>
            <span className="balance-chip" style={{ '--c': CUBE_COLORS[f] }} />
            <span className="balance-n">{n}</span>
            <span className="balance-d">{d === 0 ? '✓' : (d > 0 ? '+' : '−') + Math.abs(d)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ReviewScreen({ faceletState }) {
  const { t } = useT();
  const { navigate } = useNav();
  const [state, setState] = useState(faceletState || '');
  const [editing, setEditing] = useState(null);

  const { valid, errors } = useMemo(() => analyzeState(state), [state]);
  const counts = useMemo(() => {
    const c = Object.fromEntries(FACE_ORDER.map((f) => [f, 0]));
    for (const ch of state) if (c[ch] !== undefined) c[ch]++;
    return c;
  }, [state]);

  const countErrors = errors.filter((e) => e.key === 'err.count');
  const pieceErrors = errors.filter((e) => e.cells);
  const globalErrors = errors.filter((e) => GLOBAL.has(e.key));
  const errorCells = useMemo(() => new Set(pieceErrors.flatMap((e) => e.cells)), [pieceErrors]);

  const setColor = (f) => {
    setState((s) => { const a = s.split(''); a[editing] = f; return a.join(''); });
    setEditing(null);
  };

  return (
    <div className="page">
      <TopBar
        title={t('review.title')}
        subtitle={t('review.subtitle')}
        right={
          <button className="icon-btn" onClick={() => navigate('manual', { prefill: state }, { replace: true })} aria-label={t('review.edit')}>
            <FiEdit3 size={18} />
          </button>
        }
      />

      <div className="net-card">
        <CubeNet
          state={state}
          onCellTap={(k) => setEditing(editing === k ? null : k)}
          highlight={editing != null ? new Set([editing]) : undefined}
          errorCells={errorCells}
        />
      </div>

      {editing != null ? (
        <div className="panel">
          <p className="panel-title">{t('review.pick')}</p>
          <ColorPicker value={state[editing]} onChange={setColor} counts={counts} />
        </div>
      ) : valid ? (
        <div className="status-card ok">
          <div className="status-head"><FiCheckCircle /> {t('review.ok')}</div>
        </div>
      ) : (
        <div className="status-card bad">
          {countErrors.length > 0 ? (
            <>
              <div className="status-head"><FiAlertTriangle /> {t('review.countTitle')}</div>
              <p className="status-text">{t('review.countText')}</p>
              <ColorBalance counts={counts} />
            </>
          ) : pieceErrors.length > 0 ? (
            <>
              <div className="status-head"><FiAlertTriangle /> {t('review.pieceTitle')}</div>
              <ul className="status-list">
                {pieceErrors.slice(0, 3).map((e, i) => <li key={i}>{errorText(t, e)}</li>)}
                {pieceErrors.length > 3 && <li className="muted">{t('review.more', { n: pieceErrors.length - 3 })}</li>}
              </ul>
              <p className="status-foot"><span className="legend-bad" /> {t('review.pieceHint')}</p>
            </>
          ) : (
            <>
              <div className="status-head"><FiAlertTriangle /> {t('review.globalTitle')}</div>
              <ul className="status-list">
                {globalErrors.map((e, i) => <li key={i}>{errorText(t, e)}</li>)}
              </ul>
              <p className="status-foot"><FiInfo /> {t('review.globalHint')}</p>
            </>
          )}
        </div>
      )}

      <div className="sticky-bottom">
        <div className="btn-row">
          <button className="btn btn-secondary" disabled={!valid} onClick={() => navigate('tutor', { faceletState: state })}>
            <FiBookOpen /> {t('review.learn')}
          </button>
          <button className="btn btn-primary grow" disabled={!valid} onClick={() => navigate('solve', { faceletState: state })}>
            <FiPlay /> {t('review.solve')}
          </button>
        </div>
      </div>
    </div>
  );
}
