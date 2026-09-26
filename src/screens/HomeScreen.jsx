import { FiBox, FiBookOpen, FiSettings, FiInfo, FiChevronRight } from 'react-icons/fi';

const MENU = [
  { screen: 'solverEntry', icon: FiBox, title: 'Собрать кубик', desc: 'Скан камерой или ручной ввод' },
  { screen: 'learn', icon: FiBookOpen, title: 'Обучение', desc: 'Разбор по шагам, простой метод' },
  { screen: 'settings', icon: FiSettings, title: 'Настройки', desc: 'Тема, язык, управление' },
  { screen: 'about', icon: FiInfo, title: 'О программе', desc: 'Версия и источники' },
];

export default function HomeScreen({ navigate }) {
  return (
    <div className="app">
      <div className="hero">
        <div className="logo"><FiBox size={24} /></div>
        <h1>Кубик</h1>
        <p className="subtitle">Сканируй, собирай, изучай</p>
      </div>

      <div className="menu">
        {MENU.map((item) => (
          <button key={item.screen} className="card" onClick={() => navigate(item.screen)}>
            <span className="icon"><item.icon /></span>
            <span className="body">
              <span className="title">{item.title}</span>
              <div className="desc">{item.desc}</div>
            </span>
            <FiChevronRight className="chevron" />
          </button>
        ))}
      </div>

      <div className="footer">Cube Solver · 0.2.0</div>
    </div>
  );
}
