import React from 'react';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type AppTheme = 'light' | 'dark';
export type AppColor = 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate' | 'indigo' | 'teal' | 'cyan';
export type AppLanguage = 'tr' | 'en' | 'de';

export const APP_LANGUAGES: readonly AppLanguage[] = ['tr', 'en', 'de'];

export interface UIContextValue {
  appLanguage: AppLanguage;
  setAppLanguage: (language: AppLanguage | ((prev: AppLanguage) => AppLanguage)) => void;
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme | ((prev: AppTheme) => AppTheme)) => void;
  appColor: AppColor;
  setAppColor: (color: AppColor | ((prev: AppColor) => AppColor)) => void;
  appFontSize: number;
  setAppFontSize: (size: number | ((prev: number) => number)) => void;
  performanceMode: boolean;
  setPerformanceMode: (mode: boolean | ((prev: boolean) => boolean)) => void;
  compactMode: boolean;
  setCompactMode: (mode: boolean | ((prev: boolean) => boolean)) => void;
  focusMode: boolean;
  setFocusMode: (mode: boolean | ((prev: boolean) => boolean)) => void;
  isLivePreviewMode: boolean;
  setIsLivePreviewMode: (mode: boolean | ((prev: boolean) => boolean)) => void;
  splitPreviewMode: boolean;
  setSplitPreviewMode: (mode: boolean | ((prev: boolean) => boolean)) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export const useUI = (): UIContextValue => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};

export const useOptionalUI = (): UIContextValue | null => useContext(UIContext);

const getLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item !== null && item !== 'undefined' ? JSON.parse(item) : defaultValue;
  } catch { return defaultValue; }
};

const setLocalStorage = (key: string, value: unknown): void => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [appLanguage, setAppLanguage] = useState<AppLanguage>(() => {
    const savedLanguage = getLocalStorage<string>('appLanguage', 'tr');
    return APP_LANGUAGES.includes(savedLanguage as AppLanguage) ? savedLanguage as AppLanguage : 'tr';
  });
  useEffect(() => {
    setLocalStorage('appLanguage', appLanguage);
    document.documentElement.setAttribute('lang', appLanguage);
  }, [appLanguage]);

  const [appTheme, setAppTheme] = useState<AppTheme>(() => getLocalStorage('appTheme', 'light'));
  useEffect(() => {
    setLocalStorage('appTheme', appTheme);
    document.documentElement.setAttribute('data-theme', appTheme);
    document.documentElement.classList.toggle('dark', appTheme === 'dark');
  }, [appTheme]);

  const [appColor, setAppColor] = useState<AppColor>(() => getLocalStorage('appColor', 'blue'));
  useEffect(() => {
    setLocalStorage('appColor', appColor);
    document.documentElement.setAttribute('data-color', appColor);
  }, [appColor]);

  const [appFontSize, setAppFontSize] = useState<number>(() => {
    return getLocalStorage('appFontSize', 14);
  });
  useEffect(() => {
    document.documentElement.style.setProperty('--font-size-base', `${appFontSize}px`);
    setLocalStorage('appFontSize', appFontSize);
  }, [appFontSize]);

  const [performanceMode, setPerformanceMode] = useState<boolean>(() => localStorage.getItem('performanceMode') === 'true');
  useEffect(() => {
    document.body.classList.toggle('performance-mode', performanceMode);
    localStorage.setItem('performanceMode', String(performanceMode));
  }, [performanceMode]);

  const [compactMode, setCompactMode] = useState<boolean>(() => localStorage.getItem('compactMode') === 'true');
  useEffect(() => {
    document.body.classList.toggle('compact-mode', compactMode);
    localStorage.setItem('compactMode', String(compactMode));
  }, [compactMode]);

  const [focusMode, setFocusMode] = useState(false);
  const [isLivePreviewMode, setIsLivePreviewMode] = useState(false);
  const [splitPreviewMode, setSplitPreviewMode] = useState<boolean>(() => localStorage.getItem('splitPreviewMode') === 'true');

  useEffect(() => {
    localStorage.setItem('splitPreviewMode', String(splitPreviewMode));
  }, [splitPreviewMode]);

  const value = useMemo<UIContextValue>(() => ({
    appLanguage, setAppLanguage,
    appTheme, setAppTheme,
    appColor, setAppColor,
    appFontSize, setAppFontSize,
    performanceMode, setPerformanceMode,
    compactMode, setCompactMode,
    focusMode, setFocusMode,
    isLivePreviewMode, setIsLivePreviewMode,
    splitPreviewMode, setSplitPreviewMode,
  }), [appLanguage, appTheme, appColor, appFontSize, performanceMode, compactMode, focusMode, isLivePreviewMode, splitPreviewMode]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
