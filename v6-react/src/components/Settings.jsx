import React, { useState, useEffect } from 'react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { useQuote } from '../context/QuoteContext';
import { Save, RefreshCw, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
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
        <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 bg-white border rounded-lg mb-2 shadow-sm">
            <div className="flex items-center gap-3">
                <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
                    <GripVertical size={20} />
                </div>
                <span className="font-medium text-gray-700">{label}</span>
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
    const { pdfLayout, setPdfLayout, viewMode, setViewMode } = useQuote();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({
        defaultTaxRate: 20,
        currency: 'TRY',
        defaultNote: '',
        companyName: '',
        companyLogo: null
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
                    setSettings(savedSettings);
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

    const handleSave = async () => {
        if (!db) return;
        try {
            await db.put('settings', { id: 'global', ...settings });
            toast.success('Ayarlar başarıyla kaydedildi!');
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error('Ayarlar kaydedilirken bir hata oluştu.');
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

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
            <h1 className="text-2xl font-bold mb-6">Uygulama Ayarları</h1>

            {/* Tabs */}
            <div className="flex border-b mb-6">
                <button
                    className={`px-4 py-2 font-medium ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('general')}
                >
                    Genel Ayarlar
                </button>
                <button
                    className={`px-4 py-2 font-medium ${activeTab === 'pdf' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('pdf')}
                >
                    PDF Düzeni
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-6">

                {activeTab === 'general' && (
                    <>
                        {/* General Settings */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Görünüm Ayarları</h3>
                            <div className="form-group mb-6">
                                <label className="form-label mb-2">Cihaz Görünümü</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors flex-1">
                                        <input
                                            type="radio"
                                            name="viewMode"
                                            value="desktop"
                                            checked={viewMode === 'desktop'}
                                            onChange={(e) => setViewMode(e.target.value)}
                                            className="form-radio text-blue-600"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium">Bilgisayar (Masaüstü)</span>
                                            <span className="text-xs text-gray-500">Geniş ekran görünümü</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors flex-1">
                                        <input
                                            type="radio"
                                            name="viewMode"
                                            value="mobile"
                                            checked={viewMode === 'mobile'}
                                            onChange={(e) => setViewMode(e.target.value)}
                                            className="form-radio text-blue-600"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium">Mobil</span>
                                            <span className="text-xs text-gray-500">Dar ekran görünümü</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Genel Varsayılanlar</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Varsayılan KDV Oranı (%)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="defaultTaxRate"
                                        value={settings.defaultTaxRate}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Para Birimi</label>
                                    <select
                                        className="form-control form-select"
                                        name="currency"
                                        value={settings.currency}
                                        onChange={handleChange}
                                    >
                                        <option value="TRY">Türk Lirası (₺)</option>
                                        <option value="USD">Amerikan Doları ($)</option>
                                        <option value="EUR">Euro (€)</option>
                                        <option value="GBP">Sterlin (£)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Default Notes */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Teklif Notları</h3>
                            <div className="form-group">
                                <label className="form-label">Varsayılan Teklif Notu / Şartlar</label>
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    name="defaultNote"
                                    value={settings.defaultNote}
                                    onChange={handleChange}
                                    placeholder="Örn: Ödeme peşindir. Teslim süresi 3 gündür."
                                ></textarea>
                                <p className="text-xs text-muted mt-1">Bu not her yeni teklifte otomatik olarak eklenecektir.</p>
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
                                items={pdfLayout.map(item => item.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {pdfLayout.map((item) => (
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

            </div>
        </div>
    );
};

export default Settings;
