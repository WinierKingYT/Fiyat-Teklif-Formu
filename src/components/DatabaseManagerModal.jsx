import React from 'react';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { Database, Download, Upload, Trash, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLocalDateString } from '../utils/dateUtils';

const BACKUP_SCHEMA_VERSION = 3;

const ALL_STORES = [
    'customers', 'products', 'quotes', 'templates', 'bankInfo',
    'settings', 'recycle_bin', 'drafts', 'previewData', 'formState',
    'company_defaults'
];

const EXCLUDED_IMPORT_STORES = ['previewData', 'formState'];

const DatabaseManagerModal = ({ isOpen, onClose }) => {
    const { db } = useIndexedDB();
    const [stats, setStats] = useState({
        customers: 0,
        products: 0,
        quotes: 0,
        templates: 0,
        banks: 0
    });
    const [importFile, setImportFile] = useState(null);
    const [importMode, setImportMode] = useState('replace');
    const [showExportWarning, setShowExportWarning] = useState(false);

    useEffect(() => {
        if (isOpen && db) {
            loadStats();
        }
    }, [isOpen, db]);

    const loadStats = async () => {
        try {
            const [customers, products, quotes, templates, banks] = await Promise.all([
                db.getAll('customers'),
                db.getAll('products'),
                db.getAll('quotes'),
                db.getAll('templates'),
                db.getAll('bankInfo')
            ]);

            setStats({
                customers: customers.length,
                products: products.length,
                quotes: quotes.length,
                templates: templates.length,
                banks: banks.length
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const [clearConfirmText, setClearConfirmText] = useState('');

    const handleClearData = async () => {
        if (clearConfirmText !== 'TÜM VERİLERİ SİL') {
            toast.error('Lütfen onay metnini doğru yazın: TÜM VERİLERİ SİL');
            return;
        }

        const counts = {};
        for (const store of ALL_STORES) {
            try {
                const items = await db.getAll(store);
                if (items.length > 0) counts[store] = items.length;
            } catch {}
        }
        const summary = Object.entries(counts)
            .map(([store, count]) => `${store}: ${count} kayıt`)
            .join(', ');

        if (!window.confirm(`Bu işlem tüm verileri kalıcı olarak silecek: ${summary}. Devam etmek istediğinize emin misiniz?`)) {
            return;
        }

        try {
            await Promise.all(
                ALL_STORES.map(store => db.clear(store).catch(() => {}))
            );
            toast.success('Tüm veriler temizlendi');
            setClearConfirmText('');
            loadStats();
        } catch (error) {
            console.error('Error clearing data:', error);
            toast.error('Veriler temizlenirken hata oluştu');
        }
    };

    const handleExport = async () => {
        if (!showExportWarning) {
            setShowExportWarning(true);
            return;
        }

        try {
            const results = await Promise.all(
                ALL_STORES.map(async (store) => {
                    try {
                        return { store, data: await db.getAll(store) };
                    } catch {
                        return { store, data: [] };
                    }
                })
            );

            const data = {
                schemaVersion: BACKUP_SCHEMA_VERSION,
                createdAt: new Date().toISOString(),
                stores: {}
            };

            results.forEach(({ store, data: storeData }) => {
                data.stores[store] = storeData;
            });

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = getLocalDateString().replace(/-/g, '');
            a.download = `teklif_master_yedek_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setShowExportWarning(false);
            toast.success('Yedek dosyası indirildi (tüm veriler)');
        } catch (error) {
            console.error('Error exporting data:', error);
            toast.error('Dışa aktarma hatası');
        }
    };

    const validateBackup = (data) => {
        if (!data || typeof data !== 'object') {
            throw new Error('Geçersiz dosya: JSON nesnesi değil');
        }
        if (!data.schemaVersion || typeof data.schemaVersion !== 'number') {
            throw new Error('Geçersiz şema sürümü');
        }
        if (!data.stores || typeof data.stores !== 'object') {
            throw new Error('Geçersiz dosya: stores alanı eksik');
        }
        if (data.schemaVersion > BACKUP_SCHEMA_VERSION) {
            throw new Error(`Bu yedek (sürüm ${data.schemaVersion}) mevcut uygulama (sürüm ${BACKUP_SCHEMA_VERSION}) için çok yeni. Lütfen uygulamayı güncelleyin.`);
        }
        return true;
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            toast.error('Dosya çok büyük (maksimum 50 MB)');
            e.target.value = '';
            return;
        }

        setImportFile(file);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);

                validateBackup(data);

                // Atomic import: first validate all stores, then execute
                const allOperations = [];

                for (const [store, items] of Object.entries(data.stores)) {
                    if (EXCLUDED_IMPORT_STORES.includes(store)) continue;
                    if (!Array.isArray(items)) continue;

                    if (importMode === 'replace') {
                        allOperations.push({ store, action: 'clear' });
                    }

                    for (const item of items) {
                        if (item && typeof item === 'object') {
                            if (importMode === 'merge') {
                                allOperations.push({ store, action: 'put', item });
                            } else if (importMode === 'missing') {
                                allOperations.push({ store, action: 'tryAdd', item });
                            } else {
                                allOperations.push({ store, action: 'put', item });
                            }
                        }
                    }
                }

                // Execute atomically
                for (const op of allOperations) {
                    if (op.action === 'clear') {
                        await db.clear(op.store);
                    } else if (op.action === 'put') {
                        await db.put(op.store, op.item);
                    } else if (op.action === 'tryAdd') {
                        try {
                            await db.add(op.store, op.item);
                        } catch {
                            // Skip duplicates silently
                        }
                    }
                }

                toast.success('Veriler başarıyla içe aktarıldı');
                loadStats();
                toast('Yedek dosyasını güvenli bir yerde saklayın. Dosya müşteri, banka ve ticari veriler içerir.', { duration: 5000, icon: '⚠️' });
            } catch (error) {
                console.error('Error importing data:', error);
                toast.error(error.message || 'İçe aktarma hatası: Geçersiz dosya formatı');
            } finally {
                setImportFile(null);
            }
        };
        reader.readAsText(file);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Veritabanı Yönetimi" size="lg">
            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-[var(--color-bg-muted)] p-4 rounded-[var(--radius)] text-center border border-[var(--color-border)]">
                        <div className="text-2xl font-bold text-[var(--color-info)]">{stats.customers}</div>
                        <div className="text-sm text-[var(--color-text-muted)]">Müşteriler</div>
                    </div>
                    <div className="bg-[var(--color-bg-muted)] p-4 rounded-[var(--radius)] text-center border border-[var(--color-border)]">
                        <div className="text-2xl font-bold text-[var(--color-success)]">{stats.products}</div>
                        <div className="text-sm text-[var(--color-text-muted)]">Ürünler</div>
                    </div>
                    <div className="bg-[var(--color-bg-muted)] p-4 rounded-[var(--radius)] text-center border border-[var(--color-border)]">
                        <div className="text-2xl font-bold text-[var(--color-text)]">{stats.quotes}</div>
                        <div className="text-sm text-[var(--color-text-muted)]">Teklifler</div>
                    </div>
                    <div className="bg-[var(--color-bg-muted)] p-4 rounded-[var(--radius)] text-center border border-[var(--color-border)]">
                        <div className="text-2xl font-bold text-[var(--color-warning)]">{stats.templates}</div>
                        <div className="text-sm text-[var(--color-text-muted)]">Şablonlar</div>
                    </div>
                    <div className="bg-[var(--color-bg-muted)] p-4 rounded-[var(--radius)] text-center border border-[var(--color-border)]">
                        <div className="text-2xl font-bold text-[var(--color-info)]">{stats.banks}</div>
                        <div className="text-sm text-[var(--color-text-muted)]">Bankalar</div>
                    </div>
                </div>

                {/* Export Warning Banner */}
                {showExportWarning && (
                    <div className="bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-[var(--color-warning)] shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="font-semibold text-[var(--color-warning)]">Güvenlik Uyarısı</p>
                                <p className="text-sm text-[var(--color-warning)] mt-1">
                                    Yedek dosyası müşteri adları, telefon, e-posta, adres, IBAN, banka bilgileri,
                                    ticari fiyatlar ve firma imza/kaşe bilgileri içerebilir.
                                    Dosyayı güvenli olmayan ortamlarda paylaşmayın.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button className="btn btn-sm btn-ghost" onClick={() => setShowExportWarning(false)}>Vazgeç</button>
                            <button className="btn btn-sm btn-primary" onClick={handleExport}>Anladım, Dışa Aktar</button>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="border-t border-[var(--color-border)] pt-6">
                    <h4 className="text-lg font-semibold mb-4 text-[var(--color-text)]">Veri İşlemleri</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button className="btn btn-outline flex items-center justify-center gap-2" onClick={handleExport}>
                            <Download size={18} /> Tüm Veriyi Dışa Aktar
                        </button>
                        <div className="relative">
                            <input
                                type="file"
                                id="dbImport"
                                className="hidden"
                                accept=".json"
                                onChange={handleImport}
                            />
                            <button
                                className="btn btn-outline w-full flex items-center justify-center gap-2"
                                onClick={() => document.getElementById('dbImport').click()}
                            >
                                <Upload size={18} /> Veri İçe Aktar
                            </button>
                        </div>

                        {/* Import Mode Selection */}
                        <div className="md:col-span-2 flex flex-wrap gap-2 items-center text-sm">
                            <span className="text-[var(--color-text-muted)]">İçe Aktarma Modu:</span>
                            {[
                                { value: 'replace', label: 'Tamamen Değiştir' },
                                { value: 'merge', label: 'Birleştir' },
                                { value: 'missing', label: 'Sadece Eksikleri Ekle' }
                            ].map(option => (
                                <button
                                    key={option.value}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                        importMode === option.value
                                            ? 'bg-[var(--color-primary-muted)] text-[var(--color-info)]'
                                            : 'bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'
                                    }`}
                                    onClick={() => setImportMode(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        <button className="btn btn-outline flex items-center justify-center gap-2" onClick={loadStats}>
                            <RefreshCw size={18} /> İstatistikleri Yenile
                        </button>
                        <button className="btn btn-danger flex items-center justify-center gap-2" onClick={handleClearData}>
                            <Trash size={18} /> Tüm Veriyi Temizle
                        </button>
                    </div>

                    {/* Clear Confirmation Input */}
                    <div className="mt-4 p-3 bg-[var(--color-error)]/10 border border-[var(--color-border)] rounded-lg">
                        <label className="text-xs font-medium text-[var(--color-error)]">
                            Tüm verileri silmek için aşağıya <strong>TÜM VERİLERİ SİL</strong> yazın:
                        </label>
                        <div className="flex gap-2 mt-1">
                            <input
                                type="text"
                                className="form-control text-sm flex-1"
                                placeholder="TÜM VERİLERİ SİL"
                                value={clearConfirmText}
                                onChange={(e) => setClearConfirmText(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseManagerModal;
