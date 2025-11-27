import React, { useState, useEffect } from 'react';
import Header from './Header';
import { useQuote } from '../context/QuoteContext';

const Layout = ({ children, currentView, onNavigate }) => {
    const [theme, setTheme] = useState(localStorage.getItem('appTheme') || 'light');
    const { viewMode } = useQuote();

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
        maxWidth: viewMode === 'mobile' ? '100%' : '1400px',
        margin: '0 auto',
        padding: viewMode === 'mobile' ? '0' : '0 1rem',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
    };

    return (
        <div className="layout-wrapper" style={wrapperStyle}>
            <div className={`app-container ${viewMode === 'mobile' ? 'mobile-view' : ''}`} style={containerStyle}>
                <Header
                    theme={theme}
                    toggleTheme={toggleTheme}
                    currentView={currentView}
                    onNavigate={onNavigate}
                />
                <main className="main-content" style={{
                    flex: 1,
                    padding: viewMode === 'mobile' ? '1rem' : '2rem',
                    overflowX: 'hidden'
                }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
