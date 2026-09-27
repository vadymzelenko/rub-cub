import { useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import CubeNet from '../components/CubeNet.jsx';
import { CUBE_COLORS, FACE_ORDER } from '../vision/ColorDetector.js';
import { validateState, SOLVED_STATE } from '../cube/CubeModel.js';
import { useT } from '../i18n.jsx';

export default function ManualInputScreen({ navigate, prefill }) {
  const { t } = useT();
  const [faceletState, setFaceletState] = useState(prefill || SOLVED_STATE);
  const [selected, setSelected] = useState('U');
  const [error, setError] = useState('');

  const paint = (face, i) => {
    setFaceletState((s) => {
      const arr = s.split('');
      arr[FACE_ORDER.indexOf(face) * 9 + i] = selected;
      return arr.join('');
    });
    setError('');
  };

  const solve = () => {
    const { valid, errors } = validateState(faceletState);
    if (!valid) { setError(errors.join('\n')); return; }
    navigate('review', { faceletState });
  };

  return (
    <div className="app scroll">
      <TopBar title={t('manual.title')} onBack={() => navigate('solverEntry')} />

      <div className="palette">
        {FACE_ORDER.map((f) => (
          <button
            key={f}
            className={'swatch' + (selected === f ? ' selected' : '')}
            style={{ background: CUBE_COLORS[f] }}
            onClick={() => setSelected(f)}
            aria-label={f}
          />
        ))}
      </div>

      <div className="net-wrap"><CubeNet faceletState={faceletState} onCellTap={paint} /></div>

      <div className="status error" style={{ minHeight: 40, whiteSpace: 'pre-line' }}>{error}</div>

      <div className="controls" style={{ marginTop: 8 }}>
        <button className="btn primary" onClick={solve} style={{ flex: 1 }}>{t('manual.solve')}</button>
      </div>
    </div>
  );
}
