import { useEffect } from 'react';
import { FiCamera, FiGrid, FiDroplet, FiChevronRight } from 'react-icons/fi';
import TopBar from '../components/TopBar.jsx';
import { useT } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';
import { warmupSolver } from '../solvers/kociemba.js';

const ITEMS = [
  { screen: 'scan', icon: FiCamera, title: 'entry.scan', desc: 'entry.scanDesc', accent: 'accent-green' },
  { screen: 'manual', icon: FiGrid, title: 'entry.manual', desc: 'entry.manualDesc', accent: 'accent-blue' },
  { screen: 'calibrate', icon: FiDroplet, title: 'entry.calibrate', desc: 'entry.calibrateDesc', accent: 'accent-orange' },
];

export default function SolverEntryScreen() {
  const { t } = useT();
  const { navigate } = useNav();
  useEffect(() => { warmupSolver(); }, []);

  return (
    <div className="page">
      <TopBar title={t('entry.title')} />
      <p className="section-label">{t('entry.inputMethod')}</p>
      <div className="list">
        {ITEMS.map((it) => (
          <button key={it.screen} className="row" onClick={() => navigate(it.screen)}>
            <span className={'tile-icon ' + it.accent}><it.icon /></span>
            <span className="row-body">
              <span className="row-title">{t(it.title)}</span>
              <span className="row-desc">{t(it.desc)}</span>
            </span>
            <FiChevronRight className="row-chevron" />
          </button>
        ))}
      </div>
    </div>
  );
}
