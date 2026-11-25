import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { LanguageProvider } from './i18n.jsx';
import { NavContext } from './navigation.jsx';
import UpdateToast from './components/UpdateToast.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import SolverEntryScreen from './screens/SolverEntryScreen.jsx';
import ManualInputScreen from './screens/ManualInputScreen.jsx';
import ReviewScreen from './screens/ReviewScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import AboutScreen from './screens/AboutScreen.jsx';
import HelpScreen from './screens/HelpScreen.jsx';

const ScanScreen = lazy(() => import('./screens/ScanScreen.jsx'));
const CalibrateScreen = lazy(() => import('./screens/CalibrateScreen.jsx'));
const SolveScreen = lazy(() => import('./screens/SolveScreen.jsx'));
const LearnScreen = lazy(() => import('./screens/LearnScreen.jsx'));

const SCREENS = {
  home: HomeScreen,
  solverEntry: SolverEntryScreen,
  scan: ScanScreen,
  calibrate: CalibrateScreen,
  manual: ManualInputScreen,
  review: ReviewScreen,
  solve: SolveScreen,
  learn: LearnScreen,
  settings: SettingsScreen,
  about: AboutScreen,
  help: HelpScreen,
};
// Screens that may be opened directly from a URL (PWA shortcuts): ?screen=scan
const DEEP_LINKABLE = new Set(['solverEntry', 'scan', 'manual', 'learn', 'help', 'settings', 'about']);

let keySeq = 0;
const entry = (screen, params = {}) => ({ screen, params, key: ++keySeq });

function initialStack() {
  const stack = [entry('home')];
  try {
    const s = new URLSearchParams(location.search).get('screen');
    if (s && DEEP_LINKABLE.has(s)) stack.push(entry(s));
  } catch { /* ignore */ }
  return stack;
}

function Loader() {
  return <div className="screen-loader"><div className="spinner" /></div>;
}

export default function App() {
  const [stack, setStack] = useState(initialStack);
  const [dir, setDir] = useState('forward');
  const stackRef = useRef(stack);
  stackRef.current = stack;

  // The in-app stack is mirrored in browser history, so the Android back button,
  // the back gesture and the browser back button all go one screen back.
  useEffect(() => {
    const url = location.pathname; // drop ?screen= after use
    history.replaceState({ depth: 0 }, '', url);
    for (let i = 1; i < stackRef.current.length; i++) history.pushState({ depth: i }, '', url);
    const onPop = (e) => {
      const depth = e.state?.depth ?? 0;
      setDir('back');
      setStack((prev) => (depth < prev.length - 1 ? prev.slice(0, Math.max(1, depth + 1)) : prev));
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((screen, params = {}, { replace = false } = {}) => {
    if (!SCREENS[screen]) screen = 'home';
    setDir('forward');
    const prev = stackRef.current;
    if (replace && prev.length > 1) {
      history.replaceState({ depth: prev.length - 1 }, '');
      setStack([...prev.slice(0, -1), entry(screen, params)]);
    } else {
      history.pushState({ depth: prev.length }, '');
      setStack([...prev, entry(screen, params)]);
    }
    window.scrollTo(0, 0);
  }, []);

  const back = useCallback(() => {
    if (stackRef.current.length > 1) history.back();
  }, []);

  const home = useCallback(() => {
    const n = stackRef.current.length - 1;
    if (n > 0) history.go(-n);
  }, []);

  const top = stack[stack.length - 1];
  const Screen = SCREENS[top.screen] || HomeScreen;

  return (
    <NavContext.Provider value={{ navigate, back, home, canGoBack: stack.length > 1 }}>
      <LanguageProvider>
        <div className="backdrop" aria-hidden="true" />
        <main key={top.key} className={'screen ' + dir}>
          <Suspense fallback={<Loader />}>
            <Screen {...top.params} />
          </Suspense>
        </main>
        <UpdateToast />
      </LanguageProvider>
    </NavContext.Provider>
  );
}
