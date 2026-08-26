export const BACKUP_SCHEMA_VERSION = 3;

export const BACKUP_STORE_NAMES = [
    'customers',
    'products',
    'quotes',
    'templates',
    'bankInfo',
    'settings',
    'recycle_bin',
    'drafts',
    'quoteVersions',
] as const;

const BACKUP_STORE_NAME_SET = new Set<string>(BACKUP_STORE_NAMES);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseBackupStores = (value: unknown): Record<string, unknown[]> => {
    if (!isRecord(value)) {
        throw new Error('Yedek dosyasının kök değeri bir nesne olmalıdır.');
    }

    const hasSchemaVersion = 'schemaVersion' in value;
    if (hasSchemaVersion) {
        const version = value.schemaVersion;
        if (!Number.isInteger(version) || Number(version) < 1 || Number(version) > BACKUP_SCHEMA_VERSION) {
            throw new Error('Yedek dosyası desteklenmeyen bir şema sürümü kullanıyor.');
        }
    }

    const rawStores = 'stores' in value ? value.stores : value;
    if (!isRecord(rawStores)) {
        throw new Error('Yedek dosyasında geçerli bir stores nesnesi bulunamadı.');
    }

    const entries = Object.entries(rawStores);
    if (entries.length === 0) {
        throw new Error('Yedek dosyasında geri yüklenecek veri bulunamadı.');
    }

    // Schema v3 requires a complete snapshot containing all canonical stores
    if (hasSchemaVersion && value.schemaVersion === BACKUP_SCHEMA_VERSION) {
        const missingStores = BACKUP_STORE_NAMES.filter(name => !(name in rawStores));
        if (missingStores.length > 0) {
            throw new Error(`Yedek dosyasında eksik veri alanları var: ${missingStores.join(', ')}`);
        }
    }

    const stores: Record<string, unknown[]> = {};
    for (const [storeName, items] of entries) {
        if (!BACKUP_STORE_NAME_SET.has(storeName)) {
            throw new Error(`Yedek dosyasında desteklenmeyen veri alanı var: ${storeName}`);
        }
        if (!Array.isArray(items) || items.some(item => !isRecord(item))) {
            throw new Error(`Yedek dosyasındaki ${storeName} kayıtları geçersiz.`);
        }
        stores[storeName] = items;
    }

    // For legacy backups (direct-store shape or schemaVersion < 3), normalize into full canonical snapshot
    for (const storeName of BACKUP_STORE_NAMES) {
        if (!stores[storeName]) {
            stores[storeName] = [];
        }
    }

    return stores;
};
