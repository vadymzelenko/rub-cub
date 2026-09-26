import TopBar from '../components/TopBar.jsx';
import { useT } from '../i18n.jsx';

export default function AboutScreen({ navigate }) {
  const { t } = useT();
  const lines = [
    ['Cube Solver', 'title'],
    [t('about.version'), 'muted'],
    ['', 'space'],
    [t('about.engine'), 'text'],
    [t('about.solver'), 'text'],
    [t('about.vision'), 'text'],
    ['', 'space'],
    [t('about.pack'), 'text'],
    ['', 'space'],
    ['VZstudio', 'muted'],
  ];

  return (
    <div className="app">
      <TopBar title={t('about.title')} onBack={() => navigate('home')} />
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
