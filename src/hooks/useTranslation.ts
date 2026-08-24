import { useMemo } from 'react';
import de from '@/i18n/de.json';
import en from '@/i18n/en.json';
import tr from '@/i18n/tr.json';
import Logger from '@/utils/logger';
import { translations as pdfTranslations } from '@/utils/translations';

const uiTranslations: { [key: string]: Record<string, string> } = { tr, en, de };

export function useTranslation(language = 'tr') {
  const lang = language || 'tr';
  const validLang = (['tr', 'en', 'de'].includes(lang) ? lang : 'tr') as keyof typeof uiTranslations;

  return useMemo(() => {
    const ui = ((uiTranslations as Record<string, Record<string, string>>)[validLang] || uiTranslations.tr) as Record<string, string>;
    const pdf = ((pdfTranslations as Record<string, Record<string, string>>)[validLang] || pdfTranslations.tr) as Record<string, string>;

    const t = (key: string) => {
      if (ui[key] !== undefined) return ui[key];
      if (pdf[key] !== undefined) return pdf[key];
      Logger.warn(`Translation key not found: "${key}" for language "${validLang}"`);
      return key;
    };

    return { t, lang: validLang };
  }, [validLang]);
}
