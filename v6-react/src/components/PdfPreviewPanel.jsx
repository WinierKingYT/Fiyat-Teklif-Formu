import React, { useState, useEffect, useCallback } from 'react';
import { FileDown, Palette, LayoutTemplate, Eye, Type, Table, Layout, QrCode, Stamp, Sparkles, Trash2, AlignLeft, AlignCenter, AlignRight, FileSpreadsheet, PenTool, Layers, Edit2 } from 'lucide-react';
import { calculateQuoteTotals } from '../utils/calculations';
import { generatePDF } from '../utils/pdfGenerator';
import { exportQuoteToExcel } from '../utils/excelExporter';
import PrintableQuote from './PrintableQuoteV2';
import PopupEditor from './PopupEditor';
import { useQuote } from '../context/QuoteContext';
import toast from 'react-hot-toast';

const PdfPreviewPanel = () => {
    const {
        quoteData,
        items,
        customerData,
        companyData,
        bankData,
        discount,
        pdfLayout,
        pdfConfig,
        setPdfConfig,
        updateQuoteData,
        updateCustomerData,
        updateCompanyData
    } = useQuote();

    const [activeTab, setActiveTab] = useState('sections');
    const [savedTemplates, setSavedTemplates] = useState([]);
    const [templateName, setTemplateName] = useState('');
    const [signature, setSignature] = useState(null);

    // Popup Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editConfig, setEditConfig] = useState({
        title: '',
        initialValue: '',
        onSave: () => { },
        type: 'text',
        options: []
    });

    const openEditor = (title, initialValue, onSave, type = 'text', options = []) => {
        setEditConfig({
            title,
            initialValue,
            onSave,
            type,
            options
        });
        setIsEditorOpen(true);
    };

    // Load templates from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('pdfTemplates');
        if (saved) {
            try {
                setSavedTemplates(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse templates', e);
            }
        }
    }, []);

    const saveTemplate = useCallback(() => {
        if (!templateName.trim()) return;
        const newTemplate = {
            id: Date.now(),
            name: templateName,
            config: pdfConfig
        };
        const updatedTemplates = [...savedTemplates, newTemplate];
        setSavedTemplates(updatedTemplates);
        localStorage.setItem('pdfTemplates', JSON.stringify(updatedTemplates));
        setTemplateName('');
        toast.success('Şablon kaydedildi');
    }, [templateName, pdfConfig, savedTemplates]);

    const loadTemplate = useCallback((template) => {
        setPdfConfig(template.config);
        toast.success('Şablon yüklendi');
    }, [setPdfConfig]);

    const deleteTemplate = useCallback((id) => {
        const updatedTemplates = savedTemplates.filter(t => t.id !== id);
        setSavedTemplates(updatedTemplates);
        localStorage.setItem('pdfTemplates', JSON.stringify(updatedTemplates));
        toast.success('Şablon silindi');
    }, [savedTemplates]);

    const handleConfigChange = useCallback((key, value) => {
        setPdfConfig(prev => ({ ...prev, [key]: value }));
    }, [setPdfConfig]);

    const handleDownload = () => {
        const filename = `Teklif_${quoteData.number || 'Taslak'}.pdf`;
        generatePDF('printable-quote-container-panel', filename, { theme: pdfConfig.theme, color: pdfConfig.color });
    };

    const handleExcelExport = () => {
        try {
            const { subtotal, totalTax, total } = calculateQuoteTotals(items, discount);

            const fullQuoteData = {
                ...quoteData,
                customer: customerData,
                company: companyData,
                items: items,
                subTotal: subtotal,
                taxAmount: totalTax,
                grandTotal: total,
                discount: discount
            };

            exportQuoteToExcel(fullQuoteData, items);
            toast.success('Excel dosyası indirildi');
        } catch (error) {
            toast.error('Excel oluşturulurken hata oluştu');
        }
    };

    const tabs = [
        { id: 'appearance', label: 'Tema', icon: Palette },
        { id: 'sections', label: 'Bölümler', icon: Layout },
        { id: 'typography', label: 'Tipografi', icon: Type },
        { id: 'layout', label: 'Düzen', icon: Layout },
        { id: 'table', label: 'Tablo', icon: Table },
        { id: 'texts', label: 'Metinler', icon: AlignLeft },
        { id: 'content', label: 'İçerik', icon: Eye },
        { id: 'extras', label: 'Ekstra', icon: Sparkles },
        { id: 'signature', label: 'İmza', icon: PenTool }
    ];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileDown size={20} className="text-blue-600 dark:text-blue-400" />
                    Canlı Önizleme
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleExcelExport}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Excel İndir"
                    >
                        <FileSpreadsheet size={20} />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-semibold"
                        title="PDF İndir"
                    >
                        <FileDown size={20} />
                        <span>PDF İNDİR</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Controls (Scrollable) */}
                <div className="w-80 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-900">
                    {/* Tabs */}
                    <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 min-w-[60px] flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {/* APPEARANCE (THEME) TAB */}
                        {activeTab === 'appearance' && (
                            <>
                                {/* Template Management */}
                                <div className="space-y-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <Layout size={14} /> Şablonlar
                                    </h4>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={templateName}
                                            onChange={(e) => setTemplateName(e.target.value)}
                                            placeholder="Şablon ismi..."
                                            className="flex-1 px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                        />
                                        <button
                                            onClick={saveTemplate}
                                            disabled={!templateName.trim()}
                                            className="px-2 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            Kaydet
                                        </button>
                                    </div>
                                    {savedTemplates.length > 0 && (
                                        <div className="space-y-1">
                                            {savedTemplates.map(t => (
                                                <div key={t.id} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 p-1.5 rounded">
                                                    <span className="truncate flex-1">{t.name}</span>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => loadTemplate(t)} className="text-blue-600 hover:text-blue-800"><LayoutTemplate size={12} /></button>
                                                        <button onClick={() => deleteTemplate(t.id)} className="text-red-600 hover:text-red-800"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Theme Selection */}
                                <div className="space-y-2 mb-4">
                                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Tasarım</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'modern', name: 'Modern' },
                                            { id: 'classic', name: 'Klasik' },
                                            { id: 'minimal', name: 'Minimal' },
                                            { id: 'corporate', name: 'Kurumsal' },
                                            { id: 'pro', name: 'Premium (Pro)' }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => handleConfigChange('theme', t.id)}
                                                className={`px-2 py-1.5 text-xs rounded border transition-all ${pdfConfig.theme === t.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Main Color */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Ana Renk</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={pdfConfig.color}
                                            onChange={(e) => handleConfigChange('color', e.target.value)}
                                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                        />
                                        <span className="text-xs text-slate-500 uppercase">{pdfConfig.color}</span>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* TYPOGRAPHY TAB */}
                        {activeTab === 'typography' && (
                            <div className="space-y-4">
                                {/* Font Families */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 border-b pb-1 dark:border-slate-800">Yazı Tipleri</h4>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Genel Yazı Tipi</label>
                                        <select
                                            value={pdfConfig.globalFontFamily || 'Inter'}
                                            onChange={(e) => handleConfigChange('globalFontFamily', e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                        >
                                            <option value="'Inter', sans-serif">Modern (Inter)</option>
                                            <option value="'Roboto', sans-serif">Standart (Roboto)</option>
                                            <option value="'Open Sans', sans-serif">Okunaklı (Open Sans)</option>
                                            <option value="'Lato', sans-serif">Dengeli (Lato)</option>
                                            <option value="'Montserrat', sans-serif">Geometrik (Montserrat)</option>
                                            <option value="'Playfair Display', serif">Zarif (Playfair)</option>
                                            <option value="'Merriweather', serif">Klasik (Merriweather)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Başlık Yazı Tipi</label>
                                        <select
                                            value={pdfConfig.titleFontFamily || ''}
                                            onChange={(e) => handleConfigChange('titleFontFamily', e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                        >
                                            <option value="">Genel ile Aynı</option>
                                            <option value="'Inter', sans-serif">Modern (Inter)</option>
                                            <option value="'Montserrat', sans-serif">Geometrik (Montserrat)</option>
                                            <option value="'Playfair Display', serif">Zarif (Playfair)</option>
                                            <option value="'Oswald', sans-serif">Güçlü (Oswald)</option>
                                            <option value="'Roboto Slab', serif">Robotik (Roboto Slab)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Etiket Yazı Tipi (Temel)</label>
                                        <select
                                            value={pdfConfig.labelFontFamily || ''}
                                            onChange={(e) => handleConfigChange('labelFontFamily', e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                        >
                                            <option value="">Genel ile Aynı</option>
                                            <option value="'Inter', sans-serif">Modern (Inter)</option>
                                            <option value="'Roboto', sans-serif">Standart (Roboto)</option>
                                            <option value="'Open Sans', sans-serif">Okunaklı (Open Sans)</option>
                                            <option value="'Lato', sans-serif">Dengeli (Lato)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">İçerik Yazı Tipi (Girdiğiniz)</label>
                                        <select
                                            value={pdfConfig.bodyFontFamily || ''}
                                            onChange={(e) => handleConfigChange('bodyFontFamily', e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                        >
                                            <option value="">Genel ile Aynı</option>
                                            <option value="'Inter', sans-serif">Modern (Inter)</option>
                                            <option value="'Roboto', sans-serif">Standart (Roboto)</option>
                                            <option value="'Open Sans', sans-serif">Okunaklı (Open Sans)</option>
                                            <option value="'Merriweather', serif">Klasik (Merriweather)</option>
                                            <option value="'Courier New', monospace">Daktilo (Courier)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECTIONS TAB (Granular Typography) */}
                        {activeTab === 'sections' && (
                            <div className="space-y-6">
                                {/* Header Section */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 border-b pb-1 dark:border-slate-800">Üst Bilgi (Header)</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Başlık Boyutu</label>
                                            <select
                                                value={pdfConfig.headerTitleFontSize || '1rem'}
                                                onChange={(e) => handleConfigChange('headerTitleFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="0.8rem">Küçük</option>
                                                <option value="1rem">Normal</option>
                                                <option value="1.2rem">Büyük</option>
                                                <option value="1.5rem">Çok Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Başlık Kalınlığı</label>
                                            <select
                                                value={pdfConfig.headerTitleFontWeight || '700'}
                                                onChange={(e) => handleConfigChange('headerTitleFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="400">Normal</option>
                                                <option value="600">Orta</option>
                                                <option value="700">Kalın</option>
                                                <option value="800">Çok Kalın</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Bilgi Yazı Boyutu</label>
                                            <select
                                                value={pdfConfig.headerInfoFontSize || '0.7rem'}
                                                onChange={(e) => handleConfigChange('headerInfoFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="0.6rem">Küçük</option>
                                                <option value="0.7rem">Normal</option>
                                                <option value="0.8rem">Büyük</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer/Seller Section */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 border-b pb-1 dark:border-slate-800">Müşteri & Satıcı</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Başlık Boyutu</label>
                                            <select
                                                value={pdfConfig.customerTitleFontSize || '0.8rem'}
                                                onChange={(e) => handleConfigChange('customerTitleFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="0.7rem">Küçük</option>
                                                <option value="0.8rem">Normal</option>
                                                <option value="0.9rem">Büyük</option>
                                                <option value="1rem">Çok Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Başlık Kalınlığı</label>
                                            <select
                                                value={pdfConfig.customerTitleFontWeight || '600'}
                                                onChange={(e) => handleConfigChange('customerTitleFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="400">Normal</option>
                                                <option value="600">Orta</option>
                                                <option value="700">Kalın</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Etiket Boyutu (Örn: Firma:)</label>
                                            <select
                                                value={pdfConfig.customerLabelFontSize || 'inherit'}
                                                onChange={(e) => handleConfigChange('customerLabelFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="inherit">Otomatik</option>
                                                <option value="0.6rem">Küçük</option>
                                                <option value="0.7rem">Normal</option>
                                                <option value="0.8rem">Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Etiket Kalınlığı</label>
                                            <select
                                                value={pdfConfig.customerLabelFontWeight || '500'}
                                                onChange={(e) => handleConfigChange('customerLabelFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="400">Normal</option>
                                                <option value="500">Orta</option>
                                                <option value="600">Kalın</option>
                                                <option value="700">Çok Kalın</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Değer Boyutu</label>
                                            <select
                                                value={pdfConfig.customerValueFontSize || 'inherit'}
                                                onChange={(e) => handleConfigChange('customerValueFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="inherit">Otomatik</option>
                                                <option value="0.6rem">Küçük</option>
                                                <option value="0.7rem">Normal</option>
                                                <option value="0.8rem">Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Değer Kalınlığı</label>
                                            <select
                                                value={pdfConfig.customerValueFontWeight || 'normal'}
                                                onChange={(e) => handleConfigChange('customerValueFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="500">Orta</option>
                                                <option value="600">Kalın</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Quote Meta Section */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 border-b pb-1 dark:border-slate-800">Teklif Bilgileri (Sağ Üst)</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Etiket Boyutu</label>
                                            <select
                                                value={pdfConfig.quoteMetaLabelFontSize || '0.7rem'}
                                                onChange={(e) => handleConfigChange('quoteMetaLabelFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="0.6rem">Küçük</option>
                                                <option value="0.7rem">Normal</option>
                                                <option value="0.8rem">Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Etiket Kalınlığı</label>
                                            <select
                                                value={pdfConfig.quoteMetaLabelFontWeight || 'normal'}
                                                onChange={(e) => handleConfigChange('quoteMetaLabelFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="500">Orta</option>
                                                <option value="600">Kalın</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Değer Boyutu</label>
                                            <select
                                                value={pdfConfig.quoteMetaValueFontSize || 'inherit'}
                                                onChange={(e) => handleConfigChange('quoteMetaValueFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="inherit">Otomatik</option>
                                                <option value="0.7rem">Normal</option>
                                                <option value="0.8rem">Büyük</option>
                                                <option value="0.9rem">Çok Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Değer Kalınlığı</label>
                                            <select
                                                value={pdfConfig.quoteMetaValueFontWeight || '600'}
                                                onChange={(e) => handleConfigChange('quoteMetaValueFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="400">Normal</option>
                                                <option value="600">Orta</option>
                                                <option value="700">Kalın</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Products Table */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 border-b pb-1 dark:border-slate-800">Ürünler Tablosu</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Başlık Boyutu</label>
                                            <input
                                                type="range"
                                                min="10"
                                                max="30"
                                                step="1"
                                                value={parseInt(pdfConfig.tableHeaderFontSize) || 14}
                                                onChange={(e) => handleConfigChange('tableHeaderFontSize', parseInt(e.target.value))}
                                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                            />
                                            <div className="text-[10px] text-right text-slate-400">{parseInt(pdfConfig.tableHeaderFontSize) || 14}px</div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Başlık Kalınlığı</label>
                                            <select
                                                value={pdfConfig.tableHeaderFontWeight || '600'}
                                                onChange={(e) => handleConfigChange('tableHeaderFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="600">Kalın</option>
                                                <option value="700">Çok Kalın</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">İçerik Boyutu</label>
                                            <select
                                                value={pdfConfig.tableBodyFontSize || '0.7rem'}
                                                onChange={(e) => handleConfigChange('tableBodyFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="0.6rem">Küçük</option>
                                                <option value="0.7rem">Normal</option>
                                                <option value="0.8rem">Büyük</option>
                                                <option value="0.9rem">Çok Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">İçerik Kalınlığı</label>
                                            <select
                                                value={pdfConfig.tableBodyFontWeight || 'normal'}
                                                onChange={(e) => handleConfigChange('tableBodyFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="500">Orta</option>
                                                <option value="600">Kalın</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary Section */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 border-b pb-1 dark:border-slate-800">Özet Alanı</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Etiket Boyutu</label>
                                            <select
                                                value={pdfConfig.summaryLabelFontSize || '0.75rem'}
                                                onChange={(e) => handleConfigChange('summaryLabelFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="0.65rem">Küçük</option>
                                                <option value="0.75rem">Normal</option>
                                                <option value="0.85rem">Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Etiket Kalınlığı</label>
                                            <select
                                                value={pdfConfig.summaryLabelFontWeight || 'normal'}
                                                onChange={(e) => handleConfigChange('summaryLabelFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="500">Orta</option>
                                                <option value="600">Kalın</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Değer Boyutu</label>
                                            <select
                                                value={pdfConfig.summaryValueFontSize || 'inherit'}
                                                onChange={(e) => handleConfigChange('summaryValueFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="inherit">Otomatik</option>
                                                <option value="0.75rem">Normal</option>
                                                <option value="0.85rem">Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Değer Kalınlığı</label>
                                            <select
                                                value={pdfConfig.summaryValueFontWeight || '500'}
                                                onChange={(e) => handleConfigChange('summaryValueFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="400">Normal</option>
                                                <option value="500">Orta</option>
                                                <option value="600">Kalın</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Genel Toplam Boyutu</label>
                                            <select
                                                value={pdfConfig.summaryTotalFontSize || '0.9rem'}
                                                onChange={(e) => handleConfigChange('summaryTotalFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="0.8rem">Küçük</option>
                                                <option value="0.9rem">Normal</option>
                                                <option value="1rem">Büyük</option>
                                                <option value="1.2rem">Çok Büyük</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 border-b pb-1 dark:border-slate-800">Alt Bilgi (Footer)</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Yazı Boyutu</label>
                                            <select
                                                value={pdfConfig.footerFontSize || '0.7rem'}
                                                onChange={(e) => handleConfigChange('footerFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="0.6rem">Küçük</option>
                                                <option value="0.7rem">Normal</option>
                                                <option value="0.8rem">Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 mb-1">Yazı Kalınlığı</label>
                                            <select
                                                value={pdfConfig.footerFontWeight || 'normal'}
                                                onChange={(e) => handleConfigChange('footerFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="500">Orta</option>
                                                <option value="600">Kalın</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* LAYOUT TAB */}
                        {activeTab === 'layout' && (
                            <div className="space-y-4">
                                {/* Spacing */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 border-b pb-1 dark:border-slate-800">Boşluklar</h4>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Sayfa Kenar Boşluğu</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { val: 'compact', label: 'Dar' },
                                                { val: 'normal', label: 'Normal' },
                                                { val: 'wide', label: 'Geniş' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.val}
                                                    onClick={() => handleConfigChange('margins', opt.val)}
                                                    className={`py-1.5 text-[10px] border rounded transition-colors ${pdfConfig.margins === opt.val ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            <span>Bölüm Aralığı</span>
                                            <span className="text-slate-500">{pdfConfig.sectionSpacing || '1rem'}</span>
                                        </label>
                                        <select
                                            value={pdfConfig.sectionSpacing || '1rem'}
                                            onChange={(e) => handleConfigChange('sectionSpacing', e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                        >
                                            <option value="0.5rem">Sıkışık (0.5rem)</option>
                                            <option value="1rem">Normal (1rem)</option>
                                            <option value="1.5rem">Geniş (1.5rem)</option>
                                            <option value="2rem">Çok Geniş (2rem)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Shapes */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 border-b pb-1 dark:border-slate-800">Şekiller</h4>
                                    <div>
                                        <label className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            <span>Köşe Yuvarlaklığı</span>
                                            <span className="text-slate-500">{pdfConfig.borderRadius || 6}px</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="20"
                                            step="2"
                                            value={pdfConfig.borderRadius !== undefined ? pdfConfig.borderRadius : 6}
                                            onChange={(e) => handleConfigChange('borderRadius', parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Logo Pozisyonu</label>
                                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded p-1">
                                            {[
                                                { val: 'left', icon: AlignLeft },
                                                { val: 'center', icon: AlignCenter },
                                                { val: 'right', icon: AlignRight }
                                            ].map(opt => (
                                                <button
                                                    key={opt.val}
                                                    onClick={() => handleConfigChange('logoPosition', opt.val)}
                                                    className={`flex-1 py-1 flex justify-center rounded transition-colors ${pdfConfig.logoPosition === opt.val ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                                                >
                                                    <opt.icon size={14} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Kenarlık Stili</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { val: 'solid', label: 'Düz' },
                                                { val: 'dashed', label: 'Kesik' },
                                                { val: 'dotted', label: 'Noktalı' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.val}
                                                    onClick={() => handleConfigChange('boxBorderStyle', opt.val)}
                                                    className={`py-1.5 text-[10px] border rounded transition-colors ${pdfConfig.boxBorderStyle === opt.val ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Density */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 border-b pb-1 dark:border-slate-800">Yoğunluk</h4>
                                        <label className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs">
                                            <span className="text-slate-700 dark:text-slate-300">Kompakt Mod (Sıkışık)</span>
                                            <input
                                                type="checkbox"
                                                checked={pdfConfig.tableDensity === 'compact'}
                                                onChange={(e) => handleConfigChange('tableDensity', e.target.checked ? 'compact' : 'normal')}
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CONTENT TAB */}
                        {activeTab === 'content' && (
                            <div className="space-y-2">
                                {[
                                    { key: 'showLogo', label: 'Firma Logosu' },
                                    { key: 'showBankInfo', label: 'Banka Bilgileri' },
                                    { key: 'showSignatures', label: 'İmza ve Kaşe Alanı' },
                                    { key: 'showTerms', label: 'Koşullar' },
                                    { key: 'showNotes', label: 'Notlar' },
                                    { key: 'showSummary', label: 'Fiyat Özeti' }
                                ].map((item) => (
                                    <label key={item.key} className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs">
                                        <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                                        <input
                                            type="checkbox"
                                            checked={pdfConfig[item.key]}
                                            onChange={(e) => handleConfigChange(item.key, e.target.checked)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                        />
                                    </label>
                                ))}

                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Belge Başlığı
                                    </label>
                                    <input
                                        type="text"
                                        value={pdfConfig.title}
                                        onChange={(e) => handleConfigChange('title', e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                        placeholder="Örn: FİYAT TEKLİFİ"
                                    />
                                </div>
                            </div>
                        )}

                        {/* TABLE TAB */}
                        {activeTab === 'table' && (
                            <div className="space-y-4">
                                {/* Table Style Options */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 border-b pb-1 dark:border-slate-800">Tablo Stili</h4>

                                    {/* Header Colors */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Başlık Arkaplanı</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="color"
                                                    value={pdfConfig.tableHeaderBg || '#f1f5f9'}
                                                    onChange={(e) => handleConfigChange('tableHeaderBg', e.target.value)}
                                                    className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Başlık Yazısı</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="color"
                                                    value={pdfConfig.tableHeaderColor || '#475569'}
                                                    onChange={(e) => handleConfigChange('tableHeaderColor', e.target.value)}
                                                    className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Border Color */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Kenarlık Rengi</label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="color"
                                                value={pdfConfig.tableBorderColor || '#e2e8f0'}
                                                onChange={(e) => handleConfigChange('tableBorderColor', e.target.value)}
                                                className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Toggles */}
                                    <div className="space-y-2 pt-2">
                                        <label className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs">
                                            <span className="text-slate-700 dark:text-slate-300">Şeritli Satırlar</span>
                                            <input
                                                type="checkbox"
                                                checked={pdfConfig.tableStriped}
                                                onChange={(e) => handleConfigChange('tableStriped', e.target.checked)}
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs">
                                            <span className="text-slate-700 dark:text-slate-300">Dikey Çizgiler</span>
                                            <input
                                                type="checkbox"
                                                checked={pdfConfig.tableShowVerticalLines}
                                                onChange={(e) => handleConfigChange('tableShowVerticalLines', e.target.checked)}
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Column Visibility */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 border-b pb-1 dark:border-slate-800">Sütunlar</h4>
                                    <div className="space-y-1">
                                        {[
                                            { key: 'showTableImages', label: 'Ürün Görselleri' },
                                            { key: 'showTableUnit', label: 'Birim Sütunu' },
                                            { key: 'showTableTax', label: 'KDV Sütunu' }
                                        ].map((item) => (
                                            <label key={item.key} className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs">
                                                <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={pdfConfig[item.key]}
                                                    onChange={(e) => handleConfigChange(item.key, e.target.checked)}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Row Height */}
                                <div>
                                    <label className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        <span>Satır Yüksekliği</span>
                                        <span className="text-slate-500">{pdfConfig.tableRowHeight}px</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="20"
                                        max="80"
                                        step="5"
                                        value={pdfConfig.tableRowHeight}
                                        onChange={(e) => handleConfigChange('tableRowHeight', parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                    />
                                </div>
                            </div>
                        )}

                        {/* EXTRAS TAB */}
                        {/* TEXTS TAB */}
                        {activeTab === 'texts' && (
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 border-b pb-1 dark:border-slate-800">Tablo Başlıkları</h4>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Ürün Başlığı</label>
                                            <input
                                                type="text"
                                                value={pdfConfig.textItem || ''}
                                                onChange={(e) => handleConfigChange('textItem', e.target.value)}
                                                placeholder="Varsayılan: Ürün/Hizmet"
                                                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Açıklama Başlığı</label>
                                            <input
                                                type="text"
                                                value={pdfConfig.textDescription || ''}
                                                onChange={(e) => handleConfigChange('textDescription', e.target.value)}
                                                placeholder="Varsayılan: Açıklama"
                                                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Birim Başlığı</label>
                                                <input
                                                    type="text"
                                                    value={pdfConfig.textUnit || ''}
                                                    onChange={(e) => handleConfigChange('textUnit', e.target.value)}
                                                    placeholder="Varsayılan: Birim"
                                                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Miktar Başlığı</label>
                                                <input
                                                    type="text"
                                                    value={pdfConfig.textQuantity || ''}
                                                    onChange={(e) => handleConfigChange('textQuantity', e.target.value)}
                                                    placeholder="Varsayılan: Miktar"
                                                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Fiyat Başlığı</label>
                                                <input
                                                    type="text"
                                                    value={pdfConfig.textUnitPrice || ''}
                                                    onChange={(e) => handleConfigChange('textUnitPrice', e.target.value)}
                                                    placeholder="Varsayılan: Birim Fiyat"
                                                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">KDV Başlığı</label>
                                                <input
                                                    type="text"
                                                    value={pdfConfig.textVat || ''}
                                                    onChange={(e) => handleConfigChange('textVat', e.target.value)}
                                                    placeholder="Varsayılan: KDV"
                                                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Toplam Başlığı</label>
                                            <input
                                                type="text"
                                                value={pdfConfig.textTotal || ''}
                                                onChange={(e) => handleConfigChange('textTotal', e.target.value)}
                                                placeholder="Varsayılan: Toplam"
                                                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* EXTRAS TAB */}
                        {activeTab === 'extras' && (
                            <div className="space-y-4">
                                {/* Visual Effects */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 border-b pb-1 dark:border-slate-800">Görsel Efektler</h4>
                                    <label className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs">
                                        <span className="text-slate-700 dark:text-slate-300">Gölgelendirme</span>
                                        <input
                                            type="checkbox"
                                            checked={pdfConfig.enableShadows}
                                            onChange={(e) => handleConfigChange('enableShadows', e.target.checked)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                        />
                                    </label>
                                </div>

                                {/* QR Code */}
                                <div>
                                    <label className="flex items-center justify-between mb-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                                        <span>QR Kod</span>
                                        <input
                                            type="checkbox"
                                            checked={pdfConfig.showQRCode}
                                            onChange={(e) => handleConfigChange('showQRCode', e.target.checked)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                        />
                                    </label>
                                    {pdfConfig.showQRCode && (
                                        <input
                                            type="text"
                                            value={pdfConfig.qrCodeUrl}
                                            onChange={(e) => handleConfigChange('qrCodeUrl', e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                            placeholder="URL (Boşsa site adresi)"
                                        />
                                    )}
                                </div>

                                {/* Watermark */}
                                <div>
                                    <label className="flex items-center justify-between mb-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                                        <span>Filigran</span>
                                        <input
                                            type="checkbox"
                                            checked={pdfConfig.showWatermark}
                                            onChange={(e) => handleConfigChange('showWatermark', e.target.checked)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                        />
                                    </label>
                                    {pdfConfig.showWatermark && (
                                        <div className="space-y-3 pl-2 border-l-2 border-slate-100 dark:border-slate-800 mt-2">
                                            <div>
                                                <label className="block text-[10px] text-slate-500 mb-1">Metin</label>
                                                <input
                                                    type="text"
                                                    value={pdfConfig.watermarkText}
                                                    onChange={(e) => handleConfigChange('watermarkText', e.target.value)}
                                                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                                    placeholder="Metin"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1">Renk</label>
                                                    <div className="flex gap-2 items-center">
                                                        <input
                                                            type="color"
                                                            value={pdfConfig.watermarkColor || '#000000'}
                                                            onChange={(e) => handleConfigChange('watermarkColor', e.target.value)}
                                                            className="w-full h-6 p-0 border-0 rounded cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1">Boyut ({pdfConfig.watermarkFontSize || 120}px)</label>
                                                    <input
                                                        type="range"
                                                        min="40"
                                                        max="200"
                                                        step="10"
                                                        value={pdfConfig.watermarkFontSize || 120}
                                                        onChange={(e) => handleConfigChange('watermarkFontSize', parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1">Opaklık ({pdfConfig.watermarkOpacity || 0.1})</label>
                                                    <input
                                                        type="range"
                                                        min="0.05"
                                                        max="0.5"
                                                        step="0.05"
                                                        value={pdfConfig.watermarkOpacity || 0.1}
                                                        onChange={(e) => handleConfigChange('watermarkOpacity', parseFloat(e.target.value))}
                                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1">Döndürme ({pdfConfig.watermarkRotation || -45}°)</label>
                                                    <input
                                                        type="range"
                                                        min="-90"
                                                        max="90"
                                                        step="15"
                                                        value={pdfConfig.watermarkRotation || -45}
                                                        onChange={(e) => handleConfigChange('watermarkRotation', parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Alt Bilgi
                                    </label>
                                    <input
                                        type="text"
                                        value={pdfConfig.customFooter}
                                        onChange={(e) => handleConfigChange('customFooter', e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                        placeholder="Özel alt bilgi metni"
                                    />
                                </div>
                            </div>
                        )}

                        {/* SIGNATURE TAB */}
                        {activeTab === 'signature' && (
                            <div className="space-y-4">
                                <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100">Dijital İmza</h4>

                                {signature ? (
                                    <div className="space-y-2">
                                        <div className="border border-slate-200 dark:border-slate-700 rounded p-4 bg-white flex justify-center items-center h-32">
                                            <img src={signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                                        </div>
                                        <button
                                            onClick={() => setSignature(null)}
                                            className="w-full py-2 text-xs text-red-600 hover:text-red-700 font-medium border border-red-200 hover:border-red-300 rounded bg-red-50 hover:bg-red-100 transition-colors"
                                        >
                                            İmzayı Kaldır
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-slate-50 dark:bg-slate-800/50">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setSignature(reader.result);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="hidden"
                                                id="signature-upload"
                                            />
                                            <label
                                                htmlFor="signature-upload"
                                                className="cursor-pointer flex flex-col items-center gap-2"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="17 8 12 3 7 8" />
                                                        <line x1="12" y1="3" x2="12" y2="15" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                    İmza Yükle
                                                </span>
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                    PNG veya JPG (Max 2MB)
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                                <p className="text-[10px] text-slate-500">
                                    Yüklenen imza PDF'e eklenecektir. Arkaplanı şeffaf PNG önerilir.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Preview (Zoomable) */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-hidden flex flex-col relative">
                    <div className="absolute top-4 right-4 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur p-1 rounded-lg shadow border border-slate-200 dark:border-slate-700 text-xs text-slate-500 font-medium">
                        A4 Önizleme
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar p-8 flex justify-center items-start">
                        <div className="origin-top transform scale-[0.6] lg:scale-[0.7] xl:scale-[0.8] shadow-2xl transition-all duration-300 bg-white">
                            <PrintableQuote
                                theme={pdfConfig.theme}
                                color={pdfConfig.color}
                                quoteData={quoteData}
                                items={items}
                                customerData={customerData}
                                companyData={companyData}
                                bankData={bankData}
                                discount={discount}
                                config={pdfConfig}
                                layout={pdfLayout}
                                signature={signature}
                                onEdit={openEditor} // Pass the edit handler
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Container for PDF Generation */}
            <div className="absolute left-[-9999px] top-[-9999px]">
                <PrintableQuote
                    id="printable-quote-container-panel"
                    theme={pdfConfig.theme}
                    color={pdfConfig.color}
                    quoteData={quoteData}
                    items={items}
                    customerData={customerData}
                    companyData={companyData}
                    bankData={bankData}
                    discount={discount}
                    config={pdfConfig}
                    layout={pdfLayout}
                    signature={signature}
                />
            </div>
            {/* Popup Editor (Global) */}
            <PopupEditor
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                title={editConfig.title}
                initialValue={editConfig.initialValue}
                onSave={editConfig.onSave}
                type={editConfig.type}
                options={editConfig.options}
            />
        </div>
    );
};

export default PdfPreviewPanel;
