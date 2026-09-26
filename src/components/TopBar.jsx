import { FiChevronLeft } from 'react-icons/fi';
import { useT } from '../i18n.jsx';

export default function TopBar({ title, onBack }) {
  const { t } = useT();
  return (
    <div className="topbar">
      {onBack && (
        <button className="back" onClick={onBack}>
          <FiChevronLeft size={18} />
          {t('nav.back')}
        </button>
      )}
      <div className="title">{title}</div>
    </div>
  );
}
