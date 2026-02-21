'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import {
  SupportedLocale,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  getLocaleFromCookie,
  setLocaleCookie,
  normalizeLocale,
} from '@/lib/locale';

type Translations = Record<string, Record<string, string>>;

interface TranslationContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
  isLoading: true,
});

async function loadTranslations(locale: SupportedLocale): Promise<Translations> {
  const namespaces = [
    'common',
    'home',
    'auth',
    'dashboard',
    'tournaments',
    'athletes',
    'rankings',
    'profile',
  ];

  const result: Translations = {};

  await Promise.all(
    namespaces.map(async (ns) => {
      try {
        const mod = await import(`../locales/${locale}/${ns}.json`);
        result[ns] = mod.default || mod;
      } catch {
        // Fallback to English if translation file missing
        if (locale !== DEFAULT_LOCALE) {
          try {
            const fallback = await import(`../locales/en/${ns}.json`);
            result[ns] = fallback.default || fallback;
          } catch {
            result[ns] = {};
          }
        } else {
          result[ns] = {};
        }
      }
    })
  );

  return result;
}

function trackLanguageDemand(browserLocale: string, normalizedLang: string) {
  try {
    fetch('/api/analytics/language-demand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        browserLocale,
        normalizedLang,
        pageUrl: window.location.pathname,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {});
  } catch {
    // Fire-and-forget, silent fail
  }
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  // Resolve initial locale
  useEffect(() => {
    let resolved: SupportedLocale = DEFAULT_LOCALE;

    // Priority 1: Cookie
    const cookieLocale = getLocaleFromCookie();
    if (cookieLocale) {
      resolved = cookieLocale;
    }
    // Priority 2: User's DB preference (from session)
    else if (session?.user?.preferredLanguage) {
      const dbLocale = normalizeLocale(session.user.preferredLanguage);
      if (dbLocale) {
        resolved = dbLocale;
        setLocaleCookie(resolved);
      }
    }
    // Priority 3: Browser language
    else if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language || navigator.languages?.[0];
      if (browserLang) {
        const matched = normalizeLocale(browserLang);
        if (matched) {
          resolved = matched;
          setLocaleCookie(resolved);
        } else {
          // Unsupported language — track demand
          trackLanguageDemand(browserLang, browserLang.split('-')[0]);
        }
      }
    }

    setLocaleState(resolved);
  }, [session?.user?.preferredLanguage]);

  // Load translations when locale changes
  useEffect(() => {
    setIsLoading(true);
    loadTranslations(locale).then((t) => {
      setTranslations(t);
      setIsLoading(false);
    });
  }, [locale]);

  const setLocale = useCallback(
    (newLocale: SupportedLocale) => {
      if (!SUPPORTED_LOCALES.includes(newLocale)) return;
      setLocaleState(newLocale);
      setLocaleCookie(newLocale);

      // Save to DB if logged in
      if (session?.user) {
        fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferredLanguage: newLocale }),
        }).catch(() => {});
      }
    },
    [session?.user]
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const [namespace, ...rest] = key.split('.');
      const translationKey = rest.join('.');

      const value = translations[namespace]?.[translationKey];

      if (!value) {
        if (process.env.NODE_ENV === 'development' && !isLoading) {
          console.warn(`[i18n] Missing translation: "${key}" for locale "${locale}"`);
        }
        return translationKey || key;
      }

      if (!params) return value;

      // Interpolate {param} placeholders
      return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : `{${paramKey}}`;
      });
    },
    [translations, locale, isLoading]
  );

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t, isLoading }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}
