import { useState, useCallback, useEffect } from 'react';
import { FiBox } from 'react-icons/fi';
import { LanguageProvider } from './i18n.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import SolverEntryScreen from './screens/SolverEntryScreen.jsx';
import ScanScreen from './screens/ScanScreen.jsx';
import ManualInputScreen from './screens/ManualInputScreen.jsx';
import ReviewScreen from './screens/ReviewScreen.jsx';
import SolveScreen from './screens/SolveScreen.jsx';
import LearnScreen from './screens/LearnScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import AboutScreen from './screens/AboutScreen.jsx';

function EntrySplash() {
  return (
    <>
      <div className="splash-inner">
        <div className="splash-logo"><FiBox size={40} /></div>
        <div className="splash-title">Cube Solver</div>
      </div>
      <div className="splash-footer">VZstudio</div>
    </>
  );
}

export default function App() {
  const [route, setRoute] = useState({ screen: 'home', params: {} });
  const [splash, setSplash] = useState(true);
  const [splashOut, setSplashOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setSplashOut(true), 1400);
    const t2 = setTimeout(() => setSplash(false), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const navigate = useCallback((screen, params = {}) => {
    setRoute({ screen, params });
    window.scrollTo(0, 0);
  }, []);

  const { screen, params } = route;

  let content;
  switch (screen) {
    case 'solverEntry': content = <SolverEntryScreen navigate={navigate} />; break;
    case 'scan': content = <ScanScreen navigate={navigate} algorithm={params.algorithm} />; break;
    case 'manual': content = <ManualInputScreen navigate={navigate} prefill={params.prefill} algorithm={params.algorithm} />; break;
    case 'review': content = <ReviewScreen navigate={navigate} faceletState={params.faceletState} algorithm={params.algorithm} />; break;
    case 'solve': content = <SolveScreen navigate={navigate} faceletState={params.faceletState} algorithm={params.algorithm} />; break;
    case 'learn': content = <LearnScreen navigate={navigate} />; break;
    case 'settings': content = <SettingsScreen navigate={navigate} />; break;
    case 'about': content = <AboutScreen navigate={navigate} />; break;
    default: content = <HomeScreen navigate={navigate} enter={splashOut} />;
  }

  return (
    <LanguageProvider>
      {content}
      {splash && <div className={'splash' + (splashOut ? ' out' : '')}><EntrySplash /></div>}
    </LanguageProvider>
  );
}
