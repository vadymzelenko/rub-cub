import TopBar from '../components/TopBar.jsx';

const LESSONS = [
  { id: 'cross', title: '1. Крест', desc: 'Собираем белый крест на первой грани' },
  { id: 'corners', title: '2. Угловые элементы', desc: 'Завершаем первый слой' },
  { id: 'middle', title: '3. Второй слой', desc: 'Вставляем рёбра среднего слоя' },
  { id: 'oll-cross', title: '4. Жёлтый крест', desc: 'Ориентируем рёбра последнего слоя' },
  { id: 'oll-corners', title: '5. Жёлтые углы', desc: 'Ориентируем углы последнего слоя' },
  { id: 'pll-corners', title: '6. Расстановка углов', desc: 'Переставляем угловые элементы' },
  { id: 'pll-edges', title: '7. Расстановка рёбер', desc: 'Финальный шаг сборки' },
];

export default function LearnScreen({ navigate }) {
  return (
    <div className="app">
      <TopBar title="Обучение" onBack={() => navigate('home')} />
      <p className="subtitle">Простой послойный метод — 7 шагов</p>

      <div className="menu" style={{ marginTop: 16 }}>
        {LESSONS.map((l) => (
          <div key={l.id} className="card" style={{ cursor: 'default' }}>
            <span className="body">
              <span className="title">{l.title}</span>
              <div className="desc">{l.desc}</div>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
