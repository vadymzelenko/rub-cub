import { useRef, useState } from 'react';
import { FiChevronDown, FiPlay } from 'react-icons/fi';
import TopBar from '../components/TopBar.jsx';
import Cube3D from '../components/Cube3D.jsx';
import { SOLVED_STATE, applyMoves, invertMoves, parseMoves } from '../cube/CubeModel.js';
import { CUBE_COLORS } from '../vision/ColorDetector.js';
import { useSettings, SPEED_MS } from '../settings.js';
import { useT } from '../i18n.jsx';

// Algorithms are notation and are not translated. `yellowUp` lessons are shown
// with the cube flipped (yellow on top), as they are performed in practice.
const LESSONS = [
  { id: 1, algo: "F' U L' U'" },
  { id: 2, algo: "R U R' U'" },
  { id: 3, algo: "U R U' R' U' F' U F" },
  { id: 4, algo: "F R U R' U' F'", yellowUp: true },
  { id: 5, algo: "R U R' U R U2 R'", yellowUp: true },
  { id: 6, algo: "R' F R' B2 R F' R' B2 R2", yellowUp: true },
  { id: 7, algo: "F2 U' R' L F2 R L' U' F2", yellowUp: true },
];

// Flip the cube upside down (x2): yellow on top, blue in front.
const FLIP = { U: 'D', D: 'U', F: 'B', B: 'F', L: 'L', R: 'R' };
const flip = (s) => [...s].map((c) => FLIP[c] || c).join('');

// Top-down sketches for each step: the 3x3 top face plus the adjacent row of
// each side face. '?' = any colour.
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
  W: CUBE_COLORS.U, Y: CUBE_COLORS.D, R: CUBE_COLORS.R, O: CUBE_COLORS.L,
  G: CUBE_COLORS.F, B: CUBE_COLORS.B,
};

function LessonVisual({ data }) {
  const cells = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      let ch = null;
      if (r === 0 && c >= 1 && c <= 3) ch = data.top[c - 1];
      else if (r === 4 && c >= 1 && c <= 3) ch = data.bottom[c - 1];
      else if (c === 0 && r >= 1 && r <= 3) ch = data.left[r - 1];
      else if (c === 4 && r >= 1 && r <= 3) ch = data.right[r - 1];
      else if (r >= 1 && r <= 3 && c >= 1 && c <= 3) ch = data.u[(r - 1) * 3 + (c - 1)];
      cells.push(ch);
    }
  }
  return (
    <div className="lesson-visual" aria-hidden="true">
      {cells.map((ch, i) => (
        <span key={i} className={'lv-cell' + (!ch ? ' none' : ch === '?' ? ' any' : '')} style={ch && ch !== '?' ? { '--c': COLOR_MAP[ch] } : undefined} />
      ))}
    </div>
  );
}

function LessonDemo({ lesson }) {
  const { t } = useT();
  const { speed } = useSettings();
  const cubeRef = useRef(null);
  const [running, setRunning] = useState(false);
  const moves = parseMoves(lesson.algo);
  const start = applyMoves(SOLVED_STATE, invertMoves(moves));
  const initial = lesson.yellowUp ? flip(start) : start;

  const run = async () => {
    if (running) return;
    setRunning(true);
    cubeRef.current?.setState(initial);
    await new Promise((r) => setTimeout(r, 350));
    for (const m of moves) await cubeRef.current?.playMove(m, SPEED_MS[speed]);
    setRunning(false);
  };

  return (
    <div className="lesson-demo">
      <div className="lesson-demo-cube"><Cube3D ref={cubeRef} initialState={initial} /></div>
      <button className="btn btn-secondary btn-small" onClick={run} disabled={running}>
        <FiPlay /> {t('learn.play')}
      </button>
    </div>
  );
}

export default function LearnScreen() {
  const { t } = useT();
  const [open, setOpen] = useState(1);

  return (
    <div className="page">
      <TopBar title={t('learn.title')} subtitle={t('learn.subtitle')} />
      <div className="lessons">
        {LESSONS.map((l) => {
          const isOpen = open === l.id;
          return (
            <section key={l.id} className={'lesson' + (isOpen ? ' open' : '')}>
              <button className="lesson-head" onClick={() => setOpen(isOpen ? null : l.id)} aria-expanded={isOpen}>
                <span className="lesson-num">{l.id}</span>
                <span className="row-body">
                  <span className="row-title">{t('l.' + l.id + '.t').replace(/^\d+\.\s*/, '')}</span>
                  <span className="row-desc">{t('l.' + l.id + '.d')}</span>
                </span>
                <FiChevronDown className="lesson-chevron" />
              </button>
              {isOpen && (
                <div className="lesson-body">
                  <div className="lesson-media">
                    <LessonVisual data={VISUALS[l.id]} />
                    <LessonDemo key={l.id} lesson={l} />
                  </div>
                  <p className="lesson-how">{t('l.' + l.id + '.how')}</p>
                  <div className="algo">
                    {parseMoves(l.algo).map((m, i) => <span key={i} className="algo-move">{m}</span>)}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
