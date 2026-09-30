import { useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import { FiChevronRight } from 'react-icons/fi';
import { useT, LANGS } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';

const SPEEDS = ['normal', 'fast', 'slow'];
const SPEED_LABEL = { normal: 'speed.normal', fast: 'speed.fast', slow: 'speed.slow' };

function loadSpeed() {
  try {
    const v = localStorage.getItem('cubeSpeed');
    return SPEEDS.includes(v) ? v : 'normal';
  } catch { return 'normal'; }
}

export default function SettingsScreen() {
  const { t, lang, setLang } = useT();
  const { navigate } = useNav();

  const [theme, setTheme] = useState(() => (localStorage.getItem('theme') === 'light' ? 1 : 0));
  const [speed, setSpeed] = useState(loadSpeed);

  const langIndex = LANGS.findIndex((l) => l.id === lang);

  const cycleTheme = () => {
    const next = (theme + 1) % 2;
    setTheme(next);
    const val = next === 1 ? 'light' : 'dark';
    document.documentElement.dataset.theme = val;
    try { localStorage.setItem('theme', val); } catch { /* ignore */ }
  };

  const cycleLang = () => {
    const next = LANGS[(langIndex + 1) % LANGS.length];
    setLang(next.id);
  };

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    try { localStorage.setItem('cubeSpeed', next); } catch { /* ignore */ }
  };

  const rows = [
    { title: t('settings.theme'),    value: t(theme === 1 ? 'theme.light' : 'theme.dark'), onClick: cycleTheme },
    { title: t('settings.language'), value: LANGS[langIndex].label,                        onClick: cycleLang },
    { title: t('settings.speed'),    value: t(SPEED_LABEL[speed]),                         onClick: cycleSpeed },
    { title: t('settings.help'),     value: t('settings.helpDesc'),                        onClick: () => navigate('help') },
  ];

  return (
      <div className="app">
        <TopBar title={t('settings.title')} />

        <div className="menu" style={{ marginTop: 8 }}>
          {rows.map((r) => (
              <button key={r.title} className="card" onClick={r.onClick}>
            <span className="body">
              <span className="title">{r.title}</span>
              <div className="desc">{r.value}</div>
            </span>
                <FiChevronRight className="chevron" />
              </button>
          ))}
        </div>
      </div>
  );
}