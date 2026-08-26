// IndexedDB Manager Utility
import Logger from '@/utils/logger';

class IndexedDBManager {
    private dbName: string;
    private version: number;
    private db: IDBDatabase | null;
    private isInitialized: boolean;
    private initializationPromise: Promise<IDBDatabase> | null;
    private isConnectionOpen: boolean;
    private writeCache: unknown;

    constructor() {
        this.dbName = 'TeklifMasterDB';
        this.version = this.calculateVersion('2.4.0'); // Bumped version for quoteVersions store
        this.db = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.isConnectionOpen = false;
        this.writeCache = null;
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

                const item = {
                    ...this.sanitizeData(data),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
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

                const item = {
                    ...this.sanitizeData(data),
                    updatedAt: new Date().toISOString(),
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

    async restoreStores(stores: Record<string, unknown[]>): Promise<number> {
        await this.ensureConnection();

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
            const transaction = this.db!.transaction(storeNames, 'readwrite');
            const updatedAt = new Date().toISOString();
            let restoredCount = 0;

            transaction.oncomplete = () => resolve(restoredCount);
            transaction.onerror = () => reject(transaction.error || new Error('Yedek geri yükleme işlemi başarısız oldu.'));
            transaction.onabort = () => reject(transaction.error || new Error('Yedek geri yükleme işlemi geri alındı.'));

            try {
                entries.forEach(([storeName, items]) => {
                    const store = transaction.objectStore(storeName);
                    items.forEach(item => {
                        const sanitizedItem = this.sanitizeData(item) as Record<string, unknown>;
                        store.put({
                            ...sanitizedItem,
                            updatedAt,
                            version: this.version,
                        });
                        restoredCount += 1;
                    });
                });
            } catch (error) {
                transaction.abort();
                reject(error);
            }
        });
    }

    async delete(storeName: string, key: IDBValidKey): Promise<void> {
        await this.ensureConnection();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(key);

                request.onsuccess = () => {
                    resolve(undefined);
                };
                request.onerror = () => {
                    Logger.error(`${storeName} delete işlemi hatası:`, request.error);
                    reject(request.error);
                };
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
                const transaction = this.db!.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => {
                    resolve(undefined);
                };
                request.onerror = () => {
                    Logger.error(`${storeName} clear işlemi hatası:`, request.error);
                    reject(request.error);
                };
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
