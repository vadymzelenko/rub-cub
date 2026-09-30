import { FiBox, FiBookOpen, FiSettings, FiInfo, FiChevronRight, FiHelpCircle } from 'react-icons/fi';
import { useT } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';
import Logo from '../components/Logo.jsx';

const MENU = [
    { screen: 'solverEntry', icon: FiBox,        title: 'menu.solve',    desc: 'menu.solveDesc' },
    { screen: 'learn',       icon: FiBookOpen,   title: 'menu.learn',    desc: 'menu.learnDesc' },
    { screen: 'help',        icon: FiHelpCircle, title: 'menu.help',     desc: 'menu.helpDesc' },
    { screen: 'settings',    icon: FiSettings,   title: 'menu.settings', desc: 'menu.settingsDesc' },
    { screen: 'about',       icon: FiInfo,       title: 'menu.about',    desc: 'menu.aboutDesc' },
];

export default function HomeScreen() {
    const { t } = useT();
    const { navigate } = useNav();

    return (
        <div className="app">
            <div className="hero">
                <div className="hero-row">
                    <div className="logo"><Logo size={26} /></div>
                    <div className="hero-text">
                        <h1>RubCub</h1>
                        <p className="subtitle">{t('appSubtitle')}</p>
                    </div>
                </div>
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
            <div className="footer">VZstudio · RubCub</div>

        </div>
    );
}