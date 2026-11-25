import { useMemo, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiEdit3, FiPlay } from 'react-icons/fi';
import TopBar from '../components/TopBar.jsx';
import CubeNet from '../components/CubeNet.jsx';
import ColorPicker from '../components/ColorPicker.jsx';
import { analyzeState, FACE_ORDER } from '../cube/CubeModel.js';
import { useT, errorText } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';

export default function ReviewScreen({ faceletState }) {
  const { t } = useT();
  const { navigate } = useNav();
  const [state, setState] = useState(faceletState || '');
  const [editing, setEditing] = useState(null); // sticker index being edited

  const { valid, errors } = useMemo(() => analyzeState(state), [state]);
  const counts = useMemo(() => {
    const c = Object.fromEntries(FACE_ORDER.map((f) => [f, 0]));
    for (const ch of state) if (c[ch] !== undefined) c[ch]++;
    return c;
  }, [state]);

  const setColor = (f) => {
    setState((s) => { const a = s.split(''); a[editing] = f; return a.join(''); });
    setEditing(null);
  };

  return (
    <div className="page">
      <TopBar title={t('review.title')} subtitle={t('review.subtitle')} />

      <div className="net-card">
        <CubeNet state={state} onCellTap={setEditing} highlight={editing != null ? new Set([editing]) : undefined} />
      </div>

      {editing != null ? (
        <div className="panel">
          <p className="panel-title">{t('review.pick')}</p>
          <ColorPicker value={state[editing]} onChange={setColor} counts={counts} />
        </div>
      ) : (
        <div className={'status-card ' + (valid ? 'ok' : 'bad')}>
          {valid ? (
            <div className="status-head"><FiCheckCircle /> {t('review.ok')}</div>
          ) : (
            <>
              <div className="status-head"><FiAlertTriangle /> {t('review.problems', { n: errors.length })}</div>
              <ul className="status-list">
                {errors.slice(0, 6).map((e, i) => <li key={i}>{errorText(t, e)}</li>)}
              </ul>
              <p className="status-foot">{t('review.tapHint')}</p>
            </>
          )}
        </div>
      )}

      <div className="sticky-bottom">
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => navigate('manual', { prefill: state }, { replace: true })}>
            <FiEdit3 /> {t('review.edit')}
          </button>
          <button
            className="btn btn-primary grow"
            disabled={!valid}
            onClick={() => navigate('solve', { faceletState: state })}
          >
            <FiPlay /> {t('review.solve')}
          </button>
        </div>
      </div>
    </div>
  );
}
