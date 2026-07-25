import React from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

type ViewMode = 'desktop' | 'mobile';
type AppTheme = 'light' | 'dark';
type AppColor = 'blue' | 'purple' | 'green' | 'red' | 'orange';
type AppLayout = 'modern' | 'classic';

export interface UIContextValue {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode | ((prev: ViewMode) => ViewMode)) => void;
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme | ((prev: AppTheme) => AppTheme)) => void;
  appColor: AppColor;
  setAppColor: (color: AppColor | ((prev: AppColor) => AppColor)) => void;
  appLayout: AppLayout;
  setAppLayout: (layout: AppLayout | ((prev: AppLayout) => AppLayout)) => void;
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
}

const UIContext = createContext<UIContextValue | null>(null);

export const useUI = (): UIContextValue => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};

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
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'mobile';
    return getLocalStorage('viewMode', 'desktop');
  });

  const [isManualViewMode, setIsManualViewMode] = useState(false);

  const handleSetViewMode = useCallback((newModeOrFn: ViewMode | ((prev: ViewMode) => ViewMode)) => {
    if (typeof newModeOrFn === 'function') {
      setViewMode((prev) => {
        const newMode = newModeOrFn(prev);
        setLocalStorage('viewMode', newMode);
        return newMode;
      });
    } else {
      setViewMode(newModeOrFn);
      setLocalStorage('viewMode', newModeOrFn);
    }
    setIsManualViewMode(true);
  }, []);

  useEffect(() => {
    if (!isManualViewMode) {
      const handleResize = () => {
        if (window.innerWidth < 768 && viewMode !== 'mobile') setViewMode('mobile');
        else if (window.innerWidth >= 768 && viewMode === 'mobile') setViewMode('desktop');
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [viewMode, isManualViewMode]);

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

  const [appLayout, setAppLayout] = useState<AppLayout>(() => getLocalStorage('appLayout', 'modern'));
  useEffect(() => {
    setLocalStorage('appLayout', appLayout);
  }, [appLayout]);

  const [appFontSize, setAppFontSize] = useState<number>(() => {
    return parseInt(localStorage.getItem('appFontSize')!) || 14;
  });
  useEffect(() => {
    document.documentElement.style.fontSize = `${appFontSize}px`;
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

  const value = useMemo<UIContextValue>(() => ({
    viewMode, setViewMode: handleSetViewMode,
    appTheme, setAppTheme,
    appColor, setAppColor,
    appLayout, setAppLayout,
    appFontSize, setAppFontSize,
    performanceMode, setPerformanceMode,
    compactMode, setCompactMode,
    focusMode, setFocusMode,
    isLivePreviewMode, setIsLivePreviewMode,
  }), [viewMode, appTheme, appColor, appLayout, appFontSize, performanceMode, compactMode, focusMode, isLivePreviewMode]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
