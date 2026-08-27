// IndexedDB Manager Utility
import Logger from '@/utils/logger';

class IndexedDBManager {
    private dbName: string;
    private version: number;
    private db: IDBDatabase | null;
    private isInitialized: boolean;
    private initializationPromise: Promise<IDBDatabase> | null;
    private isConnectionOpen: boolean;

    constructor() {
        this.dbName = 'TeklifMasterDB';
        this.version = this.calculateVersion('2.5.0'); // Bumped version for audit log store
        this.db = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.isConnectionOpen = false;
    }


    calculateVersion(appVersion: string): number {
        const parts = appVersion.split('.').map(Number);
        return parts[0] * 10000 + parts[1] * 100 + parts[2];
    }

    closeConnection(): void {
        if (this.db) {
            try {
                this.db.close();
            } catch (err) {
                Logger.error('Error closing IndexedDB connection:', err);
            }
            this.db = null;
        }
        this.isConnectionOpen = false;
        this.isInitialized = false;
        this.initializationPromise = null;
    }

    async initialize(): Promise<IDBDatabase | null> {
        if (this.isInitialized && this.isConnectionOpen && this.db) return this.db;

        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = new Promise((resolve, reject) => {
            Logger.log('IndexedDB başlatılıyor...');

            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                Logger.error('IndexedDB açılamadı:', request.error);
                this.closeConnection();
                reject(new Error(`IndexedDB açılamadı: ${request.error}`));
            };

            request.onsuccess = () => {
                Logger.log('IndexedDB başarıyla açıldı');
                this.db = request.result;
                this.isInitialized = true;
                this.isConnectionOpen = true;

                this.db.onerror = (event) => {
                    Logger.error('Database error:', (event.target as { error?: DOMException | null }).error);
                };

                this.db.onclose = () => {
                    Logger.warn('Database connection closed');
                    this.closeConnection();
                };

                this.db.onversionchange = () => {
                    Logger.warn('IndexedDB version changed in another tab/connection. Closing connection to allow upgrade.');
                    this.closeConnection();
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('db-version-change'));
                    }
                };

                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                Logger.log('Database upgrade başlatılıyor...');
                this.handleUpgrade((event.target as IDBOpenDBRequest).result, event.oldVersion);
            };

            request.onblocked = () => {
                Logger.warn('Database upgrade blocked by other connections');
                this.closeConnection();
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('db-blocked'));
                }
                reject(new Error('Database upgrade blocked'));
            };
        });

        return this.initializationPromise;
    }

    handleUpgrade(db: IDBDatabase, oldVersion: number): void {
        Logger.log(`Database upgrading from version ${oldVersion} to ${this.version}`);

        const migrations = [
            { version: 1, migrate: (d: IDBDatabase) => this.createInitialStores(d) },
            { version: 2, migrate: (d: IDBDatabase) => this.addPreviewDataStore(d) },
            { version: 3, migrate: (d: IDBDatabase) => this.addFormStateStore(d) },
            { version: 4, migrate: (d: IDBDatabase) => this.addSettingsStore(d) },
            { version: 5, migrate: (d: IDBDatabase) => this.addBankInfoStore(d) },
            { version: 20300, migrate: (d: IDBDatabase) => this.addRecycleBinStore(d) },
            { version: 20400, migrate: (d: IDBDatabase) => this.addQuoteVersionsStore(d) },
            { version: 20500, migrate: (d: IDBDatabase) => this.addAuditLogStore(d) },
        ];


        migrations
            .filter(migration => migration.version > oldVersion)
            .forEach(migration => {
                try {
                    Logger.log(`Migration v${migration.version} uygulanıyor...`);
                    migration.migrate(db);
                } catch (error) {
                    Logger.error(`Migration v${migration.version} failed:`, error);
                    throw error;
                }
            });
    }

    createInitialStores(db: IDBDatabase): void {
        const stores = [
            { name: 'customers', indexes: ['name', 'company', 'email', 'lastUsed'] },
            { name: 'products', indexes: ['name', 'category', 'price'] },
            { name: 'quotes', indexes: ['quoteNumber', 'customerName', 'createdAt', 'status', 'totalAmount'] },
            { name: 'drafts', indexes: ['quoteNumber', 'customerName', 'createdAt', 'status'] },
            { name: 'templates', indexes: ['name', 'createdAt'] }
        ];

        stores.forEach(({ name, indexes }) => {
            if (!db.objectStoreNames.contains(name)) {
                const store = db.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
                indexes.forEach(index => {
                    store.createIndex(index, index, { unique: false });
                });
                Logger.log(`Store oluşturuldu: ${name}`);
            }
        });
    }

    addPreviewDataStore(db: IDBDatabase): void {
        if (!db.objectStoreNames.contains('previewData')) {
            const store = db.createObjectStore('previewData', { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            Logger.log('PreviewData store oluşturuldu');
        }
    }

    addFormStateStore(db: IDBDatabase): void {
        if (!db.objectStoreNames.contains('formState')) {
            const store = db.createObjectStore('formState', { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            Logger.log('FormState store oluşturuldu');
        }
    }

    addSettingsStore(db: IDBDatabase): void {
        if (!db.objectStoreNames.contains('settings')) {
            const store = db.createObjectStore('settings', { keyPath: 'id' });
            store.createIndex('key', 'key', { unique: true });
            Logger.log('Settings store oluşturuldu');
        }
    }

    addBankInfoStore(db: IDBDatabase): void {
        if (!db.objectStoreNames.contains('bankInfo')) {
            const store = db.createObjectStore('bankInfo', { keyPath: 'id', autoIncrement: true });
            store.createIndex('bankName', 'bankName', { unique: false });
            Logger.log('BankInfo store oluşturuldu');
        }
    }

    addRecycleBinStore(db: IDBDatabase): void {
        if (!db.objectStoreNames.contains('recycle_bin')) {
            const store = db.createObjectStore('recycle_bin', { keyPath: 'id', autoIncrement: true });
            store.createIndex('originalStore', 'originalStore', { unique: false });
            store.createIndex('deletedAt', 'deletedAt', { unique: false });
            store.createIndex('name', 'name', { unique: false });
            Logger.log('RecycleBin store oluşturuldu');
        }
    }

    addQuoteVersionsStore(db: IDBDatabase): void {
        if (!db.objectStoreNames.contains('quoteVersions')) {
            const store = db.createObjectStore('quoteVersions', { keyPath: 'versionId' });
            store.createIndex('quoteId', 'quoteId', { unique: false });
            store.createIndex('createdAt', 'createdAt', { unique: false });
            Logger.log('QuoteVersions store oluşturuldu');
        }
    }

    addAuditLogStore(db: IDBDatabase): void {
        if (!db.objectStoreNames.contains('auditLog')) {
            const store = db.createObjectStore('auditLog', { keyPath: 'id', autoIncrement: true });
            store.createIndex('createdAt', 'createdAt', { unique: false });
            store.createIndex('action', 'action', { unique: false });
            store.createIndex('entityType', 'entityType', { unique: false });
            Logger.log('AuditLog store oluşturuldu');
        }
    }

    private hasAuditLogStore(): boolean {
        return !!this.db?.objectStoreNames.contains('auditLog');
    }

    private deriveAuditEntityName(value: unknown): string | undefined {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

        const record = value as Record<string, unknown>;
        const nestedData = record.data && typeof record.data === 'object' && !Array.isArray(record.data)
            ? record.data as Record<string, unknown>
            : undefined;
        const nestedQuoteData = nestedData?.quoteData && typeof nestedData.quoteData === 'object' && !Array.isArray(nestedData.quoteData)
            ? nestedData.quoteData as Record<string, unknown>
            : undefined;
        const nestedCustomerData = nestedData?.customerData && typeof nestedData.customerData === 'object' && !Array.isArray(nestedData.customerData)
            ? nestedData.customerData as Record<string, unknown>
            : undefined;
        const candidates = [
            record.name,
            record.quoteNumber,
            record.customerName,
            record.company,
            record.bankName,
            record.accountHolder,
            nestedData?.name,
            nestedData?.quoteNumber,
            nestedQuoteData?.number,
            nestedQuoteData?.title,
            nestedCustomerData?.name,
            nestedCustomerData?.company,
        ];

        const label = candidates.find(candidate => typeof candidate === 'string' && candidate.trim().length > 0);
        return typeof label === 'string' ? label.trim().slice(0, 120) : undefined;
    }

    private createAuditRecord(
        action: 'delete' | 'moved_to_recycle_bin' | 'restore' | 'permanent_delete' | 'empty_recycle_bin' | 'restore_backup',
        entityType: string,
        entityId?: IDBValidKey,
        entityName?: string,
    ): Record<string, unknown> {
        return {
            action,
            entityType,
            ...(entityId !== undefined ? { entityId } : {}),
            ...(entityName ? { entityName } : {}),
            createdAt: new Date().toISOString(),
        };
    }

    private notifyAuditLogUpdated(): void {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('audit-log-updated'));
        }
    }

    async ensureConnection() {
        if (!this.isInitialized || !this.isConnectionOpen) {
            Logger.log('Database bağlantısı yeniden kuruluyor...');
            await this.initialize();
        }
        return this.db!;
    }

    async get<T = unknown>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
        await this.ensureConnection();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(key);

                request.onsuccess = () => {
                    resolve(request.result);
                };
                request.onerror = () => {
                    Logger.error(`${storeName} get işlemi hatası:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                Logger.error(`${storeName} get işlemi exception:`, error);
                reject(error);
            }
        });
    }

    async getByIndex<T = unknown>(storeName: string, indexName: string, key: IDBValidKey): Promise<T | undefined> {
        await this.ensureConnection();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                const request = index.get(key);

                request.onsuccess = () => {
                    resolve(request.result);
                };
                request.onerror = () => {
                    Logger.error(`${storeName} getByIndex işlemi hatası:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                Logger.error(`${storeName} getByIndex işlemi exception:`, error);
                reject(error);
            }
        });
    }

    async getAllByIndex<T = unknown>(storeName: string, indexName: string, query?: IDBValidKey | IDBKeyRange): Promise<T[]> {
        await this.ensureConnection();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                const request = query !== undefined ? index.getAll(query) : index.getAll();

                request.onsuccess = () => {
                    resolve(request.result || []);
                };
                request.onerror = () => {
                    Logger.error(`${storeName} getAllByIndex işlemi hatası:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                Logger.error(`${storeName} getAllByIndex işlemi exception:`, error);
                reject(error);
            }
        });
    }

    async getAll<T = unknown>(storeName: string, indexName: string | null = null): Promise<T[]> {
        await this.ensureConnection();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                let request;

                if (indexName) {
                    const index = store.index(indexName);
                    request = index.getAll();
                } else {
                    request = store.getAll();
                }

                request.onsuccess = () => {
                    resolve(request.result || []);
                };
                request.onerror = () => {
                    Logger.error(`${storeName} getAll işlemi hatası:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                Logger.error(`${storeName} getAll işlemi exception:`, error);
                reject(error);
            }
        });
    }

    async add<T = unknown>(storeName: string, data: T): Promise<unknown> {
        this.validateData(storeName, data);
        await this.ensureConnection();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);

                const sanitized = this.sanitizeData(data) as Record<string, unknown>;
                const now = new Date().toISOString();
                const item = {
                    ...sanitized,
                    createdAt: (sanitized.createdAt as string) || now,
                    updatedAt: (sanitized.updatedAt as string) || now,
                    version: this.version
                };

                const request = store.add(item);

                request.onsuccess = () => {
                    resolve(request.result);
                };
                request.onerror = () => {
                    Logger.error(`${storeName} add işlemi hatası:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                Logger.error(`${storeName} add işlemi exception:`, error);
                reject(error);
            }
        });
    }

    async put<T = unknown>(storeName: string, data: T): Promise<unknown> {
        this.validateData(storeName, data);
        await this.ensureConnection();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);

                const sanitized = this.sanitizeData(data) as Record<string, unknown>;
                const now = new Date().toISOString();
                const item = {
                    ...sanitized,
                    updatedAt: (sanitized.updatedAt as string) || now,
                    version: this.version
                };

                const request = store.put(item);

                request.onsuccess = () => {
                    resolve(request.result);
                };
                request.onerror = () => {
                    Logger.error(`${storeName} put işlemi hatası:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                Logger.error(`${storeName} put işlemi exception:`, error);
                reject(error);
            }
        });
    }

    async restoreStores(
        stores: Record<string, unknown[]>,
        options?: { mode?: 'replace' | 'merge' }
    ): Promise<number> {
        await this.ensureConnection();

        const mode = options?.mode || 'replace';
        const entries = Object.entries(stores);
        if (entries.length === 0) {
            throw new Error('Geri yüklenecek veri bulunamadı.');
        }

        for (const [storeName, items] of entries) {
            if (!this.db!.objectStoreNames.contains(storeName)) {
                throw new Error(`Bilinmeyen veri alanı: ${storeName}`);
            }
            if (!Array.isArray(items) || items.some(item => typeof item !== 'object' || item === null || Array.isArray(item))) {
                throw new Error(`${storeName} kayıtları geçersiz.`);
            }
        }

        return new Promise((resolve, reject) => {
            const storeNames = entries.map(([storeName]) => storeName);
            const includeAuditLog = this.hasAuditLogStore() && !storeNames.includes('auditLog');
            const transactionStoreNames = includeAuditLog ? [...storeNames, 'auditLog'] : storeNames;
            const transaction = this.db!.transaction(transactionStoreNames, 'readwrite');
            const defaultUpdatedAt = new Date().toISOString();
            let restoredCount = 0;

            transaction.oncomplete = () => {
                if (includeAuditLog) this.notifyAuditLogUpdated();
                resolve(restoredCount);
            };
            transaction.onerror = () => reject(transaction.error || new Error('Yedek geri yükleme işlemi başarısız oldu.'));
            transaction.onabort = () => reject(transaction.error || new Error('Yedek geri yükleme işlemi geri alındı.'));

            try {
                entries.forEach(([storeName, items]) => {
                    const store = transaction.objectStore(storeName);
                    if (mode === 'replace') {
                        store.clear();
                    }
                    items.forEach(item => {
                        const sanitizedItem = this.sanitizeData(item) as Record<string, unknown>;
                        store.put({
                            ...sanitizedItem,
                            updatedAt: (sanitizedItem.updatedAt as string) || defaultUpdatedAt,
                            version: this.version,
                        });
                        restoredCount += 1;
                    });
                });
                if (includeAuditLog) {
                    transaction.objectStore('auditLog').add(this.createAuditRecord(
                        'restore_backup',
                        'backup',
                        undefined,
                        `${restoredCount} kayıt`,
                    ));
                }
            } catch (error) {
                transaction.abort();
                reject(error);
            }
        });
    }

    async restoreRecycleBinItem(item: {
        id: IDBValidKey;
        originalStore: string;
        originalId?: IDBValidKey;
        deletedAt?: string;
        deletedBy?: string;
        data?: unknown;
        [key: string]: unknown;
    }): Promise<void> {
        return this.restoreManyRecycleBinItems([item]);
    }

    async restoreManyRecycleBinItems(items: Array<{
        id: IDBValidKey;
        originalStore: string;
        originalId?: IDBValidKey;
        deletedAt?: string;
        deletedBy?: string;
        data?: unknown;
        [key: string]: unknown;
    }>): Promise<void> {
        await this.ensureConnection();

        if (items.length === 0) {
            return;
        }

        const sourceStores = [...new Set(items.map(item => item.originalStore))];
        if (sourceStores.includes('recycle_bin') || sourceStores.includes('auditLog')) {
            throw new Error('Çöp kutusu öğesi doğrudan tekrar geri yüklenemez.');
        }
        if (!this.db!.objectStoreNames.contains('recycle_bin') || sourceStores.some(storeName => !this.db!.objectStoreNames.contains(storeName))) {
            const missingStore = sourceStores.find(storeName => !this.db!.objectStoreNames.contains(storeName));
            throw new Error(missingStore ? `Bilinmeyen veri alanı: ${missingStore}` : 'Çöp kutusu veri alanı bulunamadı.');
        }

        const restoredItems = items.map(item => {
            const restoredData = item.data && typeof item.data === 'object' && !Array.isArray(item.data)
                ? { ...(item.data as Record<string, unknown>) }
                : (() => {
                    const {
                        id: _id,
                        originalStore: _originalStore,
                        deletedAt: _deletedAt,
                        deletedBy: _deletedBy,
                        originalId: _originalId,
                        data: _data,
                        ...originalData
                    } = item;
                    return { ...originalData };
                })();

            const targetId = item.originalId ?? restoredData.id;
            if (targetId === undefined || targetId === null) {
                delete restoredData.id;
            } else {
                restoredData.id = targetId;
            }

            return {
                storeName: item.originalStore,
                recycleBinKey: item.id,
                entityId: (targetId ?? item.id) as IDBValidKey,
                entityName: this.deriveAuditEntityName(item),
                data: this.sanitizeData(restoredData) as Record<string, unknown>,
            };
        });

        return new Promise((resolve, reject) => {
            let settled = false;
            const succeed = () => {
                if (!settled) {
                    settled = true;
                    resolve();
                }
            };
            const fail = (error: unknown) => {
                if (!settled) {
                    settled = true;
                    if (error instanceof Error) {
                        reject(error);
                    } else if (error && typeof error === 'object' && 'message' in error) {
                        reject(new Error(String((error as { message: unknown }).message)));
                    } else {
                        reject(new Error('Çöp kutusu öğesi geri yüklenemedi.'));
                    }
                }
            };

            let transaction: IDBTransaction | null = null;
            try {
                const includeAuditLog = this.hasAuditLogStore();
                const transactionStores = [...sourceStores, 'recycle_bin', ...(includeAuditLog ? ['auditLog'] : [])];
                const activeTransaction = this.db!.transaction(transactionStores, 'readwrite');
                transaction = activeTransaction;
                activeTransaction.oncomplete = () => {
                    if (includeAuditLog) this.notifyAuditLogUpdated();
                    succeed();
                };
                activeTransaction.onerror = () => fail(activeTransaction.error || new Error('Çöp kutusu öğesi geri yüklenemedi.'));
                activeTransaction.onabort = () => fail(activeTransaction.error || new Error('Çöp kutusu geri yükleme işlemi geri alındı.'));

                restoredItems.forEach(({ storeName, data }) => activeTransaction.objectStore(storeName).put(data));
                const recycleBinStore = activeTransaction.objectStore('recycle_bin');
                restoredItems.forEach(({ recycleBinKey }) => recycleBinStore.delete(recycleBinKey));
                if (includeAuditLog) {
                    const auditStore = activeTransaction.objectStore('auditLog');
                    restoredItems.forEach(({ storeName, entityId, entityName }) => {
                        auditStore.add(this.createAuditRecord('restore', storeName, entityId, entityName));
                    });
                }
            } catch (error) {
                try {
                    transaction?.abort();
                } catch {
                    // The transaction may already be inactive after a request error.
                }
                fail(error);
            }
        });
    }

    async moveToRecycleBin(
        storeName: string,
        key: IDBValidKey,
        recycleData: object,
        options?: { deletedBy?: string }
    ): Promise<void> {
        return this.moveManyToRecycleBin([{ storeName, key, recycleData }], options);
    }

    async moveManyToRecycleBin(
        items: Array<{ storeName: string; key: IDBValidKey; recycleData: object }>,
        options?: { deletedBy?: string }
    ): Promise<void> {
        await this.ensureConnection();

        if (items.length === 0) {
            return;
        }

        const sourceStores = [...new Set(items.map(item => item.storeName))];
        if (sourceStores.includes('recycle_bin') || sourceStores.includes('auditLog')) {
            throw new Error('Çöp kutusu öğesi tekrar çöp kutusuna taşınamaz.');
        }
        if (!this.db!.objectStoreNames.contains('recycle_bin') || sourceStores.some(storeName => !this.db!.objectStoreNames.contains(storeName))) {
            const missingStore = sourceStores.find(storeName => !this.db!.objectStoreNames.contains(storeName));
            throw new Error(`Silme işlemi için veri alanı bulunamadı: ${missingStore || 'recycle_bin'}`);
        }

        const deletedAt = new Date().toISOString();
        const recycleRecords = items.map(({ storeName, key, recycleData }) => {
            if (!recycleData || typeof recycleData !== 'object' || Array.isArray(recycleData)) {
                throw new Error(`Çöp kutusu kaydı geçersiz: ${storeName}`);
            }
            const { id: _sourceId, ...recordData } = recycleData as Record<string, unknown>;
            return {
                ...recordData,
                originalStore: storeName,
                originalId: key,
                deletedAt,
                ...(options?.deletedBy ? { deletedBy: options.deletedBy } : {}),
                storeName,
                key,
                entityName: this.deriveAuditEntityName(recycleData),
            };
        });

        return new Promise((resolve, reject) => {
            let settled = false;
            const succeed = () => {
                if (!settled) {
                    settled = true;
                    resolve();
                }
            };
            const fail = (error: unknown) => {
                if (!settled) {
                    settled = true;
                    if (error instanceof Error) {
                        reject(error);
                    } else if (error && typeof error === 'object' && 'message' in error) {
                        reject(new Error(String((error as { message: unknown }).message)));
                    } else {
                        reject(new Error('Öğe çöp kutusuna taşınamadı.'));
                    }
                }
            };

            try {
                const includeAuditLog = this.hasAuditLogStore();
                const transactionStores = [...sourceStores, 'recycle_bin', ...(includeAuditLog ? ['auditLog'] : [])];
                const transaction = this.db!.transaction(transactionStores, 'readwrite');
                transaction.oncomplete = () => {
                    if (includeAuditLog) this.notifyAuditLogUpdated();
                    succeed();
                };
                transaction.onerror = () => fail(transaction.error || new Error('Öğe çöp kutusuna taşınamadı.'));
                transaction.onabort = () => fail(transaction.error || new Error('Öğe taşıma işlemi geri alındı.'));

                const recycleBinStore = transaction.objectStore('recycle_bin');
                recycleRecords.forEach(({ storeName: _storeName, key: _key, entityName: _entityName, ...record }) => {
                    recycleBinStore.add(this.sanitizeData(record));
                });
                items.forEach(({ storeName, key }) => transaction.objectStore(storeName).delete(key));
                if (includeAuditLog) {
                    const auditStore = transaction.objectStore('auditLog');
                    recycleRecords.forEach(({ storeName, key, entityName }) => {
                        auditStore.add(this.createAuditRecord('moved_to_recycle_bin', storeName, key, entityName));
                    });
                }
            } catch (error) {
                fail(error);
            }
        });
    }

    async delete(storeName: string, key: IDBValidKey): Promise<void> {
        await this.ensureConnection();

        return new Promise((resolve, reject) => {
            try {
                const includeAuditLog = storeName !== 'auditLog' && this.hasAuditLogStore();
                const transactionStores = [storeName, ...(includeAuditLog ? ['auditLog'] : [])];
                const transaction = this.db!.transaction(transactionStores, 'readwrite');
                const store = transaction.objectStore(storeName);
                transaction.oncomplete = () => {
                    if (includeAuditLog) this.notifyAuditLogUpdated();
                    resolve(undefined);
                };
                transaction.onerror = () => reject(transaction.error || new Error(`${storeName} silme işlemi başarısız oldu.`));
                transaction.onabort = () => reject(transaction.error || new Error(`${storeName} silme işlemi geri alındı.`));

                store.delete(key);
                if (includeAuditLog) {
                    transaction.objectStore('auditLog').add(this.createAuditRecord(
                        storeName === 'recycle_bin' ? 'permanent_delete' : 'delete',
                        storeName,
                        key,
                    ));
                }
            } catch (error) {
                Logger.error(`${storeName} delete işlemi exception:`, error);
                reject(error);
            }
        });
    }

    async clear(storeName: string): Promise<void> {
        await this.ensureConnection();

        return new Promise((resolve, reject) => {
            try {
                const includeAuditLog = storeName === 'recycle_bin' && this.hasAuditLogStore();
                const transactionStores = [storeName, ...(includeAuditLog ? ['auditLog'] : [])];
                const transaction = this.db!.transaction(transactionStores, 'readwrite');
                const store = transaction.objectStore(storeName);
                transaction.oncomplete = () => {
                    if (includeAuditLog) this.notifyAuditLogUpdated();
                    resolve(undefined);
                };
                transaction.onerror = () => reject(transaction.error || new Error(`${storeName} temizleme işlemi başarısız oldu.`));
                transaction.onabort = () => reject(transaction.error || new Error(`${storeName} temizleme işlemi geri alındı.`));

                store.clear();
                if (includeAuditLog) {
                    transaction.objectStore('auditLog').add(this.createAuditRecord('empty_recycle_bin', 'recycle_bin'));
                }
            } catch (error) {
                Logger.error(`${storeName} clear işlemi exception:`, error);
                reject(error);
            }
        });
    }

    validateData(storeName: string, data: unknown): boolean {
        // Validation logic can be expanded here
        return !!storeName && !!data;
    }

    sanitizeData<T>(data: T): T {
        if (typeof data === 'object' && data !== null) {
            return { ...data };
        }
        return data;
    }
}

const indexedDBManager = new IndexedDBManager();
export default indexedDBManager;
