import { useState, useCallback } from 'react';
import HomeScreen from './screens/HomeScreen.jsx';
import SolverEntryScreen from './screens/SolverEntryScreen.jsx';
import ScanScreen from './screens/ScanScreen.jsx';
import ManualInputScreen from './screens/ManualInputScreen.jsx';
import ReviewScreen from './screens/ReviewScreen.jsx';
import SolveScreen from './screens/SolveScreen.jsx';
import LearnScreen from './screens/LearnScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import AboutScreen from './screens/AboutScreen.jsx';

export default function App() {
  const [route, setRoute] = useState({ screen: 'home', params: {} });

  const navigate = useCallback((screen, params = {}) => {
    setRoute({ screen, params });
    window.scrollTo(0, 0);
  }, []);

  const { screen, params } = route;

  switch (screen) {
    case 'solverEntry':
      return <SolverEntryScreen navigate={navigate} />;
    case 'scan':
      return <ScanScreen navigate={navigate} algorithm={params.algorithm} />;
    case 'manual':
      return <ManualInputScreen navigate={navigate} prefill={params.prefill} algorithm={params.algorithm} />;
    case 'review':
      return <ReviewScreen navigate={navigate} faceletState={params.faceletState} algorithm={params.algorithm} />;
    case 'solve':
      return <SolveScreen navigate={navigate} faceletState={params.faceletState} algorithm={params.algorithm} />;
    case 'learn':
      return <LearnScreen navigate={navigate} />;
    case 'settings':
      return <SettingsScreen navigate={navigate} />;
    case 'about':
      return <AboutScreen navigate={navigate} />;
    case 'home':
    default:
      return <HomeScreen navigate={navigate} />;
  }
}
