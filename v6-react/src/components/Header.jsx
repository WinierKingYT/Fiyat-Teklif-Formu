import React, { useRef, useState, useEffect } from 'react';
import { FileText, Moon, Sun, LayoutDashboard, Settings, FileDown, Save, Upload, Download, Smartphone, Monitor } from 'lucide-react';
import { useQuote } from '../context/QuoteContext';
import { generatePDF } from '../utils/pdfGenerator';

const Header = ({ theme, toggleTheme, currentView, onNavigate }) => {
    const { createBackup, restoreBackup, quoteData, setIsPdfModalOpen } = useQuote();
    const fileInputRef = useRef(null);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            restoreBackup(file);
        }
    };

    const handleDownloadPDF = () => {
        setIsPdfModalOpen(true);
    };

    return (
        <header className="app-header">
            <div className="header-content">
                <a href="#" className="logo" onClick={(e) => { e.preventDefault(); onNavigate('builder'); }}>
                    <FileText size={24} />
                    TeklifMaster Pro
                    <span className="version-badge">v2.3 (React)</span>
                </a>

                <div className="header-actions">
                    <div className="action-group">
                        {deferredPrompt && (
                            <button className="btn btn-sm btn-primary" onClick={handleInstallClick} title="Uygulamayı Yükle">
                                <Download size={16} />
                                <span className="hidden md:inline">Yükle</span>
                            </button>
                        )}
                        <button className="btn btn-sm btn-outline" onClick={createBackup} title="Yedek Al">
                            <Save size={16} />
                            <span className="hidden md:inline">Yedekle</span>
                        </button>
                        <button className="btn btn-sm btn-outline" onClick={() => fileInputRef.current?.click()} title="Yedek Yükle">
                            <Upload size={16} />
                            <span className="hidden md:inline">Geri Yükle</span>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".json"
                            onChange={handleFileChange}
                            title="Yedek Dosyası Seç"
                        />
                    </div>

                    <div className="action-group">
                        <button
                            className={`btn btn-sm ${currentView === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => onNavigate('dashboard')}
                            title="Dashboard"
                        >
                            <LayoutDashboard size={16} />
                            <span className="hidden md:inline">Dashboard</span>
                        </button>
                        <button
                            className={`btn btn-sm ${currentView === 'settings' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => onNavigate('settings')}
                            title="Ayarlar"
                        >
                            <Settings size={16} />
                            <span className="hidden md:inline">Ayarlar</span>
                        </button>
                        <button
                            className="btn btn-sm theme-toggle"
                            onClick={() => useQuote().setViewMode(prev => prev === 'mobile' ? 'desktop' : 'mobile')}
                            title={useQuote().viewMode === 'mobile' ? 'Masaüstü Görünümüne Geç' : 'Mobil Görünüme Geç'}
                        >
                            {useQuote().viewMode === 'mobile' ? <Monitor size={16} /> : <Smartphone size={16} />}
                        </button>
                        <button
                            className="btn btn-sm theme-toggle"
                            onClick={toggleTheme}
                            title={theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={handleDownloadPDF}>
                            <FileDown size={16} />
                            <span>PDF Oluştur</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
