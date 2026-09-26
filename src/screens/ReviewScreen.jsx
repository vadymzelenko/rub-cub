import TopBar from '../components/TopBar.jsx';
import CubeNet from '../components/CubeNet.jsx';
import { validateState } from '../cube/CubeModel.js';
import { useT } from '../i18n.jsx';

export default function ReviewScreen({ navigate, faceletState, algorithm }) {
  const { t } = useT();
  const { valid, errors } = validateState(faceletState);

  return (
    <div className="app scroll">
      <TopBar title={t('review.title')} onBack={() => navigate('solverEntry')} />

      <div className="net-wrap"><CubeNet faceletState={faceletState} /></div>

      <div className={'status ' + (valid ? 'success' : 'error')} style={{ minHeight: 40, whiteSpace: 'pre-line' }}>
        {valid ? t('review.ok') : t('manual.error') + ':\n' + errors.join('\n')}
      </div>

      <div className="controls">
        <button className="btn" onClick={() => navigate('manual', { prefill: faceletState, algorithm })} style={{ flex: 1 }}>
          {t('review.edit')}
        </button>
        <button className="btn primary" disabled={!valid} onClick={() => navigate('solve', { faceletState, algorithm })} style={{ flex: 1 }}>
          {t('review.solve')}
        </button>
      </div>
    </div>
  );
}
