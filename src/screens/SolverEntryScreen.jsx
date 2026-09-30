import TopBar from '../components/TopBar.jsx';
import { FiCamera, FiGrid, FiDroplet, FiChevronRight } from 'react-icons/fi';
import { useT } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';

export default function SolverEntryScreen() {
    const { t } = useT();
    const { navigate } = useNav();

    return (
        <div className="app">
            <TopBar title={t('entry.title')} />

            <div className="section-label">{t('entry.inputMethod')}</div>
            <div className="menu" style={{ marginTop: 0 }}>
                <button className="card" onClick={() => navigate('scan')}>
                    <span className="icon"><FiCamera /></span>
                    <span className="body">
            <span className="title">{t('entry.scan')}</span>
            <div className="desc">{t('entry.scanDesc')}</div>
          </span>
                    <FiChevronRight className="chevron" />
                </button>

                <button className="card" onClick={() => navigate('manual')}>
                    <span className="icon"><FiGrid /></span>
                    <span className="body">
            <span className="title">{t('entry.manual')}</span>
            <div className="desc">{t('entry.manualDesc')}</div>
          </span>
                    <FiChevronRight className="chevron" />
                </button>

                <button className="card" onClick={() => navigate('calibrate')}>
                    <span className="icon"><FiDroplet /></span>
                    <span className="body">
            <span className="title">{t('entry.calibrate')}</span>
            <div className="desc">{t('entry.calibrateDesc')}</div>
          </span>
                    <FiChevronRight className="chevron" />
                </button>
            </div>
        </div>
    );
}