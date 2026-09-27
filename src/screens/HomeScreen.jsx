import { FiBox, FiBookOpen, FiSettings, FiInfo, FiChevronRight, FiHelpCircle } from 'react-icons/fi';
import { useT } from '../i18n.jsx';

const MENU = [
  { screen: 'solverEntry', icon: FiBox, title: 'menu.solve', desc: 'menu.solveDesc' },
  { screen: 'learn', icon: FiBookOpen, title: 'menu.learn', desc: 'menu.learnDesc' },
  { screen: 'help', icon: FiHelpCircle, title: 'menu.help', desc: 'menu.helpDesc' },
  { screen: 'settings', icon: FiSettings, title: 'menu.settings', desc: 'menu.settingsDesc' },
  { screen: 'about', icon: FiInfo, title: 'menu.about', desc: 'menu.aboutDesc' },
];

export default function HomeScreen({ navigate }) {
  const { t } = useT();

  return (
    <div className="app">
      <div className="hero">
        <div className="logo"><FiBox size={26} /></div>
        <h1>{t('appTitle')}</h1>
        <p className="subtitle">{t('appSubtitle')}</p>
      </div>

      <div className="menu">
        {MENU.map((item) => (
          <button key={item.screen} className="card" onClick={() => navigate(item.screen)}>
            <span className="icon"><item.icon /></span>
            <span className="body">
              <span className="title">{t(item.title)}</span>
              <div className="desc">{t(item.desc)}</div>
            </span>
            <FiChevronRight className="chevron" />
          </button>
        ))}
      </div>

      <div className="footer">VZstudio · Cube Solver</div>
    </div>
  );
}

