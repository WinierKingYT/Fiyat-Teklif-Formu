import React, { useState, useEffect } from 'react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { useQuote } from '../context/QuoteContext';
import { useUI } from '../context/UIContext';
import { useTranslation } from '../hooks/useTranslation';
import { Save, RefreshCw, GripVertical, Building, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import CompanyInfoForm from './CompanyInfoForm';
import PerformanceMaintenanceTab from './PerformanceMaintenanceTab';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({ id, label, enabled, onToggle }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] mb-2">
            <div className="flex items-center gap-3">
                <div {...attributes} {...listeners} className="cursor-grab text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
                    <GripVertical size={20} />
                </div>
                <span className="font-medium text-[var(--color-text)]">{label}</span>
            </div>
            <div className="form-check form-switch">
                <input
                    className="form-check-input"
                    type="checkbox"
                    checked={enabled}
                    onChange={() => onToggle(id)}
                />
            </div>
        </div>
    );
};

const Settings = () => {
    const { db } = useIndexedDB();
    const { pdfLayout, setPdfLayout,
        pdfConfig, setPdfConfig,
        quoteData } = useQuote();
    const { t } = useTranslation(quoteData?.language);

    const {
        viewMode, setViewMode,
        performanceMode, setPerformanceMode,
        compactMode, setCompactMode,
        appFontSize, setAppFontSize,
        appLayout, setAppLayout,
        appTheme, setAppTheme,
        appColor, setAppColor
    } = useUI();
    const [activeTab, setActiveTab] = useState('general');

    const [settings, setSettings] = useState({
        defaultTitle: '',
        defaultDescription: '',
        defaultValidity: 7,
        defaultDeliveryTerms: '',
        defaultWarrantyTerms: '',
        defaultTaxRate: 20,
        currency: 'TRY',
        defaultNote: '',
    });

    const appColors = [
        { id: 'blue', name: 'Okyanus Mavisi', color: '#2563eb' },
        { id: 'emerald', name: 'Zümrüt Yeşili', color: '#10b981' },
        { id: 'violet', name: 'Asil Mor', color: '#8b5cf6' },
        { id: 'amber', name: 'Gün Batımı', color: '#f59e0b' },
        { id: 'rose', name: 'Gül Kurusu', color: '#f43f5e' },
        { id: 'slate', name: 'Kurumsal Gri', color: '#475569' },
    ];

    const [companySettings, setCompanySettings] = useState({
        name: '',
        authorized: '',
        phone: '',
        email: '',
        website: '',
        address: '',
        logo: null,
        signature: null,
        stamp: null
    });

    const [loading, setLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const loadSettings = async () => {
            if (!db) return;
            try {
                const savedSettings = await db.get('settings', 'global');
                if (savedSettings) {
                    setSettings(prev => ({ ...prev, ...savedSettings }));
                }

                const savedCompanyDefaults = await db.get('company_defaults', 'default');
                if (savedCompanyDefaults) {
                    setCompanySettings(savedCompanyDefaults);
                }

                setLoading(false);
            } catch (error) {
                console.error("Error loading settings:", error);
                setLoading(false);
            }
        };
        loadSettings();
    }, [db]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleCompanyChange = (name, value) => {
        setCompanySettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!db) return;
        try {
            await db.put('settings', { id: 'global', ...settings });
            await db.put('company_defaults', { id: 'default', ...companySettings });
            toast.success('Ayarlar başarıyla kaydedildi!');
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error('Ayarlar kaydedilirken bir hata oluştu.');
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;
        if (active.id !== over.id) {
            setPdfLayout((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleToggleSection = (id) => {
        setPdfLayout(prev => prev.map(item =>
            item.id === id ? { ...item, enabled: !item.enabled } : item
        ));
    };

    useEffect(() => {
        localStorage.setItem('pdfLayout', JSON.stringify(pdfLayout));
    }, [pdfLayout]);

    if (loading) return <div className="p-8">Yükleniyor...</div>;

    return (
        <div className="settings-container p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 dark:text-white">Uygulama Ayarları</h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-slate-700 mb-6 overflow-x-auto">
                <button
                    className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'general' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                    onClick={() => setActiveTab('general')}
                >
                    Genel Ayarlar
                </button>
                <button
                    className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'company' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                    onClick={() => setActiveTab('company')}
                >
                    Varsayılan Bilgiler
                </button>
                <button
                    className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'performance' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                    onClick={() => setActiveTab('performance')}
                >
                    Performans & Bakım
                </button>
                <button
                    className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'pdf' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                    onClick={() => setActiveTab('pdf')}
                >
                    PDF Düzeni
                </button>
                <button
                    className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'watermark' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                    onClick={() => setActiveTab('watermark')}
                >
                    Filigran
                </button>
            </div>

            <div className="glass-panel p-6 rounded-xl shadow-sm space-y-6">

                {activeTab === 'general' && (
                    <>
                        {/* General Settings */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 border-b dark:border-slate-700 pb-2 dark:text-white">Görünüm Ayarları</h3>

                            <div className="form-group mb-6">
                                <label className="form-label mb-2 dark:text-gray-300">Tema Modu</label>
                                <div className="flex gap-4">
                                    <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-[var(--radius)] transition-colors flex-1 ${appTheme === 'light' ? 'bg-[var(--color-primary-muted)] border-[var(--color-border)]' : 'hover:bg-[var(--color-bg-hover)] border-[var(--color-border)]'}`}>
                                        <input
                                            type="radio"
                                            name="appTheme"
                                            value="light"
                                            checked={appTheme === 'light'}
                                            onChange={(e) => setAppTheme(e.target.value)}
                                            className="form-radio text-blue-600"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium dark:text-gray-200">Aydınlık Mod</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Standart beyaz görünüm</span>
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-[var(--radius)] transition-colors flex-1 ${appTheme === 'dark' ? 'bg-[var(--color-primary-muted)] border-[var(--color-border)]' : 'hover:bg-[var(--color-bg-hover)] border-[var(--color-border)]'}`}>
                                        <input
                                            type="radio"
                                            name="appTheme"
                                            value="dark"
                                            checked={appTheme === 'dark'}
                                            onChange={(e) => setAppTheme(e.target.value)}
                                            className="form-radio text-blue-600"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium dark:text-gray-200">Karanlık Mod</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Göz yormayan koyu görünüm</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group mb-6">
                                <label className="form-label mb-2 dark:text-gray-300">Uygulama Rengi</label>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {appColors.map((color) => (
                                        <button
                                            key={color.id}
                                            onClick={() => setAppColor(color.id)}
                                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${appColor === color.id ? 'border-blue-500 bg-blue-50 dark:bg-slate-800 dark:border-blue-400 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'}`}
                                        >
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                                                style={{ backgroundColor: color.color }}
                                            >
                                                {appColor === color.id && <Check size={16} className="text-white" />}
                                            </div>
                                            <span className="text-sm font-medium dark:text-slate-200">{color.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group mb-6">
                                <label className="form-label mb-2 dark:text-gray-300">Arayüz Tasarımı</label>
                                <div className="flex gap-4">
                                    <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-lg transition-colors flex-1 ${appLayout === 'modern' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 dark:bg-slate-800'}`}>
                                        <input
                                            type="radio"
                                            name="appLayout"
                                            value="modern"
                                            checked={appLayout === 'modern'}
                                            onChange={(e) => setAppLayout(e.target.value)}
                                            className="form-radio text-blue-600"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium dark:text-gray-200">Modern Dashboard</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Yeni, cam efektli ve panelli görünüm</span>
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-lg transition-colors flex-1 ${appLayout === 'classic' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 dark:bg-slate-800'}`}>
                                        <input
                                            type="radio"
                                            name="appLayout"
                                            value="classic"
                                            checked={appLayout === 'classic'}
                                            onChange={(e) => setAppLayout(e.target.value)}
                                            className="form-radio text-blue-600"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium dark:text-gray-200">Klasik Görünüm</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Basit, tek sütunlu standart görünüm</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group mb-6">
                                <label className="form-label mb-2 dark:text-gray-300">Cihaz Görünümü</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 dark:bg-slate-800 transition-colors flex-1">
                                        <input
                                            type="radio"
                                            name="viewMode"
                                            value="desktop"
                                            checked={viewMode === 'desktop'}
                                            onChange={(e) => setViewMode(e.target.value)}
                                            className="form-radio text-blue-600"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium dark:text-gray-200">Bilgisayar (Masaüstü)</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Geniş ekran görünümü</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 dark:bg-slate-800 transition-colors flex-1">
                                        <input
                                            type="radio"
                                            name="viewMode"
                                            value="mobile"
                                            checked={viewMode === 'mobile'}
                                            onChange={(e) => setViewMode(e.target.value)}
                                            className="form-radio text-blue-600"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium dark:text-gray-200">Mobil</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Dar ekran görünümü</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group mb-6">
                                <label className="form-label mb-2 dark:text-gray-300">Performans</label>
                                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 dark:bg-slate-800 transition-colors cursor-pointer">
                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={performanceMode}
                                            onChange={(e) => setPerformanceMode(e.target.checked)}
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium dark:text-gray-200">Performans Modu (Hafif Mod)</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Daha hızlı çalışması için animasyonları ve geçiş efektlerini kapatır.
                                            Eski cihazlar için önerilir.
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className="form-group mb-6">
                                <label className="form-label mb-2 dark:text-gray-300">Görünüm Yoğunluğu</label>
                                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 dark:bg-slate-800 transition-colors cursor-pointer">
                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={compactMode}
                                            onChange={(e) => setCompactMode(e.target.checked)}
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium dark:text-gray-200">Kompakt Mod (Sıkışık Görünüm)</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Daha fazla veriyi ekrana sığdırmak için boşlukları azaltır.
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className="form-group mb-6">
                                <label className="form-label mb-2 dark:text-gray-300">Uygulama Yazı Boyutu</label>
                                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-600">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Küçük</span>
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{appFontSize}px</span>
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Büyük</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="12"
                                        max="20"
                                        step="1"
                                        value={appFontSize}
                                        onChange={(e) => setAppFontSize(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                                        Uygulama genelindeki metin boyutunu ayarlar.
                                    </p>
                                </div>
                            </div>

                        </div>

                        {/* Actions */}
                        <div className="flex justify-end pt-4">
                            <button className="btn btn-primary" onClick={handleSave}>
                                <Save size={16} /> Ayarları Kaydet
                            </button>
                        </div>
                    </>
                )}

                {activeTab === 'company' && (
                    <div>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Teklif Varsayılanları</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label mb-1 dark:text-gray-300">Varsayılan Teklif Başlığı</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="defaultTitle"
                                        value={settings.defaultTitle || ''}
                                        onChange={handleChange}
                                        placeholder="Örn: Hizmet Teklifi"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label mb-1 dark:text-gray-300">Varsayılan Geçerlilik (Gün)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="defaultValidity"
                                        value={settings.defaultValidity}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="form-group mt-4">
                                <label className="form-label mb-1 dark:text-gray-300">Varsayılan Teklif Açıklaması</label>
                                <textarea
                                    className="form-control"
                                    rows="2"
                                    name="defaultDescription"
                                    value={settings.defaultDescription || ''}
                                    onChange={handleChange}
                                    placeholder="Örn: Aşağıdaki hizmetlerin dökümüdür..."
                                ></textarea>
                            </div>

                            <div className="form-group mt-4">
                                <label className="form-label">Varsayılan Teslimat Koşulları</label>
                                <textarea
                                    className="form-control"
                                    rows="2"
                                    name="defaultDeliveryTerms"
                                    value={settings.defaultDeliveryTerms || ''}
                                    onChange={handleChange}
                                    placeholder="Örn: Sipariş onayından sonra 3 iş günü içinde..."
                                ></textarea>
                            </div>

                            <div className="form-group mt-4">
                                <label className="form-label">Varsayılan Garanti Koşulları</label>
                                <textarea
                                    className="form-control"
                                    rows="2"
                                    name="defaultWarrantyTerms"
                                    value={settings.defaultWarrantyTerms || ''}
                                    onChange={handleChange}
                                    placeholder="Örn: 2 yıl parça ve işçilik garantilidir..."
                                ></textarea>
                            </div>

                            <div className="form-group mt-4">
                                <label className="form-label">Varsayılan Ek Notlar / Şartlar</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    name="defaultNote"
                                    value={settings.defaultNote}
                                    onChange={handleChange}
                                    placeholder="Diğer özel şartlar ve notlar..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-2 border-b pb-2">Varsayılan Firma Bilgileri</h3>
                            <p className="text-sm text-gray-500">
                                Buraya gireceğiniz bilgiler, yeni oluşturacağınız tüm tekliflerde otomatik olarak doldurulacaktır.
                            </p>
                        </div>

                        <CompanyInfoForm
                            data={companySettings}
                            onChange={handleCompanyChange}
                        />

                        <div className="flex justify-end pt-4 mt-4 border-t border-gray-100 dark:border-slate-700">
                            <button className="btn btn-primary" onClick={handleSave}>
                                <Save size={16} /> Ayarları Kaydet
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'performance' && (
                    <PerformanceMaintenanceTab />
                )}

                {activeTab === 'pdf' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">PDF Bölüm Sıralaması</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            PDF çıktısında bölümlerin sırasını değiştirmek için sürükleyip bırakın.
                            Görünmesini istemediğiniz bölümleri kapatabilirsiniz.
                        </p>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={(pdfLayout || []).map(item => item.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {(pdfLayout || []).map((item) => (
                                    <SortableItem
                                        key={item.id}
                                        id={item.id}
                                        label={item.label}
                                        enabled={item.enabled}
                                        onToggle={handleToggleSection}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                )}

                {activeTab === 'watermark' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:text-white">Filigran Ayarları</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            PDF çıktılarına eklenecek filigranı buradan özelleştirebilirsiniz.
                        </p>

                        <div className="space-y-6">
                            {/* Enable Switch */}
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
                                <div>
                                    <h4 className="font-medium dark:text-gray-200">Filigran Göster</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">PDF sayfalarının arka planında filigran görüntülenir.</p>
                                </div>
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={pdfConfig.showWatermark}
                                        onChange={(e) => setPdfConfig({ ...pdfConfig, showWatermark: e.target.checked })}
                                    />
                                </div>
                            </div>

                            {pdfConfig.showWatermark && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Text Input */}
                                    <div className="form-group">
                                        <label className="form-label dark:text-gray-300">Filigran Metni</label>
                                        <input
                                            type="text"
                                            className="form-control dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            value={pdfConfig.watermarkText}
                                            onChange={(e) => setPdfConfig({ ...pdfConfig, watermarkText: e.target.value })}
                                            placeholder="Örn: TASLAK"
                                        />
                                    </div>

                                    {/* Color Picker */}
                                    <div className="form-group">
                                        <label className="form-label dark:text-gray-300">Renk</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                className="h-10 w-20 p-1 rounded border dark:border-slate-600"
                                                value={pdfConfig.watermarkColor}
                                                onChange={(e) => setPdfConfig({ ...pdfConfig, watermarkColor: e.target.value })}
                                            />
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{pdfConfig.watermarkColor}</span>
                                        </div>
                                    </div>

                                    {/* Opacity Slider */}
                                    <div className="form-group">
                                        <div className="flex justify-between mb-2">
                                            <label className="form-label dark:text-gray-300">Opaklık (Saydamlık)</label>
                                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">%{Math.round(pdfConfig.watermarkOpacity * 100)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.05"
                                            max="1"
                                            step="0.05"
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                            value={pdfConfig.watermarkOpacity}
                                            onChange={(e) => setPdfConfig({ ...pdfConfig, watermarkOpacity: parseFloat(e.target.value) })}
                                        />
                                    </div>

                                    {/* Rotation Slider */}
                                    <div className="form-group">
                                        <div className="flex justify-between mb-2">
                                            <label className="form-label dark:text-gray-300">Döndürme Açısı</label>
                                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{pdfConfig.watermarkRotation}°</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-90"
                                            max="90"
                                            step="5"
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                            value={pdfConfig.watermarkRotation}
                                            onChange={(e) => setPdfConfig({ ...pdfConfig, watermarkRotation: parseInt(e.target.value) })}
                                        />
                                    </div>

                                    {/* Font Size Input */}
                                    <div className="form-group">
                                        <label className="form-label dark:text-gray-300">Yazı Boyutu (px)</label>
                                        <input
                                            type="number"
                                            className="form-control dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            value={pdfConfig.watermarkFontSize}
                                            onChange={(e) => setPdfConfig({ ...pdfConfig, watermarkFontSize: parseInt(e.target.value) })}
                                            min="20"
                                            max="300"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div >
    );
};

export default Settings;
