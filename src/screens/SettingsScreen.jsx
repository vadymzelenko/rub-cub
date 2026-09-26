import { useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import { FiChevronRight } from 'react-icons/fi';
import { useT, LANGS } from '../i18n.jsx';

export default function SettingsScreen({ navigate }) {
  const { t, lang, setLang } = useT();
  const [theme, setTheme] = useState(() => (document.documentElement.dataset.theme === 'light' ? 1 : 0));
  const [notation, setNotation] = useState(0);
  const [speed, setSpeed] = useState(0);

  const langIndex = LANGS.findIndex((l) => l.id === lang);

  const cycleTheme = () => {
    const next = (theme + 1) % 2;
    setTheme(next);
    document.documentElement.dataset.theme = next === 1 ? 'light' : 'dark';
  };

  const cycleLang = () => {
    const next = LANGS[(langIndex + 1) % LANGS.length];
    setLang(next.id);
  };

  const rows = [
    { title: t('settings.theme'), value: t(theme === 0 ? 'theme.dark' : 'theme.light'), onClick: cycleTheme },
    { title: t('settings.language'), value: LANGS[langIndex].label, onClick: cycleLang },
    { title: t('settings.notation'), value: t(notation === 0 ? 'notation.std' : 'notation.singmaster'), onClick: () => setNotation((v) => (v + 1) % 2) },
    { title: t('settings.speed'), value: t(['speed.normal', 'speed.fast', 'speed.slow'][speed]), onClick: () => setSpeed((v) => (v + 1) % 3) },
  ];

  return (
    <div className="app">
      <TopBar title={t('settings.title')} onBack={() => navigate('home')} />

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
