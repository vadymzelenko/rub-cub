import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { FiBox, FiBookOpen, FiSettings, FiInfo, FiChevronRight } from 'react-icons/fi';
import { useT } from '../i18n.jsx';

const MENU = [
  { screen: 'solverEntry', icon: FiBox, title: 'menu.solve', desc: 'menu.solveDesc' },
  { screen: 'learn', icon: FiBookOpen, title: 'menu.learn', desc: 'menu.learnDesc' },
  { screen: 'settings', icon: FiSettings, title: 'menu.settings', desc: 'menu.settingsDesc' },
  { screen: 'about', icon: FiInfo, title: 'menu.about', desc: 'menu.aboutDesc' },
];

export default function HomeScreen({ navigate, enter }) {
  const { t } = useT();
  const rootRef = useRef(null);

  useEffect(() => {
    if (!enter) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero > *', { y: 22, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' });
      gsap.from('.menu .card', { y: 26, opacity: 0, duration: 0.55, stagger: 0.09, delay: 0.25, ease: 'power3.out' });
      gsap.from('.footer', { opacity: 0, y: 10, duration: 0.6, delay: 0.65, ease: 'power3.out' });
    }, rootRef);
    return () => ctx.revert();
  }, [enter]);

  return (
    <div className="app" ref={rootRef}>
      <div className="hero">
        <div className="logo"><FiBox size={24} /></div>
        <h1>{t('appTitle')}</h1>
        <p className="subtitle">{t('appSubtitle')}</p>
      </div>

      <div className="menu">
        {MENU.map((item) => (
          <button key={item.screen} className="card" onClick={() => navigate(item.screen)}>
            <span className="icon"><item.icon /></span>
            <span className="body">
              <span className="title">{t(item.title)}</span>
              <div className="desc">{t(item.desc)}</div>
            </span>
            <FiChevronRight className="chevron" />
          </button>
        ))}
      </div>

      <div className="footer">VZstudio · Cube Solver</div>
    </div>
  );
}

