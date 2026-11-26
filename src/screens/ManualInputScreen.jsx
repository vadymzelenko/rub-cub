import { useEffect, useMemo, useState } from 'react';
import { FiRotateCcw, FiShuffle, FiCheck } from 'react-icons/fi';
import TopBar from '../components/TopBar.jsx';
import CubeNet from '../components/CubeNet.jsx';
import ColorPicker from '../components/ColorPicker.jsx';
import { FACE_ORDER } from '../vision/ColorDetector.js';
import { EMPTY_STATE, SOLVED_STATE, applyMoves, randomScramble } from '../cube/CubeModel.js';
import { useT } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';
import { warmupSolver } from '../solvers/kociemba.js';

const DRAFT_KEY = 'rubcub.manualDraft';

function loadDraft() {
  try {
    const s = sessionStorage.getItem(DRAFT_KEY);
    return s && s.length === 54 ? s : null;
  } catch { return null; }
}

export default function ManualInputScreen({ prefill }) {
  const { t } = useT();
  const { navigate } = useNav();
  const [state, setState] = useState(() => prefill || loadDraft() || EMPTY_STATE);
  const [brush, setBrush] = useState('U');

  useEffect(() => { warmupSolver(); }, []);
  useEffect(() => {
    try { sessionStorage.setItem(DRAFT_KEY, state); } catch { /* ignore */ }
  }, [state]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(FACE_ORDER.map((f) => [f, 0]));
    for (const ch of state) if (c[ch] !== undefined) c[ch]++;
    return c;
  }, [state]);
  const empty = [...state].filter((c) => c === '?').length;

  const paint = (k) => {
    setState((s) => {
      const arr = s.split('');
      arr[k] = arr[k] === brush ? '?' : brush;
      return arr.join('');
    });
    // Jump to the next colour that still needs stickers, so filling is quick.
    if (counts[brush] + 1 >= 9 && state[k] !== brush) {
      const next = FACE_ORDER.find((f) => f !== brush && counts[f] < 9);
      if (next) setBrush(next);
    }
  };

  return (
    <div className="page">
      <TopBar
        title={t('manual.title')}
        subtitle={empty ? t('manual.left', { n: empty }) : t('manual.complete')}
        right={
          <button className="icon-btn" onClick={() => setState(EMPTY_STATE)} aria-label={t('manual.clear')}>
            <FiRotateCcw size={19} />
          </button>
        }
      />

      <p className="hint">{t('manual.hint')}</p>

      <div className="net-card">
        <CubeNet state={state} onCellTap={paint} />
      </div>

      <div className="sticky-bottom">
        <ColorPicker value={brush} onChange={setBrush} counts={counts} />
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => setState(applyMoves(SOLVED_STATE, randomScramble()))} title={t('manual.random')}>
            <FiShuffle /> {t('manual.random')}
          </button>
          <button
            className="btn btn-primary grow"
            disabled={empty > 0}
            onClick={() => navigate('review', { faceletState: state })}
          >
            <FiCheck /> {t('manual.check')}
          </button>
        </div>
      </div>
    </div>
  );
}
