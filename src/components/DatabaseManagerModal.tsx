import { Database, Download, Upload, Trash, RefreshCw, AlertTriangle } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import Modal from '@/components/Modal';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useTranslation } from '@/hooks/useTranslation';
import { getLocalDateString } from '@/utils/dateUtils';
import Logger from '@/utils/logger';

const BACKUP_SCHEMA_VERSION = 3;

const ALL_STORES = [
    'customers', 'products', 'quotes', 'templates', 'bankInfo',
    'settings', 'recycle_bin', 'drafts', 'previewData', 'formState', 'quoteVersions'
];

const EXCLUDED_IMPORT_STORES = ['previewData', 'formState'];

interface DatabaseManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    language?: string;
}

const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({ isOpen, onClose, language = 'tr' }) => {
    const { t } = useTranslation(language);
    const { db } = useIndexedDB();
    const [stats, setStats] = useState({
        customers: 0,
        products: 0,
        quotes: 0,
        templates: 0,
        banks: 0
    });
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant: 'info' | 'warning' | 'danger';
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importMode, setImportMode] = useState<'replace' | 'merge' | 'missing'>('merge');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showExportWarning, setShowExportWarning] = useState(false);

    useEffect(() => {
        if (isOpen && db) {
            loadStats();
        }
    }, [isOpen, db]);

    const loadStats = async () => {
        if (!db) return;
        try {
            const [customers, products, quotes, templates, banks] = await Promise.all([
                (db).getAll('customers'),
                (db).getAll('products'),
                (db).getAll('quotes'),
                (db).getAll('templates'),
                (db).getAll('bankInfo')
            ]);

            setStats({
                customers: customers.length,
                products: products.length,
                quotes: quotes.length,
                templates: templates.length,
                banks: banks.length
            });
        } catch (error) {
            Logger.error('Error loading stats:', error);
        }
    };

    const [clearConfirmText, setClearConfirmText] = useState('');

    const handleClearData = async () => {
        const trimmed = clearConfirmText.trim().toLocaleUpperCase('tr-TR');
        const validConfirmPhrases = [
            'TÜM VERİLERİ SİL',
            'TUM VERILERI SIL',
            'DELETE ALL DATA',
            'ALLE DATEN LÖSCHEN',
            'ALLE DATEN LOSCHEN'
        ];
        if (!validConfirmPhrases.includes(trimmed)) {
            toast.error(t('clearDataWrongText'));
            return;
        }

        const counts: Record<string, number> = {};
        for (const store of ALL_STORES) {
            try {
                const items = await (db).getAll(store);
                if (items.length > 0) counts[store] = items.length;
            } catch {}
        }
        const recordLabel = t('records') || 'kayıt';
        const summary = Object.entries(counts)
            .map(([store, count]) => `${store}: ${count} ${recordLabel}`)
            .join(', ');

        setConfirmDialog({
            isOpen: true,
            title: t('deleteAllData'),
            message: t('deleteAllDataConfirm').replace('{summary}', summary),
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                try {
                    await Promise.all(ALL_STORES.map(store => (db).clear(store).catch(() => {})));
                    toast.success(t('allDataCleared'));
                    setClearConfirmText('');
                    loadStats();
                    window.dispatchEvent(new CustomEvent('db-cleared'));
                } catch (error) {
                    Logger.error('Error clearing data:', error);
                    toast.error(t('clearDataError'));
                }
            },
            variant: 'danger'
        });
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
                        return { store, data: await (db).getAll(store) };
                    } catch {
                        return { store, data: [] };
                    }
                })
            );

            const data: { schemaVersion: number; createdAt: string; stores: Record<string, unknown[]> } = {
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
            a.href = url;
            a.download = `teklif_master_yedek_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setShowExportWarning(false);
            toast.success(t('backupDownloadedAll'));
        } catch (error) {
            Logger.error('Error exporting data:', error);
            toast.error(t('backupExportError'));
        }
    };

    const normalizeAndValidateBackup = (data: unknown): { schemaVersion: number; stores: Record<string, unknown[]> } => {
        if (!data || typeof data !== 'object') {
            throw new Error('Geçersiz dosya: JSON formatı geçersiz');
        }

        // Case 1: Plain Array (e.g. exported customers or products list)
        if (Array.isArray(data)) {
            const first = data[0] as Record<string, unknown> | undefined;
            if (first && ('company' in first || 'taxNumber' in first || 'taxOffice' in first)) {
                return { schemaVersion: BACKUP_SCHEMA_VERSION, stores: { customers: data } };
            }
            if (first && ('price' in first || 'unit' in first || 'taxRate' in first)) {
                return { schemaVersion: BACKUP_SCHEMA_VERSION, stores: { products: data } };
            }
            return { schemaVersion: BACKUP_SCHEMA_VERSION, stores: { quotes: data } };
        }

        const obj = data as Record<string, unknown>;

        // Case 2: Standard backup with schemaVersion and stores
        if (obj.stores && typeof obj.stores === 'object' && !Array.isArray(obj.stores)) {
            const version = typeof obj.schemaVersion === 'number' ? obj.schemaVersion : 1;
            if (version > BACKUP_SCHEMA_VERSION) {
                throw new Error(`Bu yedek (sürüm ${version}) mevcut uygulama (sürüm ${BACKUP_SCHEMA_VERSION}) için çok yeni.`);
            }
            return {
                schemaVersion: version,
                stores: obj.stores as Record<string, unknown[]>
            };
        }

        // Case 3: Direct store mapping { customers: [...], products: [...] }
        const stores: Record<string, unknown[]> = {};
        for (const store of ALL_STORES) {
            if (Array.isArray(obj[store])) {
                stores[store] = obj[store] as unknown[];
            }
        }
        if (Object.keys(stores).length > 0) {
            return { schemaVersion: BACKUP_SCHEMA_VERSION, stores };
        }

        throw new Error('Geçersiz yedek dosyası: Tanınan veri deposu bulunamadı');
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const inputEl = e.target;
        if (file.size > 50 * 1024 * 1024) {
            toast.error(t('fileTooLarge'));
            inputEl.value = '';
            return;
        }

        setImportFile(file);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const parsed = JSON.parse((event.currentTarget as FileReader).result as string);
                const data = normalizeAndValidateBackup(parsed);

                const allOperations: Array<{ store: string; action: 'clear' | 'put' | 'tryAdd'; item?: unknown }> = [];

                if (importMode === 'replace') {
                    for (const store of ALL_STORES) {
                        if (!EXCLUDED_IMPORT_STORES.includes(store)) {
                            allOperations.push({ store, action: 'clear' });
                        }
                    }
                }

                for (const [store, items] of Object.entries(data.stores)) {
                    if (EXCLUDED_IMPORT_STORES.includes(store)) continue;
                    if (!Array.isArray(items)) continue;

                    for (const item of items) {
                        if (item && typeof item === 'object') {
                            if (importMode === 'missing') {
                                allOperations.push({ store, action: 'tryAdd', item });
                            } else {
                                allOperations.push({ store, action: 'put', item });
                            }
                        }
                    }
                }

                for (const op of allOperations) {
                    if (op.action === 'clear') {
                        await (db).clear(op.store);
                    } else if (op.action === 'put') {
                        await (db).put(op.store, op.item);
                    } else if (op.action === 'tryAdd') {
                        try {
                            await (db).add(op.store, op.item);
                        } catch {
                            // Skip duplicates silently
                        }
                    }
                }

                toast.success(t('dataImported'));
                loadStats();
                window.dispatchEvent(new CustomEvent('db-imported'));
                toast(t('backupWarning'), { duration: 5000, icon: '⚠️' });
            } catch (error) {
                Logger.error('Error importing data:', error);
                toast.error((error as Error).message || t('importErrorInvalid'));
            } finally {
                setImportFile(null);
                inputEl.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('dbManagement')} size="lg">
            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-[var(--color-bg-muted)] p-4 rounded-[var(--radius)] text-center border border-[var(--color-border)]">
                        <div className="text-2xl font-bold text-[var(--color-info)]">{stats.customers}</div>
                        <div className="text-sm text-[var(--color-text-muted)]">{t('customers')}</div>
                    </div>
                    <div className="bg-[var(--color-bg-muted)] p-4 rounded-[var(--radius)] text-center border border-[var(--color-border)]">
                        <div className="text-2xl font-bold text-[var(--color-success)]">{stats.products}</div>
                        <div className="text-sm text-[var(--color-text-muted)]">{t('products')}</div>
                    </div>
                    <div className="bg-[var(--color-bg-muted)] p-4 rounded-[var(--radius)] text-center border border-[var(--color-border)]">
                        <div className="text-2xl font-bold text-[var(--color-text)]">{stats.quotes}</div>
                        <div className="text-sm text-[var(--color-text-muted)]">{t('quotes')}</div>
                    </div>
                    <div className="bg-[var(--color-bg-muted)] p-4 rounded-[var(--radius)] text-center border border-[var(--color-border)]">
                        <div className="text-2xl font-bold text-[var(--color-warning)]">{stats.templates}</div>
                        <div className="text-sm text-[var(--color-text-muted)]">{t('templates')}</div>
                    </div>
                    <div className="bg-[var(--color-bg-muted)] p-4 rounded-[var(--radius)] text-center border border-[var(--color-border)]">
                        <div className="text-2xl font-bold text-[var(--color-info)]">{stats.banks}</div>
                        <div className="text-sm text-[var(--color-text-muted)]">{t('banks')}</div>
                    </div>
                </div>

                {/* Export Warning Banner */}
                {showExportWarning && (
                    <div className="bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-[var(--color-warning)] shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="font-semibold text-[var(--color-warning)]">{t('securityWarning')}</p>
                                <p className="text-sm text-[var(--color-warning)] mt-1">
                                    {t('securityWarningText')}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowExportWarning(false)}>{t('cancelExport')}</button>
                            <button type="button" className="btn btn-sm btn-primary" onClick={handleExport}>{t('understoodExport')}</button>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="border-t border-[var(--color-border)] pt-6">
                    <h4 className="text-lg font-semibold mb-4 text-[var(--color-text)]">{t('dataOperations')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button type="button" className="btn btn-outline flex items-center justify-center gap-2" onClick={handleExport}>
                            <Download size={18} /> {t('exportAllData')}
                        </button>
                        <div className="relative">
                            <input
                                type="file"
                                id="dbImport"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={handleImport}
                            />
                            <button type="button"
                                className="btn btn-outline w-full flex items-center justify-center gap-2"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={18} /> {t('importData')}
                            </button>
                        </div>

                        {/* Import Mode Selection */}
                        <div className="md:col-span-2 flex flex-wrap gap-2 items-center text-sm">
                            <span className="text-[var(--color-text-muted)]">{t('importMode')}</span>
                            {([
                                { value: 'replace', label: t('replaceMode') },
                                { value: 'merge', label: t('mergeMode') },
                                { value: 'missing', label: t('missingMode') }
                            ] as const).map(option => (
                                <button type="button"
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

                        <button type="button" className="btn btn-outline flex items-center justify-center gap-2" onClick={loadStats}>
                            <RefreshCw size={18} /> {t('refreshStats')}
                        </button>
                        <button type="button" className="btn btn-danger flex items-center justify-center gap-2" onClick={handleClearData}>
                            <Trash size={18} /> {t('clearAllData')}
                        </button>
                    </div>

                    {/* Clear Confirmation Input */}
                    <div className="mt-4 p-3 bg-[var(--color-error)]/10 border border-[var(--color-border)] rounded-lg">
                        <label className="text-xs font-medium text-[var(--color-error)]">
                            {t('clearDataHint')}
                        </label>
                        <div className="flex gap-2 mt-1">
                            <input
                                type="text"
                                className="form-control text-sm flex-1"
                                placeholder={t('clearDataConfirm')}
                                value={clearConfirmText}
                                onChange={(e) => setClearConfirmText(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} variant={confirmDialog.variant} />
        </Modal>
    );
};

export default DatabaseManagerModal;
