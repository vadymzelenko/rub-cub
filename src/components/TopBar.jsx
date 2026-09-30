import { FiChevronLeft } from 'react-icons/fi';
import { useT } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';

export default function TopBar({ title, onBack }) {
    const { t } = useT();
    const { back, canGoBack, navigate } = useNav();

    // Всегда есть обработчик: сначала onBack (если передали),
    // потом реальный back из стека, потом — принудительный переход на home.
    const handleBack = onBack || (canGoBack ? back : () => navigate('home'));

    return (
        <div className="topbar">
            <button className="back" onClick={handleBack}>
                <FiChevronLeft size={18} />
                {t('nav.back')}
            </button>
            <div className="title">{title}</div>
        </div>
    );
}