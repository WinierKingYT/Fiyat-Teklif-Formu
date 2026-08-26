import { useMemo } from 'react';
import tr from '@/i18n/tr.json';
import Logger from '@/utils/logger';
import { translations as pdfTranslations } from '@/utils/translations';

const uiTranslations: Record<string, string> = tr;

export function useTranslation(_language = 'tr') {
  return useMemo(() => {
    const ui = uiTranslations;
    const pdf = (pdfTranslations.tr || pdfTranslations) as Record<string, string>;

    const t = (key: string) => {
      if (ui[key] !== undefined) return ui[key];
      if (pdf[key] !== undefined) return pdf[key];
      Logger.warn(`Translation key not found: "${key}"`);
      return key;
    };

    return { t, lang: 'tr' };
  }, []);
}
