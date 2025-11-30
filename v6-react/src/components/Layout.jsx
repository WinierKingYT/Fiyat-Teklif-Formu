import React, { useState, useEffect } from 'react';
import Header from './Header';
import TabBar from './TabBar';
import PdfPreviewPanel from './PdfPreviewPanel';
import { useQuote } from '../context/QuoteContext';

const Layout = ({ children, currentView, onNavigate }) => {
    const [theme, setTheme] = useState(localStorage.getItem('appTheme') || 'light');
    const { viewMode, focusMode, setFocusMode, isLivePreviewMode } = useQuote();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('appTheme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Standard responsive layout wrapper
    const wrapperStyle = {
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        transition: 'background-color 0.3s ease'
    };

    // Container with max-width for larger screens, full width for mobile
    const containerStyle = {
        maxWidth: viewMode === 'mobile' || focusMode ? '100%' : '1400px',
        margin: '0 auto',
        padding: viewMode === 'mobile' || focusMode ? '0' : '0 1rem',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
    };

    return (
        <div className="layout-wrapper" style={wrapperStyle}>
            <div className={`app-container ${viewMode === 'mobile' ? 'mobile-view' : ''}`} style={containerStyle}>
                {!focusMode && (
                    <Header
                        theme={theme}
                        toggleTheme={toggleTheme}
                        currentView={currentView}
                        onNavigate={onNavigate}
                    />
                )}

                {focusMode && (
                    <div className="fixed top-4 right-4 z-50">
                        <button
                            onClick={() => setFocusMode(false)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full shadow-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <span>Odak Modundan Çık</span>
                        </button>
                    </div>
                )}

                {currentView === 'builder' && <TabBar />}
                <main className="main-content" style={{
                    flex: 1,
                    padding: viewMode === 'mobile' ? '1rem' : (focusMode && !isLivePreviewMode ? '2rem 10%' : '2rem'),
                    overflowX: 'hidden',
                    maxWidth: (focusMode && !isLivePreviewMode) ? '1200px' : '100%',
                    margin: (focusMode && !isLivePreviewMode) ? '0 auto' : '0',
                    display: 'block', // Always block, we handle visibility inside
                    transition: 'all 0.3s ease-in-out',
                }}>
                    <div style={{
                        display: isLivePreviewMode ? 'none' : 'block',
                        opacity: isLivePreviewMode ? 0 : 1,
                        transition: 'opacity 0.2s ease-in-out'
                    }}>
                        {children}
                    </div>

                    {isLivePreviewMode && (
                        <div style={{
                            width: '100%',
                            height: 'calc(100vh - 100px)',
                            animation: 'fadeIn 0.3s ease-in-out'
                        }}>
                            <PdfPreviewPanel />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Layout;
