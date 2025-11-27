import React, { useState } from 'react';
import Modal from './Modal';
import { FileDown, Palette, LayoutTemplate, Settings, Eye, Type, Table, Layout, ChevronRight, QrCode, Stamp, Sparkles, Trash2, AlignLeft, AlignCenter, AlignRight, FileSpreadsheet, PenTool } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';
import { exportQuoteToExcel } from '../utils/excelExporter';
import PrintableQuote from './PrintableQuoteV2';
import SignatureCanvas from './SignatureCanvas';
import { useQuote } from '../context/QuoteContext';
import toast from 'react-hot-toast';

const PdfPreviewModal = ({
    isOpen,
    onClose,
    quoteData,
    items,
    customerData,
    companyData,
    bankData,
    discount
}) => {
    const { pdfLayout } = useQuote();
    const [theme, setTheme] = useState('modern'); // modern, classic, minimal
    const [color, setColor] = useState('#000000'); // Default black to match preview
    const [activeTab, setActiveTab] = useState('appearance'); // appearance, content, table, extras

    // Advanced Configuration State
    const [config, setConfig] = useState({
        showLogo: true,
        showBankInfo: true,
        showSignatures: true,
        showTerms: true,
        showNotes: true,
        showSummary: true,
        title: 'FİYAT TEKLİFİ',
        fontFamily: 'Inter',
        fontSize: 12,
        tableHeaderFontSize: 14,
        tableRowHeight: 35,
        borderRadius: 6,
        tableHeaderBg: '#f1f5f9',
        margins: 'normal',
        showTableImages: true,
        showTableUnit: true,
        showTableTax: true,
        showQRCode: false,
        qrCodeUrl: '',
        showWatermark: false,
        watermarkText: 'TASLAK',
        watermarkOpacity: 0.1,
        watermarkColor: '#000000',
        watermarkFontSize: 120,
        watermarkRotation: -45,
        customFooter: '',
        logoPosition: 'left'
    });

    const [savedTemplates, setSavedTemplates] = useState([]);
    const [templateName, setTemplateName] = useState('');

    // Load templates from localStorage on mount
    React.useEffect(() => {
        const saved = localStorage.getItem('pdfTemplates');
        if (saved) {
            try {
                setSavedTemplates(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse templates', e);
            }
        }
    }, []);

    const saveTemplate = React.useCallback(() => {
        if (!templateName.trim()) return;
        const newTemplate = {
            id: Date.now(),
            name: templateName,
            config,
            theme,
            color
        };
        const updatedTemplates = [...savedTemplates, newTemplate];
        setSavedTemplates(updatedTemplates);
        localStorage.setItem('pdfTemplates', JSON.stringify(updatedTemplates));
        setTemplateName('');
    }, [templateName, config, theme, color, savedTemplates]);

    const loadTemplate = React.useCallback((template) => {
        setConfig(template.config);
        setTheme(template.theme);
        setColor(template.color);
    }, []);

    const deleteTemplate = React.useCallback((id) => {
        const updatedTemplates = savedTemplates.filter(t => t.id !== id);
        setSavedTemplates(updatedTemplates);
        localStorage.setItem('pdfTemplates', JSON.stringify(updatedTemplates));
    }, [savedTemplates]);

    const handleConfigChange = React.useCallback((key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleDownload = () => {
        const filename = `Teklif_${quoteData.number || 'Taslak'}.pdf`;
        // Generate PDF from the hidden printable component
        generatePDF('printable-quote-container', filename, { theme, color });
    };

    const handleExcelExport = () => {
        try {
            const fullQuoteData = {
                ...quoteData,
                customer: customerData,
                company: companyData,
                items: items,
                subTotal: quoteData.subTotal,
                taxAmount: quoteData.taxAmount,
                grandTotal: quoteData.grandTotal,
                discount: discount
            };

            exportQuoteToExcel(fullQuoteData, items);
            toast.success('Excel dosyası indirildi');
        } catch (error) {
            toast.error('Excel oluşturulurken hata oluştu');
        }
    };

    const [signature, setSignature] = useState(null);

    const tabs = [
        { id: 'appearance', label: 'Görünüm', icon: Palette },
        { id: 'content', label: 'İçerik', icon: Eye },
        { id: 'table', label: 'Tablo', icon: Table },
        { id: 'extras', label: 'Ekstra', icon: Sparkles },
        { id: 'signature', label: 'İmza', icon: PenTool }
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gelişmiş PDF Düzenleyici" size="2xl">
            <div className="flex flex-col md:flex-row gap-6 h-[80vh]">

                {/* Left: Controls */}
                <div className="w-full md:w-1/3 flex flex-col h-full">

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 pb-4">

                        {/* APPEARANCE TAB */}
                        {activeTab === 'appearance' && (
                            <>
                                {/* Template Management */}
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm">
                                        <Layout size={16} /> Şablon Yönetimi
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={templateName}
                                                onChange={(e) => setTemplateName(e.target.value)}
                                                placeholder="Şablon ismi..."
                                                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            />
                                            <button
                                                onClick={saveTemplate}
                                                disabled={!templateName.trim()}
                                                className="px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Kaydet
                                            </button>
                                        </div>

                                        {savedTemplates.length > 0 && (
                                            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                                <label className="text-xs font-medium text-slate-500">Kayıtlı Şablonlar</label>
                                                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                                    {savedTemplates.map(t => (
                                                        <div key={t.id} className="flex items-center justify-between bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600">
                                                            <span className="text-xs font-medium truncate flex-1">{t.name}</span>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => loadTemplate(t)}
                                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                                    title="Yükle"
                                                                >
                                                                    <LayoutTemplate size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteTemplate(t.id)}
                                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                                    title="Sil"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Theme Selection */}
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm">
                                        <LayoutTemplate size={16} /> Tasarım Şablonu
                                    </h4>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'modern', name: 'Modern', desc: 'Renkli, şık ve profesyonel' },
                                            { id: 'classic', name: 'Klasik', desc: 'Resmi, ciddi ve geleneksel' },
                                            { id: 'minimal', name: 'Minimal', desc: 'Sade, net ve odaklı' },
                                            { id: 'corporate', name: 'Kurumsal', desc: 'Resmi, kutulu ve düzenli' }
                                        ].map((t) => (
                                            <label key={t.id} className={`flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer transition-all ${theme === t.id ? 'bg-white dark:bg-slate-700 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-white dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600'}`}>
                                                <input
                                                    type="radio"
                                                    name="theme"
                                                    value={t.id}
                                                    checked={theme === t.id}
                                                    onChange={(e) => setTheme(e.target.value)}
                                                    className="text-blue-600 focus:ring-blue-500"
                                                />
                                                <div>
                                                    <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{t.name}</div>
                                                    <div className="text-[10px] text-slate-500">{t.desc}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Typography & Layout */}
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm">
                                        <Type size={16} /> Tipografi ve Düzen
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Yazı Tipi</label>
                                            <select
                                                value={config.fontFamily}
                                                onChange={(e) => handleConfigChange('fontFamily', e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            >
                                                <option value="Inter">Modern (Inter)</option>
                                                <option value="Roboto">Standart (Roboto)</option>
                                                <option value="Playfair Display">Klasik (Serif)</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 space-y-4">
                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Genel Yazı Boyutu</label>
                                                        <span className="text-xs text-slate-500">{config.fontSize}px</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="8"
                                                        max="20"
                                                        step="1"
                                                        value={config.fontSize}
                                                        onChange={(e) => handleConfigChange('fontSize', parseInt(e.target.value))}
                                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                                    />
                                                </div>

                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Tablo Başlık Boyutu</label>
                                                        <span className="text-xs text-slate-500">{config.tableHeaderFontSize}px</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="8"
                                                        max="30"
                                                        step="1"
                                                        value={config.tableHeaderFontSize}
                                                        onChange={(e) => handleConfigChange('tableHeaderFontSize', parseInt(e.target.value))}
                                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                                    />
                                                </div>

                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Tablo Satır Yüksekliği</label>
                                                        <span className="text-xs text-slate-500">{config.tableRowHeight}px</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="20"
                                                        max="80"
                                                        step="5"
                                                        value={config.tableRowHeight}
                                                        onChange={(e) => handleConfigChange('tableRowHeight', parseInt(e.target.value))}
                                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Kenar Boşluğu</label>
                                                <select
                                                    value={config.margins}
                                                    onChange={(e) => handleConfigChange('margins', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                >
                                                    <option value="compact">Dar</option>
                                                    <option value="normal">Normal</option>
                                                    <option value="wide">Geniş</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Logo Position */}
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm">
                                        <Layout size={16} /> Yerleşim
                                    </h4>
                                    <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                                        {[
                                            { id: 'left', icon: AlignLeft, label: 'Sol' },
                                            { id: 'center', icon: AlignCenter, label: 'Orta' },
                                            { id: 'right', icon: AlignRight, label: 'Sağ' }
                                        ].map(pos => (
                                            <button
                                                key={pos.id}
                                                onClick={() => handleConfigChange('logoPosition', pos.id)}
                                                className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${config.logoPosition === pos.id ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                                title={pos.label}
                                            >
                                                <pos.icon size={18} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Selection */}
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm">
                                        <Palette size={16} /> Renk ve Stil
                                    </h4>

                                    <div className="space-y-4">
                                        {/* Main Color */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Ana Renk</label>
                                            <div className="grid grid-cols-5 gap-2 mb-2">
                                                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#0f172a', '#64748b'].map((c) => (
                                                    <button
                                                        key={c}
                                                        className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 ${color === c ? 'border-slate-900 dark:border-white ring-2 ring-offset-1 ring-slate-200 dark:ring-slate-700' : 'border-transparent'}`}
                                                        style={{ backgroundColor: c }}
                                                        onClick={() => setColor(c)}
                                                        title={c}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={color}
                                                    onChange={(e) => setColor(e.target.value)}
                                                    className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                                />
                                                <span className="text-xs text-slate-500">Özel Renk</span>
                                            </div>
                                        </div>

                                        {/* Table Header Background */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Tablo Başlık Rengi</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={config.tableHeaderBg}
                                                    onChange={(e) => handleConfigChange('tableHeaderBg', e.target.value)}
                                                    className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                                />
                                                <span className="text-xs text-slate-500">{config.tableHeaderBg}</span>
                                            </div>
                                        </div>

                                        {/* Border Radius */}
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Köşe Yuvarlaklığı</label>
                                                <span className="text-xs text-slate-500">{config.borderRadius}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="20"
                                                step="1"
                                                value={config.borderRadius}
                                                onChange={(e) => handleConfigChange('borderRadius', parseInt(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* CONTENT TAB */}
                        {activeTab === 'content' && (
                            <>
                                {/* Content Visibility */}
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm">
                                        <Eye size={16} /> Bölüm Görünürlüğü
                                    </h4>
                                    <div className="space-y-2">
                                        {[
                                            { key: 'showLogo', label: 'Firma Logosu' },
                                            { key: 'showBankInfo', label: 'Banka Bilgileri' },
                                            { key: 'showSignatures', label: 'İmza ve Kaşe Alanı' },
                                            { key: 'showTerms', label: 'Koşullar (Teslimat/Garanti)' },
                                            { key: 'showNotes', label: 'Notlar Bölümü' },
                                            { key: 'showSummary', label: 'Fiyat Özeti' }
                                        ].map((item) => (
                                            <label key={item.key} className="flex items-center justify-between p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer text-sm">
                                                <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={config[item.key]}
                                                    onChange={(e) => handleConfigChange(item.key, e.target.checked)}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Text Customization */}
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm">
                                        <Type size={16} /> Metin Düzenleme
                                    </h4>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Belge Başlığı
                                        </label>
                                        <input
                                            type="text"
                                            value={config.title}
                                            onChange={(e) => handleConfigChange('title', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            placeholder="Örn: FİYAT TEKLİFİ"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* TABLE TAB */}
                        {activeTab === 'table' && (
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm">
                                    <Table size={16} /> Tablo Sütunları
                                </h4>
                                <div className="space-y-2">
                                    {[
                                        { key: 'showTableImages', label: 'Ürün Görselleri' },
                                        { key: 'showTableUnit', label: 'Birim Sütunu' },
                                        { key: 'showTableTax', label: 'KDV Sütunu' }
                                    ].map((item) => (
                                        <label key={item.key} className="flex items-center justify-between p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer text-sm">
                                            <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                                            <input
                                                type="checkbox"
                                                checked={config[item.key]}
                                                onChange={(e) => handleConfigChange(item.key, e.target.checked)}
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </label>
                                    ))}
                                </div>
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded border border-blue-100 dark:border-blue-800">
                                    <div className="font-semibold mb-1">İpucu</div>
                                    Görselleri açmak tablo satır yüksekliğini artırabilir. KDV sütununu gizlemek hesaplamaları etkilemez, sadece görünümü değiştirir.
                                </div>
                            </div>
                        )}

                        {/* EXTRAS TAB */}
                        {activeTab === 'extras' && (
                            <div className="space-y-4">
                                {/* ... (existing extras content) ... */}
                                {/* QR Code */}
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm">
                                        <QrCode size={16} /> QR Kod
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer text-sm">
                                            <span className="text-slate-700 dark:text-slate-300">QR Kod Göster</span>
                                            <input
                                                type="checkbox"
                                                checked={config.showQRCode}
                                                onChange={(e) => handleConfigChange('showQRCode', e.target.checked)}
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </label>
                                        {config.showQRCode && (
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    QR Kod Linki (Boşsa Web Sitesi)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={config.qrCodeUrl}
                                                    onChange={(e) => handleConfigChange('qrCodeUrl', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Watermark */}
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm">
                                        <Stamp size={16} /> Filigran (Watermark)
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer text-sm">
                                            <span className="text-slate-700 dark:text-slate-300">Filigran Ekle</span>
                                            <input
                                                type="checkbox"
                                                checked={config.showWatermark}
                                                onChange={(e) => handleConfigChange('showWatermark', e.target.checked)}
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </label>
                                        {config.showWatermark && (
                                            <div className="space-y-3 mt-3 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                                                <div>
                                                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Filigran Metni</label>
                                                    <input
                                                        type="text"
                                                        value={config.watermarkText}
                                                        onChange={(e) => handleConfigChange('watermarkText', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                        placeholder="Örn: TASLAK"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Renk</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={config.watermarkColor}
                                                            onChange={(e) => handleConfigChange('watermarkColor', e.target.value)}
                                                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={config.watermarkColor}
                                                            onChange={(e) => handleConfigChange('watermarkColor', e.target.value)}
                                                            className="flex-1 px-3 py-1 text-xs border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Şeffaflık</label>
                                                        <span className="text-xs text-slate-500">{Math.round(config.watermarkOpacity * 100)}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0.05"
                                                        max="1"
                                                        step="0.05"
                                                        value={config.watermarkOpacity}
                                                        onChange={(e) => handleConfigChange('watermarkOpacity', parseFloat(e.target.value))}
                                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                                    />
                                                </div>

                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Boyut</label>
                                                        <span className="text-xs text-slate-500">{config.watermarkFontSize}px</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="40"
                                                        max="200"
                                                        step="10"
                                                        value={config.watermarkFontSize}
                                                        onChange={(e) => handleConfigChange('watermarkFontSize', parseInt(e.target.value))}
                                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                                    />
                                                </div>

                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Açı</label>
                                                        <span className="text-xs text-slate-500">{config.watermarkRotation}°</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="-90"
                                                        max="90"
                                                        step="15"
                                                        value={config.watermarkRotation}
                                                        onChange={(e) => handleConfigChange('watermarkRotation', parseInt(e.target.value))}
                                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Custom Footer */}
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm">
                                        <Layout size={16} /> Özel Alt Bilgi
                                    </h4>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Alt Bilgi Metni
                                        </label>
                                        <input
                                            type="text"
                                            value={config.customFooter}
                                            onChange={(e) => handleConfigChange('customFooter', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            placeholder="Örn: www.firmaniz.com - Tüm hakları saklıdır."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SIGNATURE TAB */}
                        {activeTab === 'signature' && (
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm">
                                    <PenTool size={16} /> Dijital İmza
                                </h4>
                                <SignatureCanvas
                                    onSave={setSignature}
                                    onClear={() => setSignature(null)}
                                    savedSignature={signature}
                                />
                                <div className="mt-3 text-xs text-slate-500">
                                    <p>İmza, PDF'in alt kısmındaki "Yetkili İmza" alanında görünecektir.</p>
                                </div>
                            </div>
                        )}

                    </div>

                    <div className="mt-auto flex flex-col gap-2">
                        <button
                            className="btn w-full py-3 text-lg shadow-sm bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                            onClick={handleExcelExport}
                        >
                            <FileSpreadsheet size={20} /> Excel Olarak İndir
                        </button>
                        <button className="btn btn-primary w-full py-3 text-lg shadow-lg flex items-center justify-center gap-2" onClick={handleDownload}>
                            <FileDown size={20} /> PDF Olarak İndir
                        </button>
                    </div>
                </div>

                {/* ... (rest of the component) ... */}

                {/* Right: Live Preview */}
                <div className="w-full md:w-2/3 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">
                    <div className="p-2 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider pl-2">
                            Canlı Önizleme
                        </div>
                        <div className="text-xs text-slate-400 pr-2">
                            A4 Boyut
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar p-8 flex justify-center bg-slate-200/50 dark:bg-slate-900/50">
                        <div className="origin-top transform scale-[0.55] md:scale-[0.65] lg:scale-[0.85] shadow-2xl transition-all duration-300">
                            <PrintableQuote
                                theme={theme}
                                color={color}
                                quoteData={quoteData}
                                items={items}
                                customerData={customerData}
                                companyData={companyData}
                                bankData={bankData}
                                discount={discount}
                                config={config}
                                layout={pdfLayout}
                                signature={signature}
                            />
                        </div>
                    </div>
                </div>

                {/* Hidden Container for PDF Generation */}
                <div className="absolute left-[-9999px] top-[-9999px]">
                    <PrintableQuote
                        id="printable-quote-container"
                        theme={theme}
                        color={color}
                        quoteData={quoteData}
                        items={items}
                        customerData={customerData}
                        companyData={companyData}
                        bankData={bankData}
                        discount={discount}
                        config={config}
                        layout={pdfLayout}
                        signature={signature}
                    />
                </div>

            </div>
        </Modal>
    );
};

export default PdfPreviewModal;
