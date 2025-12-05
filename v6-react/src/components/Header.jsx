import React, { useRef, useState, useEffect } from 'react';
import { FileText, Moon, Sun, LayoutDashboard, Settings, FileDown, Save, Upload, Download, Smartphone, Monitor, Maximize, Columns, Undo, Redo, PlusCircle, Users, Package, LayoutTemplate, Database, Landmark, Trash2 } from 'lucide-react';
import { useQuote } from '../context/QuoteContext';
import { generatePDF } from '../utils/pdfGenerator';

const Header = ({
    theme,
    toggleTheme,
    currentView,
    onNavigate,
    onOpenCustomerManager,
    onOpenProductManager,
    onOpenTemplateManager,
    onOpenDatabaseManager,
    onOpenBankManager,
    onOpenRecycleBin
}) => {
    const {
        createBackup,
        restoreBackup,
        quoteData,
        setIsPdfModalOpen,
        appFontSize,
        setAppFontSize,
        setFocusMode,
        fillTestData,
        isLivePreviewMode,
        setIsLivePreviewMode,
        viewMode,
        setViewMode,
        saveQuote,
        undo,
        redo,
        canUndo,
        canRedo
    } = useQuote();
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

                        <div className="flex gap-1 mr-2 border-r border-slate-200 dark:border-slate-700 pr-2">
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={undo}
                                disabled={!canUndo}
                                title="Geri Al"
                            >
                                <Undo size={16} />
                            </button>
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={redo}
                                disabled={!canRedo}
                                title="Yinele"
                            >
                                <Redo size={16} />
                            </button>
                        </div>

                        <button className="btn btn-sm btn-outline hidden md:inline-flex" onClick={() => onNavigate('builder')} title="Yeni Teklif">
                            <PlusCircle size={16} />
                            <span className="hidden lg:inline">Yeni</span>
                        </button>
                        <button className="btn btn-sm btn-outline hidden md:inline-flex" onClick={() => document.dispatchEvent(new CustomEvent('open-history-modal'))} title="Tekliflerim">
                            <FileText size={16} />
                            <span className="hidden lg:inline">Tekliflerim</span>
                        </button>

                        <button className="btn btn-sm btn-outline hidden md:inline-flex" onClick={saveQuote} title="Taslağı Kaydet">
                            <Save size={16} className="text-blue-600" />
                            <span className="hidden lg:inline">Kaydet</span>
                        </button>
                        <button className="btn btn-sm btn-outline hidden md:inline-flex" onClick={createBackup} title="Yedek Al">
                            <Download size={16} />
                            <span className="hidden lg:inline">Yedekle</span>
                        </button>
                        <button className="btn btn-sm btn-outline hidden md:inline-flex" onClick={() => fileInputRef.current?.click()} title="Yedek Yükle">
                            <Upload size={16} />
                            <span className="hidden lg:inline">Geri Yükle</span>
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
                            onClick={() => setViewMode(prev => prev === 'mobile' ? 'desktop' : 'mobile')}
                            title={viewMode === 'mobile' ? 'Masaüstü Görünümüne Geç' : 'Mobil Görünüme Geç'}
                        >
                            {viewMode === 'mobile' ? <Monitor size={16} /> : <Smartphone size={16} />}
                        </button>
                        <button
                            className="btn btn-sm btn-outline hidden md:inline-flex"
                            onClick={() => setFocusMode(true)}
                            title="Odak Modu"
                        >
                            <Maximize size={16} />
                        </button>

                        <button
                            className="btn btn-sm btn-outline"
                            onClick={fillTestData}
                            title="Test Verisi Doldur"
                        >
                            <span className="font-bold text-xs">TEST</span>
                        </button>

                        <button
                            className="btn btn-sm theme-toggle"
                            onClick={toggleTheme}
                            title={theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <button
                            className={`btn ${isLivePreviewMode ? 'btn-primary' : 'btn-outline'} px-6 py-2 text-base font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5`}
                            onClick={() => setIsLivePreviewMode(!isLivePreviewMode)}
                            title="PDF Önizle ve Oluştur"
                        >
                            <FileDown size={20} className="mr-2" />
                            <span className="hidden lg:inline">PDF DÜZENLE</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
