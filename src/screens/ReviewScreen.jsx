import TopBar from '../components/TopBar.jsx';
import CubeNet from '../components/CubeNet.jsx';
import { validateState } from '../cube/CubeModel.js';

export default function ReviewScreen({ navigate, faceletState, algorithm }) {
  const { valid, errors } = validateState(faceletState);

  return (
    <div className="app scroll">
      <TopBar title="Проверка" onBack={() => navigate('solverEntry')} />

      <div className="net-wrap"><CubeNet faceletState={faceletState} /></div>

      <div className={'status ' + (valid ? 'success' : 'error')} style={{ minHeight: 40, whiteSpace: 'pre-line' }}>
        {valid ? 'Всё сходится — можно собирать' : 'Ошибки:\n' + errors.join('\n')}
      </div>

      <div className="controls">
        <button className="btn" onClick={() => navigate('manual', { prefill: faceletState, algorithm })} style={{ flex: 1 }}>
          Исправить вручную
        </button>
        <button className="btn primary" disabled={!valid} onClick={() => navigate('solve', { faceletState, algorithm })} style={{ flex: 1 }}>
          Начать сборку
        </button>
      </div>
    </div>
  );
}
