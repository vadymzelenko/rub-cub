import { useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import { FiCamera, FiGrid, FiCheck, FiCircle, FiChevronRight } from 'react-icons/fi';
import { useT } from '../i18n.jsx';

const ALGOS = [
  { id: 'kociemba', label: 'entry.kociemba', desc: 'entry.kociembaDesc' },
  { id: 'cfop', label: 'entry.cfop', desc: 'entry.cfopDesc' },
];

export default function SolverEntryScreen({ navigate }) {
  const { t } = useT();
  const [algo, setAlgo] = useState('kociemba');

  return (
    <div className="app">
      <TopBar title={t('entry.title')} onBack={() => navigate('home')} />

      <div className="section-label">{t('entry.inputMethod')}</div>
      <div className="menu" style={{ marginTop: 0 }}>
        <button className="card" onClick={() => navigate('scan', { algorithm: algo })}>
          <span className="icon"><FiCamera /></span>
          <span className="body">
            <span className="title">{t('entry.scan')}</span>
            <div className="desc">{t('entry.scanDesc')}</div>
          </span>
          <FiChevronRight className="chevron" />
        </button>
        <button className="card" onClick={() => navigate('manual', { algorithm: algo })}>
          <span className="icon"><FiGrid /></span>
          <span className="body">
            <span className="title">{t('entry.manual')}</span>
            <div className="desc">{t('entry.manualDesc')}</div>
          </span>
          <FiChevronRight className="chevron" />
        </button>
      </div>

      <div className="section-label">{t('entry.algorithm')}</div>
      <div className="menu" style={{ marginTop: 0 }}>
        {ALGOS.map((a) => (
          <button key={a.id} className="card" onClick={() => setAlgo(a.id)}>
            <span className="icon">{algo === a.id ? <FiCheck /> : <FiCircle />}</span>
            <span className="body">
              <span className="title">{t(a.label)}</span>
              <div className="desc">{t(a.desc)}</div>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
