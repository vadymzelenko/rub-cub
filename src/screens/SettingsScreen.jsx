import { useState } from 'react';
import { FiMoon, FiSun, FiMonitor, FiGlobe, FiZap, FiDroplet, FiHelpCircle, FiInfo, FiChevronRight, FiDownload } from 'react-icons/fi';
import TopBar from '../components/TopBar.jsx';
import { useT, LANGS } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';
import { useSettings, setSetting, THEMES, SPEEDS } from '../settings.js';
import { calibrationCount, resetCalibration } from '../vision/ColorDetector.js';
import { useInstall } from '../pwa.js';

const THEME_ICON = { system: FiMonitor, dark: FiMoon, light: FiSun };

function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button key={o.id} role="radio" aria-checked={value === o.id} className={value === o.id ? 'active' : ''} onClick={() => onChange(o.id)}>
          {o.icon && <o.icon />} {o.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsScreen() {
  const { t, lang, setLang } = useT();
  const { navigate } = useNav();
  const { theme, speed } = useSettings();
  const [calib, setCalib] = useState(calibrationCount);
  const install = useInstall();

  return (
    <div className="page">
      <TopBar title={t('settings.title')} />

      <p className="section-label">{t('settings.theme')}</p>
      <Segmented
        value={theme}
        onChange={(v) => setSetting('theme', v)}
        options={THEMES.map((id) => ({ id, label: t('theme.' + id), icon: THEME_ICON[id] }))}
      />

      <p className="section-label"><FiZap /> {t('settings.speed')}</p>
      <Segmented
        value={speed}
        onChange={(v) => setSetting('speed', v)}
        options={SPEEDS.map((id) => ({ id, label: t('speed.' + id) }))}
      />

      <p className="section-label"><FiGlobe /> {t('settings.language')}</p>
      <div className="lang-grid">
        {LANGS.map((l) => (
          <button key={l.id} className={'lang' + (lang === l.id ? ' active' : '')} onClick={() => setLang(l.id)}>
            {l.label}
          </button>
        ))}
      </div>

      <p className="section-label">{t('settings.more')}</p>
      <div className="list">
        <div className="row static">
          <span className="tile-icon accent-orange"><FiDroplet /></span>
          <span className="row-body">
            <span className="row-title">{t('settings.calib')}</span>
            <span className="row-desc">{t('settings.calibCount', { n: calib })}</span>
          </span>
          {calib > 0
            ? <button className="btn btn-small btn-secondary" onClick={() => { resetCalibration(); setCalib(0); }}>{t('calib.reset')}</button>
            : <button className="btn btn-small btn-secondary" onClick={() => navigate('calibrate')}>{t('settings.calibStart')}</button>}
        </div>
        {install.mode === 'prompt' && (
          <button className="row" onClick={install.install}>
            <span className="tile-icon accent-green"><FiDownload /></span>
            <span className="row-body"><span className="row-title">{t('pwa.installTitle')}</span><span className="row-desc">{t('pwa.installDesc')}</span></span>
            <FiChevronRight className="row-chevron" />
          </button>
        )}
        <button className="row" onClick={() => navigate('help')}>
          <span className="tile-icon accent-blue"><FiHelpCircle /></span>
          <span className="row-body"><span className="row-title">{t('settings.help')}</span><span className="row-desc">{t('settings.helpDesc')}</span></span>
          <FiChevronRight className="row-chevron" />
        </button>
        <button className="row" onClick={() => navigate('about')}>
          <span className="tile-icon accent-red"><FiInfo /></span>
          <span className="row-body"><span className="row-title">{t('menu.about')}</span><span className="row-desc">{t('about.version', { v: __APP_VERSION__ })}</span></span>
          <FiChevronRight className="row-chevron" />
        </button>
      </div>
    </div>
  );
}
