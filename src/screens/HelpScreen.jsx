import TopBar from '../components/TopBar.jsx';
import { useT } from '../i18n.jsx';

const SECTIONS = [
  { title: 'help.scanTitle', body: 'help.scanBody' },
  { title: 'help.notationTitle', body: 'help.notationBody' },
  { title: 'help.solveTitle', body: 'help.solveBody' },
  { title: 'help.tipsTitle', body: 'help.tipsBody' },
];

export default function HelpScreen({ navigate }) {
  const { t } = useT();
  return (
    <div className="app scroll">
      <TopBar title={t('help.title')} onBack={() => navigate('home')} />
      {SECTIONS.map((s) => (
        <div key={s.title} className="help-section">
          <div className="help-title">{t(s.title)}</div>
          <div className="help-body">{t(s.body)}</div>
        </div>
      ))}
    </div>
  );
}