import { FiCamera, FiRepeat, FiPlayCircle, FiSun } from 'react-icons/fi';
import TopBar from '../components/TopBar.jsx';
import { useT } from '../i18n.jsx';
import { CUBE_COLORS, ON_COLOR } from '../vision/ColorDetector.js';

const SECTIONS = [
  { title: 'help.scanTitle', body: 'help.scanBody', icon: FiCamera, accent: 'accent-green' },
  { title: 'help.notationTitle', body: 'help.notationBody', icon: FiRepeat, accent: 'accent-blue' },
  { title: 'help.solveTitle', body: 'help.solveBody', icon: FiPlayCircle, accent: 'accent-red' },
  { title: 'help.tipsTitle', body: 'help.tipsBody', icon: FiSun, accent: 'accent-orange' },
];

const POS = { U: [1, 0], L: [0, 1], F: [1, 1], R: [2, 1], B: [3, 1], D: [1, 2] };

function NetIllustration() {
  const { t } = useT();
  return (
    <div className="help-net" role="img" aria-label={t('help.netAlt')}>
      {Object.entries(POS).map(([f, [c, r]]) => (
        <div key={f} className="help-net-face" style={{ gridColumn: c + 1, gridRow: r + 1, background: CUBE_COLORS[f], color: ON_COLOR[f] }}>
          <strong>{f}</strong>
          <span>{t('face.' + f)}</span>
        </div>
      ))}
    </div>
  );
}

export default function HelpScreen() {
  const { t } = useT();
  return (
    <div className="page">
      <TopBar title={t('help.title')} />
      <NetIllustration />
      <div className="help-sections">
        {SECTIONS.map((s) => (
          <section key={s.title} className="help-card">
            <h2><span className={'tile-icon small ' + s.accent}><s.icon /></span>{t(s.title)}</h2>
            {t(s.body).split('\n').map((line, i) => <p key={i}>{line}</p>)}
          </section>
        ))}
      </div>
    </div>
  );
}
