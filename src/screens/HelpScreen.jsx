import TopBar from '../components/TopBar.jsx';
import { useT } from '../i18n.jsx';
import { CUBE_COLORS } from '../vision/ColorDetector.js';

const SECTIONS = [
  { title: 'help.scanTitle', body: 'help.scanBody' },
  { title: 'help.notationTitle', body: 'help.notationBody' },
  { title: 'help.solveTitle', body: 'help.solveBody' },
  { title: 'help.tipsTitle', body: 'help.tipsBody' },
];

// Развёртка куба: 6 цветных граней с буквами (U/D/F/B/L/R).
function NetIllustration() {
  const POS = {
    U: { x: 70, y: 6 },
    L: { x: 2, y: 78 },
    F: { x: 70, y: 78 },
    R: { x: 138, y: 78 },
    B: { x: 206, y: 78 },
    D: { x: 70, y: 150 },
  };
  return (
    <svg viewBox="0 0 272 220" width="100%" style={{ maxWidth: 280, display: 'block', margin: '14px auto 0' }} role="img" aria-label="Развёртка куба">
      {Object.entries(POS).map(([face, p]) => (
        <g key={face}>
          <rect x={p.x} y={p.y} width="64" height="64" rx="10" fill={CUBE_COLORS[face]} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
          <text x={p.x + 32} y={p.y + 32} textAnchor="middle" dominantBaseline="central" fontSize="20" fontWeight="700" fill={(face === 'U' || face === 'D') ? '#000' : '#fff'}>
            {face}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function HelpScreen({ navigate }) {
  const { t } = useT();
  return (
    <div className="app scroll">
      <TopBar title={t('help.title')} onBack={() => navigate('home')} />
      <NetIllustration />
      {SECTIONS.map((s) => (
        <div key={s.title} className="help-section">
          <div className="help-title">{t(s.title)}</div>
          <div className="help-body">{t(s.body)}</div>
        </div>
      ))}
    </div>
  );
}