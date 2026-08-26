import { Database, Download, Upload, Trash2, Sparkles, RefreshCw, HardDrive } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useQuoteData } from '@/context/QuoteContext';
import { useTranslation } from '@/hooks/useTranslation';
import { BACKUP_SCHEMA_VERSION, BACKUP_STORE_NAMES, parseBackupStores } from '@/utils/backupValidation';
import { getLocalDateString } from '@/utils/dateUtils';
import Logger from '@/utils/logger';

const DataBackupSettings: React.FC = () => {
    const { quoteData, db, fillTestData } = useQuoteData();
    const { t } = useTranslation(quoteData?.language);
    const [stats, setStats] = useState({
        customers: 0,
        products: 0,
        quotes: 0,
        templates: 0,
        banks: 0,
    });
    const [loading, setLoading] = useState(true);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant: 'info' | 'warning' | 'danger';
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadStats = async () => {
        if (!db) return;
        try {
            const [customers, products, quotes, templates, banks] = await Promise.all([
                db.getAll('customers').catch(() => []),
                db.getAll('products').catch(() => []),
                db.getAll('quotes').catch(() => []),
                db.getAll('templates').catch(() => []),
                db.getAll('bankInfo').catch(() => []),
            ]);
            setStats({
                customers: customers.length,
                products: products.length,
                quotes: quotes.length,
                templates: templates.length,
                banks: banks.length,
            });
            setLoading(false);
        } catch (error) {
            Logger.error('Error loading stats:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, [db]);

    const handleExport = async () => {
        if (!db) return;
        try {
            const results = await Promise.all(
                BACKUP_STORE_NAMES.map(async (store) => {
                    try {
                        return { store, data: await db.getAll(store) };
                    } catch {
                        return { store, data: [] };
                    }
                })
            );

            const data: { schemaVersion: number; createdAt: string; stores: Record<string, unknown[]> } = {
                schemaVersion: BACKUP_SCHEMA_VERSION,
                createdAt: new Date().toISOString(),
                stores: {},
            };

            results.forEach(({ store, data: storeData }) => {
                data.stores[store] = storeData;
            });

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = getLocalDateString().replace(/-/g, '');
            a.href = url;
            a.download = `teklif_master_yedek_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast.success(t('backupDownloadedAll') || 'Tüm sistem yedeği başarıyla indirildi.');
        } catch (error) {
            Logger.error('Error exporting data:', error);
            toast.error(t('backupExportError') || 'Yedek dışa aktarılırken hata oluştu.');
        }
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !db) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = (event.target as FileReader).result;
                if (typeof content !== 'string') {
                    throw new Error('Yedek dosyası metin olarak okunamadı.');
                }
                const parsed = JSON.parse(content);
                const stores = parseBackupStores(parsed);
                const restoredCount = await db.restoreStores(stores);

                toast.success(`${t('backupRestored') || 'Yedek başarıyla geri yüklendi.'} (${restoredCount} kayıt)`);
                await loadStats();
                window.dispatchEvent(new CustomEvent('db-restored'));
            } catch (err) {
                Logger.error('Error restoring backup:', err);
                const detail = err instanceof Error ? ` ${err.message}` : '';
                toast.error(`${t('backupRestoreError') || 'Yedek dosyası okunamadı veya geçersiz.'}${detail}`);
            }
        };
        reader.onerror = () => {
            toast.error(t('backupRestoreError') || 'Yedek dosyası okunamadı veya geçersiz.');
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClearAll = () => {
        setConfirmDialog({
            isOpen: true,
            title: t('deleteAllData') || 'Tüm Verileri Temizle',
            message: 'Tüm teklifler, müşteriler ve ürün veritabanı sıfırlanacaktır. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                if (!db) return;
                try {
                    await Promise.all(BACKUP_STORE_NAMES.map(s => db.clear(s).catch(() => {})));
                    toast.success(t('allDataCleared') || 'Tüm veriler temizlendi.');
                    loadStats();
                    window.dispatchEvent(new CustomEvent('db-cleared'));
                } catch (err) {
                    Logger.error('Clear error:', err);
                    toast.error('Veriler temizlenirken hata oluştu.');
                }
            },
            variant: 'danger',
        });
    };

    return (
        <div className="card space-y-6">
            <div className="card-header">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                        <HardDrive size={13} className="text-[var(--color-primary)]" />
                    </div>
                    <span className="card-title">{t('dataAndStorage') || 'Veri & Depolama Yönetimi'}</span>
                </div>
            </div>

            <div className="card-body space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {[
                        { label: t('quotes') || 'Teklifler', count: stats.quotes, color: 'text-blue-500' },
                        { label: t('customers') || 'Müşteriler', count: stats.customers, color: 'text-emerald-500' },
                        { label: t('products') || 'Ürünler', count: stats.products, color: 'text-purple-500' },
                        { label: t('templates') || 'Şablonlar', count: stats.templates, color: 'text-amber-500' },
                        { label: t('banks') || 'Bankalar', count: stats.banks, color: 'text-cyan-500' },
                    ].map((item) => (
                        <div key={item.label} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-muted)] flex flex-col items-center justify-center">
                            <span className="text-xl font-bold font-mono text-[var(--color-text)]">
                                {loading ? '...' : item.count}
                            </span>
                            <span className="text-[11px] font-medium text-[var(--color-text-muted)] mt-0.5">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Backup Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Export */}
                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] flex flex-col justify-between space-y-3">
                        <div>
                            <div className="flex items-center gap-2 font-semibold text-sm text-[var(--color-text)]">
                                <Download size={16} className="text-[var(--color-primary)]" />
                                <span>{t('backupDownloadTitle') || 'Tam Sistem Yedeği İndir'}</span>
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                {t('backupDownloadDesc') || 'Tüm teklifleri, müşterileri, ürünleri ve sistem ayarlarını JSON dosyası olarak kaydedin.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleExport}
                            className="btn btn-primary btn-sm flex items-center justify-center gap-1.5 w-full"
                        >
                            <Download size={14} />
                            <span>{t('downloadBackup') || 'Yedek Dosyasını İndir (.json)'}</span>
                        </button>
                    </div>

                    {/* Import */}
                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] flex flex-col justify-between space-y-3">
                        <div>
                            <div className="flex items-center gap-2 font-semibold text-sm text-[var(--color-text)]">
                                <Upload size={16} className="text-emerald-500" />
                                <span>{t('backupRestoreTitle') || 'Yedekten Geri Yükle'}</span>
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                {t('backupRestoreDesc') || 'Daha önce indirdiğiniz bir JSON yedek dosyasını seçerek verileri içe aktarın.'}
                            </p>
                        </div>
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleImportFile}
                                className="hidden"
                                id="backup-file-input"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="btn btn-outline btn-sm flex items-center justify-center gap-1.5 w-full"
                            >
                                <Upload size={14} />
                                <span>{t('selectBackupFile') || 'Yedek Dosyası Seç (.json)'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Additional Quick Actions */}
                <div className="border-t border-[var(--color-border)] pt-4 flex flex-wrap items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={fillTestData}
                        className="btn btn-sm btn-outline flex items-center gap-1.5 text-xs text-[var(--color-text)]"
                    >
                        <Sparkles size={13} className="text-[var(--color-primary)]" />
                        <span>{t('fillSampleData') || 'Örnek Demo Verisi Yükle'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleClearAll}
                        className="btn btn-sm flex items-center gap-1.5 text-xs text-red-600 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                        <Trash2 size={13} />
                        <span>{t('clearAllData') || 'Tüm Veritabanını Sıfırla'}</span>
                    </button>
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                variant={confirmDialog.variant}
            />
        </div>
    );
};

export default DataBackupSettings;
