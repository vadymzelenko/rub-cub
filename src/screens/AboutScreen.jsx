import { FiCamera, FiZap, FiBookOpen, FiWifiOff } from 'react-icons/fi';
import TopBar from '../components/TopBar.jsx';
import Logo from '../components/Logo.jsx';
import { useT } from '../i18n.jsx';

export default function AboutScreen() {
  const { t } = useT();
  const features = [
    [FiCamera, 'about.feat1'],
    [FiZap, 'about.feat2'],
    [FiBookOpen, 'about.feat3'],
    [FiWifiOff, 'about.feat4'],
  ];
  return (
    <div className="page">
      <TopBar title={t('about.title')} />
      <div className="about-hero">
        <Logo size={84} />
        <h2>RubCub</h2>
        <p className="muted">{t('about.version', { v: __APP_VERSION__ })}</p>
        <p className="about-intro">{t('about.intro')}</p>
      </div>
      <div className="list">
        {features.map(([Icon, key]) => (
          <div key={key} className="row static">
            <span className="tile-icon small accent-green"><Icon /></span>
            <span className="row-body"><span className="row-title">{t(key)}</span></span>
          </div>
        ))}
      </div>
      <p className="section-label">{t('about.tech')}</p>
      <div className="card-plain small-text">
        <p>{t('about.solver')}</p>
        <p>{t('about.engine')}</p>
        <p>{t('about.pack')}</p>
      </div>
      <p className="about-credit">VZstudio · Vadym Zelenko · MIT</p>
    </div>
  );
}
