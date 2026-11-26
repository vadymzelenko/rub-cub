import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { applyTheme, onThemeChange } from './settings.js';
import { registerServiceWorker } from './pwa.js';
// Weight files include unicode-range, so browsers only fetch the subsets in use.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import './index.css';

applyTheme();

// iOS Safari ignores user-scalable=no; block pinch-zoom gestures explicitly.
for (const ev of ['gesturestart', 'gesturechange']) {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
}
registerServiceWorker();

createRoot(document.getElementById('root')).render(<App />);

// Native shell (Capacitor): system bar icons follow the theme, splash hides once the UI is up.
import('@capacitor/core').then(async ({ Capacitor, SystemBars, SystemBarsStyle }) => {
  if (!Capacitor.isNativePlatform()) return;
  const { SplashScreen } = await import('@capacitor/splash-screen');
  const sync = (theme) => {
    SystemBars.setStyle({ style: theme === 'light' ? SystemBarsStyle.Light : SystemBarsStyle.Dark }).catch(() => {});
  };
  sync(document.documentElement.dataset.theme);
  onThemeChange(sync);
  SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});
});
