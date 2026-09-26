import { createContext, useContext, useState, useCallback } from 'react';
import { translations } from './locales.js';

const LanguageContext = createContext({ lang: 'ru', setLang: () => {}, t: (k) => k });

export const LANGS = [
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
  { id: 'pl', label: 'Polski' },
  { id: 'uk', label: 'Українська' },
];

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('lang') || 'ru'; } catch { return 'ru'; }
  });

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem('lang', l); } catch { /* ignore */ }
  }, []);

  const t = useCallback((key, vars) => {
    let s = (translations[lang] && translations[lang][key]) || translations.ru[key] || key;
    if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  return useContext(LanguageContext);
}
