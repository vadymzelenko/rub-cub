import { useRef, useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import Cube3D from '../components/Cube3D.jsx';
import { SOLVED_STATE } from '../cube/CubeModel.js';
import { FiChevronDown, FiPlay } from 'react-icons/fi';
import { useT } from '../i18n.jsx';

// Алгоритмы — универсальная нотация, не переводятся.
const LESSONS = [
  { id: 1, algo: "F' U L' U'" },
  { id: 2, algo: "R U R' U'" },
  { id: 3, algo: "U R U' R' U' F' U F" },
  { id: 4, algo: "F R U R' U' F'" },
  { id: 5, algo: "R U R' U R U2 R'" },
  { id: 6, algo: "R' F R' B2 R F' R' B2 R2" },
  { id: 7, algo: "F2 U' R' L F2 R L' U' F2" },
];

export default function LearnScreen({ navigate }) {
  const { t } = useT();
  const [open, setOpen] = useState(null);
  const [active, setActive] = useState(null); // id урока, чей куб показан
  const cubeRef = useRef(null);

  const toggle = (id) => {
    if (open === id) { setOpen(null); setActive(null); }
    else { setOpen(id); setActive(id); }
  };

  const play = async () => {
    const lesson = LESSONS.find((l) => l.id === active);
    if (!lesson) return;
    cubeRef.current?.setState(SOLVED_STATE);
    const moves = lesson.algo.trim().split(/\s+/);
    for (const m of moves) await cubeRef.current?.playMove(m, 1200);
  };

  return (
    <div className="app scroll">
      <TopBar title={t('learn.title')} onBack={() => navigate('home')} />
      <p className="subtitle">{t('learn.subtitle')}</p>

      {active && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
          <Cube3D ref={cubeRef} size={220} />
        </div>
      )}

      <div className="menu" style={{ marginTop: 12 }}>
        {LESSONS.map((l) => (
          <div key={l.id} className="card" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'pointer' }} onClick={() => toggle(l.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
              <span className="body">
                <span className="title">{t('l.' + l.id + '.t')}</span>
                <div className="desc">{t('l.' + l.id + '.d')}</div>
              </span>
              <FiChevronDown className="chevron" style={{ transform: open === l.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {open === l.id && (
              <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div className="status" style={{ textAlign: 'left', fontFamily: 'monospace', fontSize: 14 }}>{l.algo}</div>
                <button className="btn small" style={{ marginTop: 10 }} onClick={(e) => { e.stopPropagation(); play(); }}>
                  <FiPlay /> {t('review.solve')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
