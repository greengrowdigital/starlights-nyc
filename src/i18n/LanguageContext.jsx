import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dictionary, LANGUAGES } from './dictionary';

const STORAGE_KEY = 'starlights.lang';

const LanguageContext = createContext(null);

/**
 * English is the primary language of this site, not a fallback: a first-time
 * visitor always lands in English regardless of their browser locale. Spanish
 * is available, but only ever because someone chose it — and once chosen it is
 * remembered for that visitor.
 */
function detectInitial() {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && dictionary[saved]) return saved;
  } catch {
    // Private mode / storage blocked — English it is.
  }
  return 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(detectInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Nothing to do — the toggle still works for this session.
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const toggle = useCallback(() => {
    setLang((current) => (current === 'en' ? 'es' : 'en'));
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggle,
      t: dictionary[lang],
      // Pull the localized half of a service row from src/data/services.js.
      s: (item) => (item ? item[lang] || item.en : {}),
      languages: LANGUAGES,
    }),
    [lang, toggle],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>');
  return ctx;
}
