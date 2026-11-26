import { useEffect } from 'react';

/** Keeps the screen on while `active` (where the Wake Lock API exists). */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !navigator.wakeLock) return;
    let lock = null, released = false;
    const acquire = () => navigator.wakeLock.request('screen')
      .then((l) => { if (released) l.release(); else lock = l; })
      .catch(() => {});
    acquire();
    const onVis = () => { if (!document.hidden && !released) acquire(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { released = true; lock?.release().catch(() => {}); document.removeEventListener('visibilitychange', onVis); };
  }, [active]);
}
