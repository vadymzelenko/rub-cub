import { FiChevronLeft } from 'react-icons/fi';
import { useT } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';

export default function TopBar({ title, subtitle, onBack, right }) {
  const { t } = useT();
  const { back, canGoBack, home } = useNav();
  const handleBack = onBack || (canGoBack ? back : home);

  return (
    <header className="topbar">
      <button className="icon-btn" onClick={handleBack} aria-label={t('nav.back')}>
        <FiChevronLeft size={22} />
      </button>
      <div className="topbar-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="topbar-right">{right}</div>
    </header>
  );
}
