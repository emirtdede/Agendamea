import React, { createContext, useContext, useEffect, useMemo } from 'react';
import {
  getLanguageMeta,
  isValidLanguageCode,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
  type LanguageMeta,
} from './languages';
import { getDictionary } from './localesWorld';
import {
  getLegalDocuments,
  THEME_NAME_TRANSLATIONS,
  TR_DICTIONARY,
  type LegalDocId,
  type LegalDocumentContent,
  type UiDictionary,
} from './translations';

interface I18nContextValue {
  lang: LanguageCode;
  meta: LanguageMeta;
  t: UiDictionary;
  languages: readonly LanguageMeta[];
  onChangeLanguage: (code: LanguageCode) => void;
  getThemeDisplayName: (themeId: string, fallbackName: string) => string;
  legalDocs: Record<LegalDocId, LegalDocumentContent>;
}

const DEFAULT_META = getLanguageMeta('tr');

const I18nContext = createContext<I18nContextValue>({
  lang: 'tr',
  meta: DEFAULT_META,
  t: TR_DICTIONARY,
  languages: SUPPORTED_LANGUAGES,
  onChangeLanguage: () => {},
  getThemeDisplayName: (_id, fallback) => fallback,
  legalDocs: getLegalDocuments('tr', TR_DICTIONARY),
});

export function readInitialLanguage(): {
  code: LanguageCode;
  hasStoredPreference: boolean;
} {
  try {
    const saved = localStorage.getItem('agendamea-language');
    if (saved && isValidLanguageCode(saved)) {
      return { code: saved, hasStoredPreference: true };
    }
  } catch {
    // Ignore storage read failure
  }
  return { code: 'tr', hasStoredPreference: false };
}

export function I18nProvider({
  lang,
  onChangeLanguage,
  children,
}: {
  lang: LanguageCode;
  onChangeLanguage: (code: LanguageCode) => void;
  children: React.ReactNode;
}) {
  const meta = useMemo(() => getLanguageMeta(lang), [lang]);
  const dict = useMemo(() => getDictionary(lang), [lang]);
  const legalDocs = useMemo(() => getLegalDocuments(lang, dict), [lang, dict]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = meta.code;
      document.documentElement.dir = meta.dir;
    }
    try {
      localStorage.setItem('agendamea-language', meta.code);
    } catch {
      // Ignore storage errors
    }
  }, [meta]);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang: meta.code,
      meta,
      t: dict,
      languages: SUPPORTED_LANGUAGES,
      onChangeLanguage,
      getThemeDisplayName: (themeId: string, fallbackName: string) => {
        const entry = THEME_NAME_TRANSLATIONS[themeId];
        if (!entry) return fallbackName;
        return meta.code === 'tr' ? entry.tr : entry.en;
      },
      legalDocs,
    }),
    [meta, dict, onChangeLanguage, legalDocs],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
