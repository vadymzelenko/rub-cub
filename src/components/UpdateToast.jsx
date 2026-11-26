import { useEffect } from 'react';
import { FiRefreshCw, FiWifiOff, FiX } from 'react-icons/fi';
import { useServiceWorker } from '../pwa.js';
import { useT } from '../i18n.jsx';

export default function UpdateToast() {
  const { t } = useT();
  const { needRefresh, offlineReady, update, dismiss } = useServiceWorker();

  useEffect(() => {
    if (!offlineReady || needRefresh) return;
    const id = setTimeout(dismiss, 4000);
    return () => clearTimeout(id);
  }, [offlineReady, needRefresh, dismiss]);

  if (!needRefresh && !offlineReady) return null;
  return (
    <div className="toast" role="status">
      <span className="toast-icon">{needRefresh ? <FiRefreshCw /> : <FiWifiOff />}</span>
      <span className="toast-text">{t(needRefresh ? 'pwa.update' : 'pwa.offline')}</span>
      {needRefresh && <button className="toast-btn" onClick={update}>{t('pwa.reload')}</button>}
      <button className="toast-close" onClick={dismiss} aria-label={t('common.close')}><FiX /></button>
    </div>
  );
}
