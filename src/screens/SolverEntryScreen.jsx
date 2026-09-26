import { useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import { FiCamera, FiGrid, FiCheck, FiCircle, FiChevronRight } from 'react-icons/fi';

const ALGOS = [
  { id: 'kociemba', label: 'Kociemba (Two-Phase)', desc: 'Оптимальное число ходов' },
  { id: 'cfop', label: 'Fridrich (CFOP)', desc: 'Пошагово как спидкубер' },
];

export default function SolverEntryScreen({ navigate }) {
  const [algo, setAlgo] = useState('kociemba');

  return (
    <div className="app">
      <TopBar title="Собрать кубик" onBack={() => navigate('home')} />

      <div className="section-label">Способ ввода</div>
      <div className="menu" style={{ marginTop: 0 }}>
        <button className="card" onClick={() => navigate('scan', { algorithm: algo })}>
          <span className="icon"><FiCamera /></span>
          <span className="body">
            <span className="title">Сканировать камерой</span>
            <div className="desc">Наведите камеру на кубик</div>
          </span>
          <FiChevronRight className="chevron" />
        </button>
        <button className="card" onClick={() => navigate('manual', { algorithm: algo })}>
          <span className="icon"><FiGrid /></span>
          <span className="body">
            <span className="title">Ввести вручную</span>
            <div className="desc">Отметьте цвета на развёртке</div>
          </span>
          <FiChevronRight className="chevron" />
        </button>
      </div>

      <div className="section-label">Алгоритм сборки</div>
      <div className="menu" style={{ marginTop: 0 }}>
        {ALGOS.map((a) => (
          <button key={a.id} className="card" onClick={() => setAlgo(a.id)}>
            <span className="icon">{algo === a.id ? <FiCheck /> : <FiCircle />}</span>
            <span className="body">
              <span className="title">{a.label}</span>
              <div className="desc">{a.desc}</div>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
