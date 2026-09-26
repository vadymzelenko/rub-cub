import { useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import { FiChevronRight } from 'react-icons/fi';

const OPTIONS = {
  theme: ['Тёмная', 'Светлая'],
  language: ['Русский', 'English'],
  notation: ['Стандартная', 'Singmaster'],
  speed: ['Обычная', 'Быстрая', 'Медленная'],
};
const TITLES = { theme: 'Тема', language: 'Язык', notation: 'Нотация ходов', speed: 'Скорость анимации' };

export default function SettingsScreen({ navigate }) {
  const [values, setValues] = useState({ theme: 0, language: 0, notation: 0, speed: 0 });
  const [status, setStatus] = useState('');

  const cycle = (id) => {
    setValues((v) => {
      const next = (v[id] + 1) % OPTIONS[id].length;
      if (id === 'theme') {
        document.documentElement.dataset.theme = next === 1 ? 'light' : 'dark';
      }
      setStatus(`${TITLES[id]}: ${OPTIONS[id][next]}`);
      return { ...v, [id]: next };
    });
  };

  return (
    <div className="app">
      <TopBar title="Настройки" onBack={() => navigate('home')} />

      <div className="menu" style={{ marginTop: 8 }}>
        {Object.keys(OPTIONS).map((id) => (
          <button key={id} className="card" onClick={() => cycle(id)}>
            <span className="body">
              <span className="title">{TITLES[id]}</span>
              <div className="desc">{OPTIONS[id][values[id]]}</div>
            </span>
            <FiChevronRight className="chevron" />
          </button>
        ))}
      </div>

      <div className="status" style={{ marginTop: 16 }}>{status}</div>
    </div>
  );
}
