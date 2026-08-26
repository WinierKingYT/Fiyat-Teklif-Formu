import { parseBackupStores } from '@/utils/backupValidation';
import { getLocalDateString } from '@/utils/dateUtils';
import type { IndexedDBManager } from '@/context/quote/types';

type BackupData = Record<string, unknown>;

const LEGACY_STORE_MAP: Record<string, string> = {
    customers: 'customers',
    products: 'products',
    quotes: 'quotes',
    templates: 'templates',
    banks: 'bankInfo',
    bankInfo: 'bankInfo',
    quoteVersions: 'quoteVersions',
    settings: 'settings',
};

const toStores = (value: unknown): Record<string, unknown[]> => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error('Yedek dosyasının kök değeri bir nesne olmalıdır.');
    }

    const data = value as BackupData;
    if ('stores' in data) return parseBackupStores(data);

    const stores: Record<string, unknown[]> = {};
    for (const [legacyName, storeName] of Object.entries(LEGACY_STORE_MAP)) {
        const records = data[legacyName];
        if (records !== undefined) stores[storeName] = records as unknown[];
    }
    return parseBackupStores(stores);
};

export const createLegacyBackup = async (db: IndexedDBManager): Promise<void> => {
    const [customers, products, quotes, templates, banks, quoteVersions, settings] = await Promise.all([
        db.getAll('customers'),
        db.getAll('products'),
        db.getAll('quotes'),
        db.getAll('templates'),
        db.getAll('bankInfo'),
        db.getAll('quoteVersions').catch(() => []),
        db.getAll('settings').catch(() => []),
    ]);
    const data = {
        customers,
        products,
        quotes,
        templates,
        banks,
        quoteVersions,
        settings,
        exportDate: new Date().toISOString(),
        version: '2.4',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `teklifmaster_backup_${getLocalDateString()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const restoreBackupFile = async (db: IndexedDBManager, file: File): Promise<number> => {
    const parsed = JSON.parse(await file.text()) as unknown;
    return db.restoreStores(toStores(parsed));
};
