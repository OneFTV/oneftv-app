export const SUPPORTED_LOCALES = ['en', 'pt-BR', 'es', 'fr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  'pt-BR': 'Portugues (BR)',
  es: 'Espanol',
  fr: 'Francais',
};

export const LOCALE_FLAGS: Record<SupportedLocale, string> = {
  en: '\u{1F1FA}\u{1F1F8}',
  'pt-BR': '\u{1F1E7}\u{1F1F7}',
  es: '\u{1F1EA}\u{1F1F8}',
  fr: '\u{1F1EB}\u{1F1F7}',
};

export const DEFAULT_LOCALE: SupportedLocale = 'en';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

export function normalizeLocale(browserLocale: string): SupportedLocale | null {
  const lower = browserLocale.toLowerCase().trim();

  // Exact match
  for (const locale of SUPPORTED_LOCALES) {
    if (lower === locale.toLowerCase()) return locale;
  }

  // Map Portuguese variants to pt-BR
  if (lower.startsWith('pt')) return 'pt-BR';

  // Map Spanish variants
  if (lower.startsWith('es')) return 'es';

  // Map French variants
  if (lower.startsWith('fr')) return 'fr';

  // Map English variants
  if (lower.startsWith('en')) return 'en';

  return null;
}

export function parseAcceptLanguage(header: string): SupportedLocale {
  const parts = header.split(',');

  for (const part of parts) {
    const [lang] = part.trim().split(';');
    const matched = normalizeLocale(lang);
    if (matched) return matched;
  }

  return DEFAULT_LOCALE;
}

export function getLocaleFromCookie(): SupportedLocale | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === LOCALE_COOKIE) {
      const matched = normalizeLocale(decodeURIComponent(value));
      return matched;
    }
  }
  return null;
}

export function setLocaleCookie(locale: SupportedLocale): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}
