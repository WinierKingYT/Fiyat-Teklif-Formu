import React, { useRef, useState, useEffect } from 'react';
import { FileText, Moon, Sun, LayoutDashboard, Settings, FileDown, Save, Upload, Download, Smartphone, Monitor, Maximize, Columns, Undo, Redo, PlusCircle, Users, Package, LayoutTemplate, Database, Landmark, Trash2, History } from 'lucide-react';
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
    onOpenRecycleBin,
    isSplitView,
    setIsSplitView
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

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const menuItems = [
        { icon: Users, label: 'Müşteri Yönetimi', count: null, onClick: onOpenCustomerManager },
        { icon: Package, label: 'Ürün Kataloğu', count: null, onClick: onOpenProductManager },
        { icon: LayoutTemplate, label: 'Şablonlar', count: null, onClick: onOpenTemplateManager },
        { icon: Database, label: 'Veritabanı', count: null, onClick: onOpenDatabaseManager },
        { icon: Landmark, label: 'Banka Bilgileri', count: null, onClick: onOpenBankManager },
        { icon: History, label: 'Tekliflerim', count: null, onClick: () => document.dispatchEvent(new CustomEvent('open-history-modal')) },
        { icon: Trash2, label: 'Geri Dönüşüm', count: null, onClick: onOpenRecycleBin },
        { icon: Database, label: 'Test Verisi', count: null, onClick: fillTestData, className: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
    ];

    return (
        <>
            <header className="app-header relative z-30">
                <div className="header-content">
                    <button
                        className="mr-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        onClick={() => setIsMenuOpen(true)}
                        title="Uygulama Menüsü"
                    >
                        <LayoutDashboard size={24} className="text-slate-600 dark:text-slate-300" />
                    </button>

                    <a href="#" className="logo" onClick={(e) => { e.preventDefault(); onNavigate('builder'); }}>
                        <div className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-2">
                            <FileText size={24} />
                        </div>
                        <span className="text-xl font-extrabold tracking-tight text-gradient-premium">TeklifMaster Pro</span>
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
                                className={`btn btn-sm ${isSplitView ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setIsSplitView(!isSplitView)}
                                title={isSplitView ? "Tek Sütun Görünümü" : "İkiye Böl"}
                            >
                                {isSplitView ? <LayoutTemplate size={16} /> : <Columns size={16} />}
                            </button>

                            <button className="btn btn-sm btn-ghost hover:bg-blue-50 text-blue-600" onClick={() => onNavigate('builder')} title="Yeni Teklif">
                                <PlusCircle size={18} />
                                <span className="hidden lg:inline font-medium">Yeni</span>
                            </button>

                            <button className="btn btn-sm btn-ghost hover:bg-green-50 text-green-600" onClick={saveQuote} title="Taslağı Kaydet">
                                <Save size={18} />
                                <span className="hidden lg:inline font-medium">Kaydet</span>
                            </button>

                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                            {/* Focus Mode Removed */}

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
            </header >

            {/* Sidebar Drawer */}
            <div className={`fixed inset-0 z-50 transform transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsMenuOpen(false)}
                ></div>

                {/* Sidebar Content */}
                <div className="relative w-80 h-full bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col">
                    <button
                        className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <Settings size={20} className="opacity-0" /> {/* Spacer */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold">&times;</span>
                        </div>
                    </button>

                    <div className="mb-8 flex items-center gap-3 px-2">
                        <div className="p-2 rounded-xl bg-blue-600 text-white">
                            <FileText size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">TeklifMaster</h2>
                            <p className="text-sm text-slate-500">Yönetim Paneli</p>
                        </div>
                    </div>

                    <div className="space-y-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    item.onClick();
                                    setIsMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group ${item.className || 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg transition-colors ${item.className ? 'bg-transparent' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                    }`}>
                                    <item.icon size={20} />
                                </div>
                                <span className="font-semibold text-base">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <div className="text-xs text-center text-slate-400">
                            &copy; 2024 TeklifMaster Pro v2.3
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Header;
