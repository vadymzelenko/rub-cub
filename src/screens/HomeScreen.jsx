import { FiCamera, FiBookOpen, FiSettings, FiDroplet, FiHelpCircle, FiGrid, FiDownload, FiShare, FiArrowRight } from 'react-icons/fi';
import { useT } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';
import { useInstall } from '../pwa.js';
import Logo from '../components/Logo.jsx';
import HeroCube from '../components/HeroCube.jsx';

export default function HomeScreen() {
  const { t } = useT();
  const { navigate } = useNav();
  const install = useInstall();

  return (
    <div className="page home">
      <header className="brand">
        <Logo size={30} />
        <span className="brand-name">RubCub</span>
        <button className="icon-btn ml-auto" onClick={() => navigate('settings')} aria-label={t('menu.settings')}>
          <FiSettings size={20} />
        </button>
      </header>

      <section className="hero">
        <HeroCube />
        <h1 className="hero-title">{t('home.title')}</h1>
        <p className="hero-sub">{t('home.subtitle')}</p>
      </section>

      <div className="cta-stack">
        <button className="btn btn-primary btn-lg" onClick={() => navigate('scan')}>
          <FiCamera size={20} /> {t('entry.scan')}
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate('manual')}>
          <FiGrid size={20} /> {t('entry.manual')}
        </button>
      </div>

      {install.mode && (
        <div className="install-card">
          <span className="install-icon">{install.mode === 'ios' ? <FiShare /> : <FiDownload />}</span>
          <div className="install-text">
            <strong>{t('pwa.installTitle')}</strong>
            <span>{t(install.mode === 'ios' ? 'pwa.iosHint' : 'pwa.installDesc')}</span>
          </div>
          {install.mode === 'prompt' && (
            <button className="btn btn-small btn-primary" onClick={install.install}>{t('pwa.install')}</button>
          )}
        </div>
      )}

      <div className="tile-grid">
        <button className="tile tile-wide" onClick={() => navigate('learn')}>
          <span className="tile-icon accent-green"><FiBookOpen /></span>
          <span className="tile-body">
            <span className="tile-title">{t('menu.learn')}</span>
            <span className="tile-desc">{t('menu.learnDesc')}</span>
          </span>
          <FiArrowRight className="tile-arrow" />
        </button>
        <button className="tile" onClick={() => navigate('help')}>
          <span className="tile-icon accent-blue"><FiHelpCircle /></span>
          <span className="tile-title">{t('menu.help')}</span>
          <span className="tile-desc">{t('menu.helpDesc')}</span>
        </button>
        <button className="tile" onClick={() => navigate('calibrate')}>
          <span className="tile-icon accent-orange"><FiDroplet /></span>
          <span className="tile-title">{t('entry.calibrate')}</span>
          <span className="tile-desc">{t('home.calibrateDesc')}</span>
        </button>
      </div>

      <footer className="home-footer">
        <button className="link" onClick={() => navigate('about')}>{t('menu.about')}</button>
        <span>·</span>
        <span>VZstudio</span>
      </footer>
    </div>
  );
}
