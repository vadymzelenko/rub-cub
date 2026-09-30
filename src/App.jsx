import { useState, useCallback, useEffect } from 'react';
import { LanguageProvider } from './i18n.jsx';
import { NavContext } from './navigation.jsx';
import BackgroundDecor from './components/BackgroundDecor.jsx';
import Logo from './components/Logo.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import SolverEntryScreen from './screens/SolverEntryScreen.jsx';
import ScanScreen from './screens/ScanScreen.jsx';
import ManualInputScreen from './screens/ManualInputScreen.jsx';
import ReviewScreen from './screens/ReviewScreen.jsx';
import SolveScreen from './screens/SolveScreen.jsx';
import LearnScreen from './screens/LearnScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import AboutScreen from './screens/AboutScreen.jsx';
import HelpScreen from './screens/HelpScreen.jsx';
import CalibrateScreen from './screens/CalibrateScreen.jsx';

const HOME = { screen: 'home', params: {} };

const KNOWN = new Set([
  'home', 'solverEntry', 'scan', 'calibrate', 'manual', 'review',
  'solve', 'learn', 'settings', 'about', 'help',
]);

function EntrySplash() {
  return (
      <>
        <div className="splash-inner">
          <div className="splash-logo"><Logo size={56} /></div>
          <div className="splash-title">RubCub</div>
        </div>
        <div className="splash-footer">VZstudio</div>
      </>
  );
}

export default function App() {
  const [stack, setStack] = useState([HOME]);
  const [splash, setSplash] = useState(true);
  const [splashOut, setSplashOut] = useState(false);

  // FAILSAFE: при каждом реальном монтировании гарантированно home.
  // Заодно чистим возможные застрявшие ключи старых версий роутера.
  useEffect(() => {
    setStack([HOME]);
    try {
      sessionStorage.removeItem('route');
      sessionStorage.removeItem('nav');
      sessionStorage.removeItem('screen');
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setSplashOut(true), 1400);
    const t2 = setTimeout(() => setSplash(false), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const navigate = useCallback((screen, params = {}) => {
    if (!KNOWN.has(screen)) screen = 'home';
    setStack((prev) => {
      const top = prev[prev.length - 1];
      if (top.screen === screen) {
        // Тот же экран — заменяем параметры, не пушим дубль.
        return [...prev.slice(0, -1), { screen, params }];
      }
      return [...prev, { screen, params }];
    });
    window.scrollTo(0, 0);
  }, []);

  const back = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    window.scrollTo(0, 0);
  }, []);

  const canGoBack = stack.length > 1;
  const { screen, params } = stack[stack.length - 1];

  let content;
  switch (screen) {
    case 'solverEntry': content = <SolverEntryScreen />; break;
    case 'scan':        content = <ScanScreen />; break;
    case 'manual':      content = <ManualInputScreen prefill={params.prefill} />; break;
    case 'review':      content = <ReviewScreen faceletState={params.faceletState} />; break;
    case 'solve':       content = <SolveScreen faceletState={params.faceletState} />; break;
    case 'learn':       content = <LearnScreen />; break;
    case 'settings':    content = <SettingsScreen />; break;
    case 'about':       content = <AboutScreen />; break;
    case 'help':        content = <HelpScreen />; break;
    case 'calibrate':   content = <CalibrateScreen />; break;
    default:            content = <HomeScreen />;
  }

  return (
      <NavContext.Provider value={{ navigate, back, canGoBack }}>
        <LanguageProvider>
          <BackgroundDecor />
          {content}
          {splash && <div className={'splash' + (splashOut ? ' out' : '')}><EntrySplash /></div>}
        </LanguageProvider>
      </NavContext.Provider>
  );
}