// IndexedDB Manager Utility
import Logger from './logger';

class IndexedDBManager {
    constructor() {
        this.dbName = 'TeklifMasterDB';
        this.version = this.calculateVersion('2.3.1'); // Bumped version for new store
        this.db = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.isConnectionOpen = false;
        this.writeCache = null;
    }


    calculateVersion(appVersion) {
        const parts = appVersion.split('.').map(Number);
        return parts[0] * 10000 + parts[1] * 100 + parts[2];
    }

    async initialize() {
        if (this.isInitialized && this.isConnectionOpen) return this.db;

        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = new Promise((resolve, reject) => {
            Logger.log('IndexedDB başlatılıyor...');

            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                Logger.error('IndexedDB açılamadı:', request.error);
                this.initializationPromise = null;
                reject(new Error(`IndexedDB açılamadı: ${request.error}`));
            };

            request.onsuccess = () => {
                Logger.log('IndexedDB başarıyla açıldı');
                this.db = request.result;
                this.isInitialized = true;
                this.isConnectionOpen = true;

                this.db.onerror = (event) => {
                    Logger.error('Database error:', event.target.error);
                };

                this.db.onclose = () => {
                    Logger.warn('Database connection closed');
                    this.isConnectionOpen = false;
                };

                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                Logger.log('Database upgrade başlatılıyor...');
                this.handleUpgrade(event.target.result, event.oldVersion);
            };

            request.onblocked = () => {
                Logger.warn('Database upgrade blocked by other connections');
                reject(new Error('Database upgrade blocked'));
            };
        });

        return this.initializationPromise;
    }

    handleUpgrade(db, oldVersion) {
        Logger.log(`Database upgrading from version ${oldVersion} to ${this.version}`);

        const migrations = [
            { version: 1, migrate: (db) => this.createInitialStores(db) },
            { version: 2, migrate: (db) => this.addPreviewDataStore(db) },
            { version: 3, migrate: (db) => this.addFormStateStore(db) },
            { version: 4, migrate: (db) => this.addSettingsStore(db) },
            { version: 5, migrate: (db) => this.addBankInfoStore(db) },
            { version: 20300, migrate: (db) => this.addRecycleBinStore(db) },
            { version: 20301, migrate: (db) => this.addCompanyDefaultsStore(db) }
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

    createInitialStores(db) {
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

    addPreviewDataStore(db) {
        if (!db.objectStoreNames.contains('previewData')) {
            const store = db.createObjectStore('previewData', { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            Logger.log('PreviewData store oluşturuldu');
        }
    }

    addFormStateStore(db) {
        if (!db.objectStoreNames.contains('formState')) {
            const store = db.createObjectStore('formState', { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            Logger.log('FormState store oluşturuldu');
        }
    }

    addSettingsStore(db) {
        if (!db.objectStoreNames.contains('settings')) {
            const store = db.createObjectStore('settings', { keyPath: 'id' });
            store.createIndex('key', 'key', { unique: true });
            Logger.log('Settings store oluşturuldu');
        }
    }

    addBankInfoStore(db) {
        if (!db.objectStoreNames.contains('bankInfo')) {
            const store = db.createObjectStore('bankInfo', { keyPath: 'id' });
            store.createIndex('bankName', 'bankName', { unique: false });
            Logger.log('BankInfo store oluşturuldu');
        }
    }

    addRecycleBinStore(db) {
        if (!db.objectStoreNames.contains('recycle_bin')) {
            const store = db.createObjectStore('recycle_bin', { keyPath: 'id', autoIncrement: true });
            store.createIndex('originalStore', 'originalStore', { unique: false });
            store.createIndex('deletedAt', 'deletedAt', { unique: false });
            store.createIndex('name', 'name', { unique: false });
            Logger.log('RecycleBin store oluşturuldu');
        }
    }

    addCompanyDefaultsStore(db) {
        if (!db.objectStoreNames.contains('company_defaults')) {
            const store = db.createObjectStore('company_defaults', { keyPath: 'id' });
            Logger.log('CompanyDefaults store oluşturuldu');
        }
    }

    async ensureConnection() {
        if (!this.isInitialized || !this.isConnectionOpen) {
            Logger.log('Database bağlantısı yeniden kuruluyor...');
            await this.initialize();
        }
        return this.db;
    }

    async get(storeName, key) {
        await this.ensureConnection();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
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

    async getByIndex(storeName, indexName, key) {
        await this.ensureConnection();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
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

    async getAll(storeName, indexName = null) {
        await this.ensureConnection();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
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

    async add(storeName, data) {
        this.validateData(storeName, data);
        await this.ensureConnection();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
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

    async put(storeName, data) {
        this.validateData(storeName, data);
        await this.ensureConnection();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
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

    async delete(storeName, key) {
        await this.ensureConnection();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(key);

                request.onsuccess = () => {
                    resolve(request.result);
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

    async clear(storeName) {
        await this.ensureConnection();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => {
                    resolve(request.result);
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

    validateData(storeName, data) {
        // Validation logic can be expanded here
        return true;
    }

    sanitizeData(data) {
        const sanitized = { ...data };
        // Basic sanitization
        return sanitized;
    }
}

const indexedDBManager = new IndexedDBManager();
export default indexedDBManager;
