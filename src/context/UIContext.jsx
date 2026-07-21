import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const UIContext = createContext();

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};

const getLocalStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item !== null && item !== 'undefined' ? JSON.parse(item) : defaultValue;
  } catch { return defaultValue; }
};

const setLocalStorage = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

export const UIProvider = ({ children }) => {
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'mobile';
    return getLocalStorage('viewMode', 'desktop');
  });

  const [isManualViewMode, setIsManualViewMode] = useState(false);

  const handleSetViewMode = useCallback((newMode) => {
    setViewMode(newMode);
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
    setLocalStorage('viewMode', viewMode);
  }, [viewMode, isManualViewMode]);

  const [appLayout, setAppLayout] = useState(() => getLocalStorage('appLayout', 'modern'));
  useEffect(() => { setLocalStorage('appLayout', appLayout); }, [appLayout]);

  const [appTheme, setAppTheme] = useState(() => getLocalStorage('appTheme', 'light'));
  useEffect(() => {
    setLocalStorage('appTheme', appTheme);
    document.documentElement.setAttribute('data-theme', appTheme);
    document.documentElement.classList.toggle('dark', appTheme === 'dark');
  }, [appTheme]);

  const [appColor, setAppColor] = useState(() => getLocalStorage('appColor', 'blue'));
  useEffect(() => {
    setLocalStorage('appColor', appColor);
    document.documentElement.setAttribute('data-color', appColor);
  }, [appColor]);

  const [appFontSize, setAppFontSize] = useState(() => {
    return parseInt(localStorage.getItem('appFontSize')) || 14;
  });
  useEffect(() => {
    document.documentElement.style.fontSize = `${appFontSize}px`;
    setLocalStorage('appFontSize', appFontSize);
  }, [appFontSize]);

  const [performanceMode, setPerformanceMode] = useState(() => localStorage.getItem('performanceMode') === 'true');
  useEffect(() => {
    document.body.classList.toggle('performance-mode', performanceMode);
    localStorage.setItem('performanceMode', performanceMode);
  }, [performanceMode]);

  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('compactMode') === 'true');
  useEffect(() => {
    document.body.classList.toggle('compact-mode', compactMode);
    localStorage.setItem('compactMode', compactMode);
  }, [compactMode]);

  const [focusMode, setFocusMode] = useState(false);
  const [isLivePreviewMode, setIsLivePreviewMode] = useState(false);

  const value = useMemo(() => ({
    viewMode, setViewMode: handleSetViewMode,
    appLayout, setAppLayout,
    appTheme, setAppTheme,
    appColor, setAppColor,
    appFontSize, setAppFontSize,
    performanceMode, setPerformanceMode,
    compactMode, setCompactMode,
    focusMode, setFocusMode,
    isLivePreviewMode, setIsLivePreviewMode,
  }), [viewMode, appLayout, appTheme, appColor, appFontSize, performanceMode, compactMode, focusMode, isLivePreviewMode]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
