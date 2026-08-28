import { useMemo } from 'react';
import { useOptionalUI, type AppLanguage } from '@/context/UIContext';
import de from '@/i18n/de.json';
import en from '@/i18n/en.json';
import tr from '@/i18n/tr.json';
import { translations as pdfTranslations } from '@/utils/translations';

type TranslationDictionary = Record<string, string>;

const uiTranslations: Record<AppLanguage, TranslationDictionary> = { tr, en, de };

const normalizeLanguage = (language?: string): AppLanguage => {
  const normalized = language?.toLowerCase().split('-')[0] as AppLanguage | undefined;
  return normalized && normalized in uiTranslations ? normalized : 'tr';
};

export function useTranslation(language?: string) {
  const uiContext = useOptionalUI();
  const selectedLanguage = normalizeLanguage(language ?? uiContext?.appLanguage);

  return useMemo(() => {
    const ui = uiTranslations[selectedLanguage];
    const fallbackUi = uiTranslations.tr;
    const pdf = (pdfTranslations[selectedLanguage] || pdfTranslations.tr) as TranslationDictionary;
    const fallbackPdf = pdfTranslations.tr as TranslationDictionary;

    const t = (key: string) => {
      if (ui[key] !== undefined) return ui[key];
      if (pdf[key] !== undefined) return pdf[key];
      if (fallbackUi[key] !== undefined) return fallbackUi[key];
      if (fallbackPdf[key] !== undefined) return fallbackPdf[key];
      return key;
    };

    return { t, lang: selectedLanguage };
  }, [selectedLanguage]);
}
