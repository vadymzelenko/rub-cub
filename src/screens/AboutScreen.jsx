import TopBar from '../components/TopBar.jsx';
import { useT } from '../i18n.jsx';

export default function AboutScreen() {
    const { t } = useT();
    const lines = [
        [t('about.version'), 'muted'],
        ['Develop by Vadym Zelenko', 'author'],
    ];

    return (
        <div className="app">
            <TopBar title={t('about.title')} />
            <div style={{ textAlign: 'center', marginTop: 12 }}>
                {lines.map(([text, kind], i) => (
                    <p
                        key={i}
                        style={{
                            margin: '6px 0',
                            fontSize: kind === 'author' ? 16 : 14,
                            fontWeight: kind === 'author' ? 500 : 400,
                            letterSpacing: kind === 'author' ? '-0.01em' : 'normal',
                            color: kind === 'muted' ? 'var(--muted)' : 'var(--text)',
                        }}
                    >
                        {text}
                    </p>
                ))}
            </div>
        </div>
    );
}