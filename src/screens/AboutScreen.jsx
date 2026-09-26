import TopBar from '../components/TopBar.jsx';

export default function AboutScreen({ navigate }) {
  const lines = [
    ['Cube Solver', 'title'],
    ['Версия 0.2.0', 'muted'],
    ['', 'space'],
    ['Движок: React + Vite', 'text'],
    ['Решатель: Kociemba Two-Phase (cube.js)', 'text'],
    ['Распознавание: камера + анализ цвета (без OpenCV)', 'text'],
    ['', 'space'],
    ['Упаковка: Capacitor (Android/iOS)', 'text'],
  ];

  return (
    <div className="app">
      <TopBar title="О программе" onBack={() => navigate('home')} />
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        {lines.map(([text, kind], i) =>
          kind === 'space' ? (
            <div key={i} style={{ height: 16 }} />
          ) : (
            <p key={i} style={{
              margin: '6px 0',
              fontSize: kind === 'title' ? 24 : 14,
              fontWeight: kind === 'title' ? 700 : 400,
              color: kind === 'muted' ? 'var(--muted)' : 'var(--text)',
            }}>{text}</p>
          )
        )}
      </div>
    </div>
  );
}
