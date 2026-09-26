import { FiChevronLeft } from 'react-icons/fi';

export default function TopBar({ title, onBack }) {
  return (
    <div className="topbar">
      {onBack && (
        <button className="back" onClick={onBack}>
          <FiChevronLeft size={18} />
          Назад
        </button>
      )}
      <div className="title">{title}</div>
    </div>
  );
}
