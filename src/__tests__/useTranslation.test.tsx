import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { UIProvider, useOptionalUI } from '@/context/UIContext';
import { useTranslation } from '@/hooks/useTranslation';

describe('useTranslation', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('lang');
  });

  it('uses the requested language and exposes the normalized language', () => {
    const { result } = renderHook(() => useTranslation('en'));

    expect(result.current.lang).toBe('en');
    expect(result.current.t('newQuote')).toBe('New Quote');
  });

  it('falls back to Turkish for unsupported languages and missing localized keys', () => {
    const { result } = renderHook(() => useTranslation('fr-FR'));

    expect(result.current.lang).toBe('tr');
    expect(result.current.t('newQuote')).toBe('Yeni Teklif');
    expect(result.current.t('key-that-does-not-exist')).toBe('key-that-does-not-exist');
  });

  it('reacts to the persisted global language selection', () => {
    const { result } = renderHook(() => {
      const ui = useOptionalUI();
      const translation = useTranslation();
      return { ...translation, setAppLanguage: ui?.setAppLanguage };
    }, { wrapper: UIProvider });

    expect(result.current.lang).toBe('tr');
    expect(result.current.t('settings')).toBe('Ayarlar');

    act(() => result.current.setAppLanguage?.('de'));

    expect(result.current.lang).toBe('de');
    expect(result.current.t('settings')).toBe('Einstellungen');
    expect(localStorage.getItem('appLanguage')).toBe(JSON.stringify('de'));
    expect(document.documentElement.lang).toBe('de');
  });
});
