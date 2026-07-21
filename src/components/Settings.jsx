import React, { useState, useEffect } from 'react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { useQuote } from '../context/QuoteContext';
import { useUI } from '../context/UIContext';
import { useTranslation } from '../hooks/useTranslation';
import { Save, RefreshCw, GripVertical, Building, Check, Settings2 } from 'lucide-react';
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
            <div className="form-switch">
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

    if (loading) return <div className="flex items-center justify-center p-12 text-[var(--color-text-muted)] text-sm">Yükleniyor...</div>;

    const tabs = [
        { id: 'general', label: 'Genel Ayarlar' },
        { id: 'company', label: 'Varsayılan Bilgiler' },
        { id: 'performance', label: 'Performans & Bakım' },
        { id: 'pdf', label: 'PDF Düzeni' },
        { id: 'watermark', label: 'Filigran' },
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                    <Settings2 size={17} className="text-[var(--color-primary)]" />
                </div>
                <h1 className="text-xl font-bold text-[var(--color-text)]">Uygulama Ayarları</h1>
            </div>

            <div className="tab-nav">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'tab-btn-active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'general' && (
                <div className="card">
                    <div className="card-header">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                                <Settings2 size={13} className="text-[var(--color-primary)]" />
                            </div>
                            <span className="card-title">Görünüm Ayarları</span>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={handleSave}>
                            <Save size={14} /> Ayarları Kaydet
                        </button>
                    </div>
                    <div className="card-body space-y-6">
                        <div className="form-group">
                            <label className="form-label">Tema Modu</label>
                            <div className="flex gap-3">
                                {['light', 'dark'].map(mode => (
                                    <label key={mode} className={`flex items-center gap-3 cursor-pointer p-3 border rounded-[var(--radius)] transition-colors flex-1 ${appTheme === mode ? 'bg-[var(--color-primary-muted)] border-[var(--color-primary)]' : 'bg-[var(--color-bg-card)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'}`}>
                                        <input type="radio" name="appTheme" value={mode} checked={appTheme === mode} onChange={(e) => setAppTheme(e.target.value)} className="form-radio" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-[var(--color-text)] capitalize">{mode} Mod</span>
                                            <span className="text-xs text-[var(--color-text-muted)]">{mode === 'light' ? 'Standart beyaz görünüm' : 'Göz yormayan koyu görünüm'}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Uygulama Rengi</label>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                {appColors.map((color) => (
                                    <button
                                        key={color.id}
                                        onClick={() => setAppColor(color.id)}
                                        className={`flex items-center gap-3 p-2.5 rounded-[var(--radius)] border transition-all ${appColor === color.id ? 'bg-[var(--color-primary-muted)] border-[var(--color-primary)]' : 'bg-[var(--color-bg-card)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'}`}
                                    >
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: color.color }}>
                                            {appColor === color.id && <Check size={14} className="text-white" />}
                                        </div>
                                        <span className="text-sm font-medium text-[var(--color-text)]">{color.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Arayüz Tasarımı</label>
                            <div className="flex gap-3">
                                {[
                                    { id: 'modern', label: 'Modern Dashboard', desc: 'Yeni, cam efektli ve panelli görünüm' },
                                    { id: 'classic', label: 'Klasik Görünüm', desc: 'Basit, tek sütunlu standart görünüm' },
                                ].map(layout => (
                                    <label key={layout.id} className={`flex items-center gap-3 cursor-pointer p-3 border rounded-[var(--radius)] transition-colors flex-1 ${appLayout === layout.id ? 'bg-[var(--color-primary-muted)] border-[var(--color-primary)]' : 'bg-[var(--color-bg-card)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'}`}>
                                        <input type="radio" name="appLayout" value={layout.id} checked={appLayout === layout.id} onChange={(e) => setAppLayout(e.target.value)} className="form-radio" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-[var(--color-text)]">{layout.label}</span>
                                            <span className="text-xs text-[var(--color-text-muted)]">{layout.desc}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Cihaz Görünümü</label>
                            <div className="flex gap-3">
                                {[
                                    { id: 'desktop', label: 'Bilgisayar (Masaüstü)', desc: 'Geniş ekran görünümü' },
                                    { id: 'mobile', label: 'Mobil', desc: 'Dar ekran görünümü' },
                                ].map(mode => (
                                    <label key={mode.id} className={`flex items-center gap-3 cursor-pointer p-3 border rounded-[var(--radius)] transition-colors flex-1 ${viewMode === mode.id ? 'bg-[var(--color-primary-muted)] border-[var(--color-primary)]' : 'bg-[var(--color-bg-card)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'}`}>
                                        <input type="radio" name="viewMode" value={mode.id} checked={viewMode === mode.id} onChange={(e) => setViewMode(e.target.value)} className="form-radio" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-[var(--color-text)]">{mode.label}</span>
                                            <span className="text-xs text-[var(--color-text-muted)]">{mode.desc}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Performans</label>
                            <label className="flex items-center gap-3 p-3 border border-[var(--color-border)] rounded-[var(--radius)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer">
                                <div className="form-switch">
                                    <input className="form-check-input" type="checkbox" checked={performanceMode} onChange={(e) => setPerformanceMode(e.target.checked)} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-[var(--color-text)]">Performans Modu (Hafif Mod)</span>
                                    <span className="text-xs text-[var(--color-text-muted)]">Daha hızlı çalışması için animasyonları ve geçiş efektlerini kapatır. Eski cihazlar için önerilir.</span>
                                </div>
                            </label>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Görünüm Yoğunluğu</label>
                            <label className="flex items-center gap-3 p-3 border border-[var(--color-border)] rounded-[var(--radius)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer">
                                <div className="form-switch">
                                    <input className="form-check-input" type="checkbox" checked={compactMode} onChange={(e) => setCompactMode(e.target.checked)} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-[var(--color-text)]">Kompakt Mod (Sıkışık Görünüm)</span>
                                    <span className="text-xs text-[var(--color-text-muted)]">Daha fazla veriyi ekrana sığdırmak için boşlukları azaltır.</span>
                                </div>
                            </label>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Uygulama Yazı Boyutu</label>
                            <div className="p-4 border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg-muted)]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-[var(--color-text-muted)]">Küçük</span>
                                    <span className="text-sm font-bold text-[var(--color-primary)]">{appFontSize}px</span>
                                    <span className="text-xs font-medium text-[var(--color-text-muted)]">Büyük</span>
                                </div>
                                <input type="range" min="12" max="20" step="1" value={appFontSize} onChange={(e) => setAppFontSize(parseInt(e.target.value))} />
                                <p className="text-xs text-[var(--color-text-muted)] mt-2 text-center">Uygulama genelindeki metin boyutunu ayarlar.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'company' && (
                <div className="card">
                    <div className="card-header">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                                <Building size={13} className="text-[var(--color-primary)]" />
                            </div>
                            <span className="card-title">Teklif Varsayılanları</span>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={handleSave}>
                            <Save size={14} /> Ayarları Kaydet
                        </button>
                    </div>
                    <div className="card-body">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Varsayılan Teklif Başlığı</label>
                                <input type="text" className="form-control" name="defaultTitle" value={settings.defaultTitle || ''} onChange={handleChange} placeholder="Örn: Hizmet Teklifi" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Varsayılan Geçerlilik (Gün)</label>
                                <input type="number" className="form-control" name="defaultValidity" value={settings.defaultValidity} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Varsayılan Teklif Açıklaması</label>
                            <textarea className="form-control" rows="2" name="defaultDescription" value={settings.defaultDescription || ''} onChange={handleChange} placeholder="Örn: Aşağıdaki hizmetlerin dökümüdür..."></textarea>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Varsayılan Teslimat Koşulları</label>
                            <textarea className="form-control" rows="2" name="defaultDeliveryTerms" value={settings.defaultDeliveryTerms || ''} onChange={handleChange} placeholder="Örn: Sipariş onayından sonra 3 iş günü içinde..."></textarea>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Varsayılan Garanti Koşulları</label>
                            <textarea className="form-control" rows="2" name="defaultWarrantyTerms" value={settings.defaultWarrantyTerms || ''} onChange={handleChange} placeholder="Örn: 2 yıl parça ve işçilik garantilidir..."></textarea>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Varsayılan Ek Notlar / Şartlar</label>
                            <textarea className="form-control" rows="3" name="defaultNote" value={settings.defaultNote} onChange={handleChange} placeholder="Diğer özel şartlar ve notlar..."></textarea>
                        </div>

                        <div className="border-t border-[var(--color-border)] pt-5 mt-6">
                            <h3 className="text-base font-bold text-[var(--color-text)] mb-1.5">Varsayılan Firma Bilgileri</h3>
                            <p className="text-sm text-[var(--color-text-muted)] mb-4">Buraya gireceğiniz bilgiler, yeni oluşturacağınız tüm tekliflerde otomatik olarak doldurulacaktır.</p>
                            <CompanyInfoForm data={companySettings} onChange={handleCompanyChange} />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'performance' && (
                <div className="card">
                    <div className="card-header">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                                <RefreshCw size={13} className="text-[var(--color-primary)]" />
                            </div>
                            <span className="card-title">Performans & Bakım</span>
                        </div>
                    </div>
                    <div className="card-body">
                        <PerformanceMaintenanceTab />
                    </div>
                </div>
            )}

            {activeTab === 'pdf' && (
                <div className="card">
                    <div className="card-header">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                                <GripVertical size={13} className="text-[var(--color-primary)]" />
                            </div>
                            <span className="card-title">PDF Bölüm Sıralaması</span>
                        </div>
                    </div>
                    <div className="card-body">
                        <p className="text-sm text-[var(--color-text-muted)] mb-4">PDF çıktısında bölümlerin sırasını değiştirmek için sürükleyip bırakın. Görünmesini istemediğiniz bölümleri kapatabilirsiniz.</p>

                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={(pdfLayout || []).map(item => item.id)} strategy={verticalListSortingStrategy}>
                                {(pdfLayout || []).map((item) => (
                                    <SortableItem key={item.id} id={item.id} label={item.label} enabled={item.enabled} onToggle={handleToggleSection} />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>
            )}

            {activeTab === 'watermark' && (
                <div className="card">
                    <div className="card-header">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                                <Settings2 size={13} className="text-[var(--color-primary)]" />
                            </div>
                            <span className="card-title">Filigran Ayarları</span>
                        </div>
                    </div>
                    <div className="card-body">
                        <p className="text-sm text-[var(--color-text-muted)] mb-5">PDF çıktılarına eklenecek filigranı buradan özelleştirebilirsiniz.</p>

                        <div className="space-y-5">
                            <div className="flex items-center justify-between p-4 border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg-muted)]">
                                <div>
                                    <h4 className="text-sm font-medium text-[var(--color-text)]">Filigran Göster</h4>
                                    <p className="text-xs text-[var(--color-text-muted)]">PDF sayfalarının arka planında filigran görüntülenir.</p>
                                </div>
                                <div className="form-switch">
                                    <input className="form-check-input" type="checkbox" checked={pdfConfig.showWatermark} onChange={(e) => setPdfConfig({ ...pdfConfig, showWatermark: e.target.checked })} />
                                </div>
                            </div>

                            {pdfConfig.showWatermark && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Filigran Metni</label>
                                        <input type="text" className="form-control" value={pdfConfig.watermarkText} onChange={(e) => setPdfConfig({ ...pdfConfig, watermarkText: e.target.value })} placeholder="Örn: TASLAK" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Renk</label>
                                        <div className="flex items-center gap-3">
                                            <input type="color" value={pdfConfig.watermarkColor} onChange={(e) => setPdfConfig({ ...pdfConfig, watermarkColor: e.target.value })} />
                                            <span className="text-sm text-[var(--color-text-muted)]">{pdfConfig.watermarkColor}</span>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <div className="flex justify-between mb-2">
                                            <label className="form-label">Opaklık (Saydamlık)</label>
                                            <span className="text-sm font-bold text-[var(--color-primary)]">%{Math.round(pdfConfig.watermarkOpacity * 100)}</span>
                                        </div>
                                        <input type="range" min="0.05" max="1" step="0.05" value={pdfConfig.watermarkOpacity} onChange={(e) => setPdfConfig({ ...pdfConfig, watermarkOpacity: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="form-group">
                                        <div className="flex justify-between mb-2">
                                            <label className="form-label">Döndürme Açısı</label>
                                            <span className="text-sm font-bold text-[var(--color-primary)]">{pdfConfig.watermarkRotation}°</span>
                                        </div>
                                        <input type="range" min="-90" max="90" step="5" value={pdfConfig.watermarkRotation} onChange={(e) => setPdfConfig({ ...pdfConfig, watermarkRotation: parseInt(e.target.value) })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Yazı Boyutu (px)</label>
                                        <input type="number" className="form-control" value={pdfConfig.watermarkFontSize} onChange={(e) => setPdfConfig({ ...pdfConfig, watermarkFontSize: parseInt(e.target.value) })} min="20" max="300" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;