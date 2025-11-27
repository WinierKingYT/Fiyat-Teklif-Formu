// ==================== GELİŞTİRİLMİŞ INDEXEDDB YÖNETİM SİSTEMİ ====================
class IndexedDBManager {
    constructor() {
        this.dbName = 'TeklifMasterDB';
        this.version = this.calculateVersion('2.2.0');
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
            { version: 5, migrate: (db) => this.addBankInfoStore(db) }
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
                    Logger.log(`${storeName} get işlemi başarılı:`, request.result ? 'Veri bulundu' : 'Veri bulunamadı');
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
                    const result = request.result || [];
                    Logger.log(`${storeName} getAll işlemi başarılı: ${result.length} kayıt`);
                    resolve(result);
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
                    Logger.log(`${storeName} add işlemi başarılı:`, request.result);
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
                    Logger.log(`${storeName} put işlemi başarılı:`, request.result);
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

    async optimizedPut(storeName, data) {
        if (this.writeCache && this.writeCache.store === storeName && 
            JSON.stringify(this.writeCache.data) === JSON.stringify(data)) {
            Logger.log('Önbellekteki veri aynı, kayıt atlandı');
            return this.writeCache.key;
        }

        const result = await this.put(storeName, data);
        
        this.writeCache = {
            store: storeName,
            data: data,
            key: result,
            timestamp: Date.now()
        };

        return result;
    }

    async update(storeName, id, data) {
        await this.ensureConnection();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const getRequest = store.get(id);
                getRequest.onsuccess = () => {
                    const existing = getRequest.result;
                    if (!existing) {
                        reject(new Error('Kayıt bulunamadı'));
                        return;
                    }
                    
                    const item = {
                        ...existing,
                        ...this.sanitizeData(data),
                        id: id,
                        updatedAt: new Date().toISOString(),
                        version: this.version
                    };
                    
                    const putRequest = store.put(item);
                    
                    putRequest.onsuccess = () => {
                        Logger.log(`${storeName} update işlemi başarılı:`, putRequest.result);
                        resolve(putRequest.result);
                    };
                    putRequest.onerror = () => {
                        Logger.error(`${storeName} update işlemi hatası:`, putRequest.error);
                        reject(putRequest.error);
                    };
                };
                getRequest.onerror = () => {
                    Logger.error(`${storeName} get işlemi hatası (update):`, getRequest.error);
                    reject(getRequest.error);
                };
            } catch (error) {
                Logger.error(`${storeName} update işlemi exception:`, error);
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
                    Logger.log(`${storeName} delete işlemi başarılı`);
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
                    Logger.log(`${storeName} clear işlemi başarılı`);
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

    async count(storeName) {
        await this.ensureConnection();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.count();
                
                request.onsuccess = () => {
                    Logger.log(`${storeName} count işlemi başarılı: ${request.result}`);
                    resolve(request.result);
                };
                request.onerror = () => {
                    Logger.error(`${storeName} count işlemi hatası:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                Logger.error(`${storeName} count işlemi exception:`, error);
                reject(error);
            }
        });
    }

    validateData(storeName, data) {
        const validators = {
            customers: (data) => {
                if (data.name && typeof data.name !== 'string') {
                    throw new Error('Customer name must be a string');
                }
                if (data.email && data.email !== '' && !this.isValidEmail(data.email)) {
                    throw new Error('Invalid email format');
                }
                return true;
            },
            products: (data) => {
                if (data.price && (typeof data.price !== 'number' || data.price < 0)) {
                    throw new Error('Product price must be a non-negative number');
                }
                if (data.taxRate && (typeof data.taxRate !== 'number' || data.taxRate < 0 || data.taxRate > 100)) {
                    throw new Error('Tax rate must be between 0 and 100');
                }
                return true;
            },
            quotes: (data) => {
                if (data.totalAmount && (typeof data.totalAmount !== 'number' || data.totalAmount < 0)) {
                    throw new Error('Total amount must be a non-negative number');
                }
                return true;
            }
        };

        if (validators[storeName]) {
            validators[storeName](data);
        }
    }

    sanitizeData(data) {
        const sanitized = { ...data };
        
        Object.keys(sanitized).forEach(key => {
            if (typeof sanitized[key] === 'string') {
                sanitized[key] = this.sanitizeString(sanitized[key]);
            }
        });

        if (sanitized.image && sanitized.image.startsWith('data:image')) {
            if (sanitized.image.length > 2 * 1024 * 1024) {
                throw new Error('Image size exceeds 2MB limit');
            }
        }

        return sanitized;
    }

    sanitizeString(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/[<>]/g, '')
            .trim()
            .substring(0, 10000);
    }

    isValidEmail(email) {
        if (!email || email === '') return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    async savePreviewData(quoteData) {
        try {
            const optimizedData = this.optimizeQuoteDataForStorage(quoteData);
            return await this.optimizedPut('previewData', {
                id: 'currentPreview',
                data: optimizedData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            Logger.error('Preview data kaydetme hatası:', error);
            throw error;
        }
    }

    optimizeQuoteDataForStorage(quoteData) {
        const optimized = JSON.parse(JSON.stringify(quoteData));
        
        const optimizeImage = (imageData) => {
            if (!imageData || !imageData.startsWith('data:image')) return imageData;
            
            if (imageData.length > 200000) {
                Logger.warn('Büyük görsel tespit edildi:', Math.round(imageData.length / 1024) + 'KB');
            }
            return imageData;
        };
        
        if (optimized.company && optimized.company.logo) {
            optimized.company.logo = optimizeImage(optimized.company.logo);
        }
        
        if (optimized.signatures && optimized.signatures.seller) {
            optimized.signatures.seller = optimizeImage(optimized.signatures.seller);
        }
        
        if (optimized.signatures && optimized.signatures.stamp) {
            optimized.signatures.stamp = optimizeImage(optimized.signatures.stamp);
        }
        
        if (optimized.items) {
            optimized.items.forEach(item => {
                if (item.image) {
                    item.image = optimizeImage(item.image);
                }
            });
        }
        
        return optimized;
    }

    async getPreviewData() {
        try {
            return await this.get('previewData', 'currentPreview');
        } catch (error) {
            Logger.error('Preview data getirme hatası:', error);
            return null;
        }
    }

    async clearPreviewData() {
        try {
            return await this.delete('previewData', 'currentPreview');
        } catch (error) {
            Logger.error('Preview data temizleme hatası:', error);
            throw error;
        }
    }

    async migrateFromLocalStorage() {
        const migrations = [
            { key: 'advancedCustomers', store: 'customers' },
            { key: 'products', store: 'products' },
            { key: 'templates', store: 'templates' },
            { key: 'savedQuotes', store: 'quotes' },
            { key: 'savedDrafts', store: 'drafts' }
        ];

        let migratedCount = 0;
        
        for (const { key, store } of migrations) {
            try {
                const oldData = this.safeLocalStorageGet(key, []);
                if (oldData.length > 0) {
                    for (const item of oldData) {
                        await this.add(store, item);
                    }
                    localStorage.removeItem(key);
                    migratedCount += oldData.length;
                    Logger.log(`${key} taşındı: ${oldData.length} kayıt`);
                }
            } catch (error) {
                Logger.error(`${key} taşıma hatası:`, error);
            }
        }

        return migratedCount;
    }

    async createBackup() {
        try {
            const stores = ['customers', 'products', 'quotes', 'drafts', 'templates', 'settings', 'previewData', 'bankInfo'];
            const backup = { 
                version: this.version, 
                timestamp: new Date().toISOString(),
                appVersion: '2.2.0'
            };

            for (const store of stores) {
                try {
                    backup[store] = await this.getAll(store);
                } catch (error) {
                    Logger.warn(`${store} yedeklenirken hata:`, error);
                    backup[store] = [];
                }
            }

            Logger.log('Backup oluşturuldu');
            return backup;
        } catch (error) {
            Logger.error('Backup oluşturma hatası:', error);
            throw error;
        }
    }

    async restoreBackup(backupData) {
        const stores = ['customers', 'products', 'quotes', 'drafts', 'templates', 'previewData', 'bankInfo'];
        
        try {
            for (const store of stores) {
                await this.clear(store);
                const items = backupData[store] || [];
                for (const item of items) {
                    await this.add(store, item);
                }
                Logger.log(`${store} restore edildi: ${items.length} kayıt`);
            }
        } catch (error) {
            Logger.error('Backup restore hatası:', error);
            throw error;
        }
    }

    async getDatabaseStats() {
        const stores = ['customers', 'products', 'quotes', 'drafts', 'templates', 'previewData', 'bankInfo'];
        const stats = {};
        let totalSize = 0;

        for (const store of stores) {
            try {
                const data = await this.getAll(store);
                stats[store] = data.length;
                totalSize += new Blob([JSON.stringify(data)]).size;
            } catch (error) {
                Logger.warn(`${store} store yüklenirken hata:`, error);
                stats[store] = 0;
            }
        }

        stats.totalSize = totalSize;
        return stats;
    }

    async clearAllData() {
        const stores = ['customers', 'products', 'quotes', 'drafts', 'templates', 'formState', 'settings', 'previewData', 'bankInfo'];
        
        try {
            for (const store of stores) {
                await this.clear(store);
                Logger.log(`${store} temizlendi`);
            }
            
            return true;
        } catch (error) {
            Logger.error('Tüm verileri temizleme hatası:', error);
            throw error;
        }
    }

    async optimizeStorage() {
        try {
            const stores = ['previewData', 'formState'];
            let totalFreed = 0;

            for (const storeName of stores) {
                const allData = await this.getAll(storeName);
                
                for (const item of allData) {
                    if (item.timestamp) {
                        const age = Date.now() - new Date(item.timestamp).getTime();
                        if (age > 7 * 24 * 60 * 60 * 1000) {
                            const size = new Blob([JSON.stringify(item)]).size;
                            await this.delete(storeName, item.id);
                            totalFreed += size;
                            Logger.log(`Eski veri temizlendi: ${storeName} - ${item.id}`);
                        }
                    }
                }
            }

            return {
                freedSpace: totalFreed,
                readableFreed: this.formatBytes(totalFreed)
            };
        } catch (error) {
            Logger.error('Depolama optimizasyon hatası:', error);
            throw error;
        }
    }

    async cleanupOldData() {
        try {
            const stores = ['previewData', 'formState'];
            const cleanupThreshold = 24 * 60 * 60 * 1000;
            
            for (const storeName of stores) {
                const allData = await this.getAll(storeName);
                const now = Date.now();
                
                for (const item of allData) {
                    if (item.timestamp) {
                        const age = now - new Date(item.timestamp).getTime();
                        if (age > cleanupThreshold) {
                            await this.delete(storeName, item.id);
                            Logger.log(`Eski veri temizlendi: ${storeName} - ${item.id}`);
                        }
                    }
                }
            }
        } catch (error) {
            Logger.error('Veri temizleme hatası:', error);
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async getStorageUsage() {
        const stores = ['customers', 'products', 'quotes', 'drafts', 'templates', 'previewData', 'formState', 'bankInfo'];
        const usage = {};

        for (const storeName of stores) {
            try {
                const data = await this.getAll(storeName);
                usage[storeName] = {
                    count: data.length,
                    size: new Blob([JSON.stringify(data)]).size
                };
            } catch (error) {
                Logger.warn(`${storeName} storage usage hesaplama hatası:`, error);
                usage[storeName] = { count: 0, size: 0 };
            }
        }

        return usage;
    }

    safeLocalStorageGet(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    }

    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
            this.isConnectionOpen = false;
            this.initializationPromise = null;
            Logger.log('Database bağlantısı kapatıldı');
        }
    }
}