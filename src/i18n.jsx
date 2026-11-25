import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { translations } from './locales.js';

export const LANGS = [
  { id: 'en', label: 'English' },
  { id: 'pl', label: 'Polski' },
  { id: 'uk', label: 'Українська' },
  { id: 'ru', label: 'Русский' },
];

function detectLang() {
  try {
    const saved = localStorage.getItem('lang');
    if (saved && translations[saved]) return saved;
  } catch { /* ignore */ }
  const nav = (navigator.languages || [navigator.language || 'en']).map((l) => l.slice(0, 2).toLowerCase());
  return nav.find((l) => translations[l]) || 'en';
}

const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectLang);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem('lang', l); } catch { /* ignore */ }
  }, []);

  const t = useCallback((key, vars) => {
    let s = translations[lang]?.[key] ?? translations.en[key] ?? translations.ru[key] ?? key;
    if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT() {
  return useContext(LanguageContext);
}

/** Human-readable text for an analyzeState() error. */
export function errorText(t, err) {
  const vars = { ...(err.vars || {}) };
  if (vars.piece) vars.piece = vars.piece.split('').map((f) => t('face.' + f)).join(' · ');
  if (vars.color) vars.color = t('color.' + vars.color);
  return t(err.key, vars);
}
