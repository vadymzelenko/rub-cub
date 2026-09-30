import { useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import { FiChevronDown } from 'react-icons/fi';
import { useT } from '../i18n.jsx';

// Алгоритмы не переводятся.
const LESSONS = [
  { id: 1, algo: "F' U L' U'" },
  { id: 2, algo: "R U R' U'" },
  { id: 3, algo: "U R U' R' U' F' U F" },
  { id: 4, algo: "F R U R' U' F'" },
  { id: 5, algo: "R U R' U R U2 R'" },
  { id: 6, algo: "R' F R' B2 R F' R' B2 R2" },
  { id: 7, algo: "F2 U' R' L F2 R L' U' F2" },
];

// Схемы состояний для иллюстраций. Каждая — «крестовидный» вид:
// центр 3×3 (грань U) + 4 полосы соседних граней вокруг.
// '?' — любой/неизвестный цвет (серый).
const VISUALS = {
  1: {
    u:      ['?','W','?', 'W','W','W', '?','W','?'],
    top:    ['?','G','?'], right: ['?','R','?'],
    bottom: ['?','B','?'], left:  ['?','O','?'],
  },
  2: {
    u:      ['W','W','W', 'W','W','W', 'W','W','W'],
    top:    ['G','G','G'], right: ['R','R','R'],
    bottom: ['B','B','B'], left:  ['O','O','O'],
  },
  3: {
    u:      ['W','W','W', 'W','W','W', 'W','W','W'],
    top:    ['G','G','G'], right: ['R','R','R'],
    bottom: ['B','B','B'], left:  ['O','O','O'],
  },
  4: {
    u:      ['?','Y','?', 'Y','Y','Y', '?','Y','?'],
    top:    ['?','Y','?'], right: ['?','Y','?'],
    bottom: ['?','Y','?'], left:  ['?','Y','?'],
  },
  5: {
    u:      ['Y','Y','Y', 'Y','Y','Y', 'Y','Y','Y'],
    top:    ['?','Y','?'], right: ['?','Y','?'],
    bottom: ['?','Y','?'], left:  ['?','Y','?'],
  },
  6: {
    u:      ['Y','Y','Y', 'Y','Y','Y', 'Y','Y','Y'],
    top:    ['G','G','G'], right: ['?','?','?'],
    bottom: ['B','B','B'], left:  ['?','?','?'],
  },
  7: {
    u:      ['Y','Y','Y', 'Y','Y','Y', 'Y','Y','Y'],
    top:    ['G','G','G'], right: ['R','R','R'],
    bottom: ['B','B','B'], left:  ['O','O','O'],
  },
};

const COLOR_MAP = {
  W: '#f4f4f5', Y: '#ffd500', R: '#c41e3a', O: '#ff5800',
  G: '#009e60', B: '#0051ba', '?': 'transparent',
};

function LessonVisual({ data }) {
  // 5×5: [0,0]/[0,4]/[4,0]/[4,4] пустые; центр 3×3 = u; полосы — соседние грани.
  const cells = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      let ch = null;
      if (r === 0 && c >= 1 && c <= 3) ch = data.top[c - 1];
      else if (r === 4 && c >= 1 && c <= 3) ch = data.bottom[c - 1];
      else if (c === 0 && r >= 1 && r <= 3) ch = data.left[r - 1];
      else if (c === 4 && r >= 1 && r <= 3) ch = data.right[r - 1];
      else if (r >= 1 && r <= 3 && c >= 1 && c <= 3) ch = data.u[(r - 1) * 3 + (c - 1)];
      cells.push({ r, c, ch });
    }
  }

  return (
      <div className="lesson-visual" role="img">
        {cells.map((cell, i) => (
            <div
                key={i}
                className={'lesson-cell' + (cell.ch ? '' : ' empty') + (cell.r >= 1 && cell.r <= 3 && cell.c >= 1 && cell.c <= 3 ? ' center-zone' : '')}
                style={cell.ch && cell.ch !== '?'
                    ? { background: COLOR_MAP[cell.ch] }
                    : cell.ch === '?'
                        ? { background: 'var(--surface-2)' }
                        : {}}
            />
        ))}
      </div>
  );
}

export default function LearnScreen() {
  const { t } = useT();
  const [open, setOpen] = useState(1);

  const toggle = (id) => setOpen(open === id ? null : id);

  return (
      <div className="app scroll">
        <TopBar title={t('learn.title')} />
        <p className="subtitle">{t('learn.subtitle')}</p>

        <div className="menu" style={{ marginTop: 12 }}>
          {LESSONS.map((l) => {
            const isOpen = open === l.id;
            return (
                <div
                    key={l.id}
                    className={'card lesson-card' + (isOpen ? ' open' : '')}
                    onClick={() => toggle(l.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(l.id); } }}
                >
                  <div className="lesson-head">
                <span className="body">
                  <span className="title">{t('l.' + l.id + '.t')}</span>
                  <div className="desc">{t('l.' + l.id + '.d')}</div>
                </span>
                    <FiChevronDown
                        className="chevron"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                    />
                  </div>

                  {isOpen && (
                      <div className="lesson-body">
                        <LessonVisual data={VISUALS[l.id]} />
                        <div className="lesson-how">{t('l.' + l.id + '.how')}</div>
                        <div className="lesson-algo">{l.algo}</div>
                      </div>
                  )}
                </div>
            );
          })}
        </div>
      </div>
  );
}