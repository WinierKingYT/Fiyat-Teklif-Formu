// Performance Monitor Utility
// Tracks memory usage, storage size, and application performance metrics
import Logger from './logger';

class PerformanceMonitor {
    private metrics: {
        memory: any;
        storage: any;
        indexedDB: any;
        localStorage: any;
        sessionInfo: any;
        timestamp?: number;
    };

    constructor() {
        this.metrics = {
            memory: null,
            storage: null,
            indexedDB: null,
            localStorage: null,
            sessionInfo: null
        };
    }

    /**
     * Get browser memory usage (if available)
     * @returns {Object|null} Memory usage info or null if not supported
     */
    getMemoryUsage() {
        if ((performance as any).memory) {
            const memory = (performance as any).memory;
            return {
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit,
                usedPercentage: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2),
                usedMB: (memory.usedJSHeapSize / (1024 * 1024)).toFixed(2),
                totalMB: (memory.totalJSHeapSize / (1024 * 1024)).toFixed(2),
                limitMB: (memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2)
            };
        }
        return null;
    }

    /**
     * Get storage quota estimate (IndexedDB + Cache + other)
     * @returns {Promise<Object|null>} Storage estimate or null
     */
    async getStorageEstimate() {
        if (navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    usage: estimate.usage,
                    quota: estimate.quota,
                    usagePercentage: ((estimate.usage / estimate.quota) * 100).toFixed(2),
                    usageMB: (estimate.usage / (1024 * 1024)).toFixed(2),
                    quotaMB: (estimate.quota / (1024 * 1024)).toFixed(2),
                    availableMB: ((estimate.quota - estimate.usage) / (1024 * 1024)).toFixed(2)
                };
            } catch (error: any) {
                Logger.error('Error getting storage estimate:', error);
                return null;
            }
        }
        return null;
    }

    /**
     * Get IndexedDB size by store
     * @param {IndexedDBManager|IDBDatabase} dbManager - Database manager or native instance
     * @returns {Promise<Object>} Size info for each store
     */
    async getIndexedDBSize(dbManager: any) {
        if (!dbManager) {
            return { error: 'Database not available' };
        }

        // Get the actual IDBDatabase instance
        // IndexedDBManager has a .db property with the native IDBDatabase
        const db = dbManager.db || dbManager;

        if (!db || !db.objectStoreNames) {
            return { error: 'Database not properly initialized', stores: {}, totalBytes: 0, totalMB: '0.00', totalKB: '0.00' };
        }

        const storeNames = Array.from(db.objectStoreNames) as string[];
        const sizes = {};
        let totalSize = 0;

        for (const storeName of storeNames) {
            try {
                // Use the wrapper's getAll method if available
                let allRecords;
                if (dbManager.getAll && typeof dbManager.getAll === 'function') {
                    allRecords = await dbManager.getAll(storeName);
                } else {
                    // Fallback to native API
                    allRecords = await this._getAllRecordsNative(db, storeName);
                }

                // Estimate size by serializing records
                const jsonString = JSON.stringify(allRecords);
                const sizeBytes = new Blob([jsonString]).size;
                const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);

                sizes[storeName] = {
                    count: allRecords.length,
                    sizeBytes,
                    sizeMB,
                    sizeKB: (sizeBytes / 1024).toFixed(2)
                };

                totalSize += sizeBytes;
            } catch (error: any) {
                Logger.error(`Error calculating size for ${storeName}:`, error);
                sizes[storeName] = { error: (error as any).message, count: 0, sizeBytes: 0 };
            }
        }

        return {
            stores: sizes,
            totalBytes: totalSize,
            totalMB: (totalSize / (1024 * 1024)).toFixed(2),
            totalKB: (totalSize / 1024).toFixed(2)
        };
    }

    /**
     * Helper to get all records from a store using native API
     * @private
     */
    _getAllRecordsNative(db: any, storeName: string) {
        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Get LocalStorage size
     * @returns {Object} LocalStorage usage info
     */
    getLocalStorageSize() {
        try {
            let totalSize = 0;
            const items = {};

            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const value = localStorage.getItem(key);
                    const size = new Blob([value]).size;
                    totalSize += size;
                    items[key] = {
                        sizeBytes: size,
                        sizeKB: (size / 1024).toFixed(2)
                    };
                }
            }

            return {
                items,
                count: Object.keys(items).length,
                totalBytes: totalSize,
                totalKB: (totalSize / 1024).toFixed(2),
                totalMB: (totalSize / (1024 * 1024)).toFixed(4),
                estimatedLimit: 5 * 1024 * 1024, // 5MB
                usagePercentage: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(2)
            };
        } catch (error: any) {
            Logger.error('Error calculating localStorage size:', error);
            return { error: error.message };
        }
    }

    /**
     * Get session information (tabs, history, etc)
     * @param {Array} tabs - Current tabs from QuoteContext
     * @returns {Object} Session info
     */
    getSessionInfo(tabs: any[] = []) {
        const totalHistorySteps = tabs.reduce((sum, tab) => {
            return sum + (tab.history?.length || 0);
        }, 0);

        const totalItems = tabs.reduce((sum, tab) => {
            return sum + (tab.data?.items?.length || 0);
        }, 0);

        return {
            openTabs: tabs.length,
            totalHistorySteps,
            averageHistoryPerTab: tabs.length > 0 ? (totalHistorySteps / tabs.length).toFixed(1) : 0,
            totalItems,
            averageItemsPerTab: tabs.length > 0 ? (totalItems / tabs.length).toFixed(1) : 0
        };
    }

    /**
     * Get all performance metrics at once
     * @param {IndexedDBManager} dbManager - Database manager instance
     * @param {Array} tabs - Current tabs
     * @returns {Promise<Object>} Complete metrics
     */
    async getPerformanceMetrics(dbManager: any = null, tabs: any[] = []) {
        const [memory, storage, indexedDB, localStorage, sessionInfo] = await Promise.all([
            Promise.resolve(this.getMemoryUsage()),
            this.getStorageEstimate(),
            dbManager ? this.getIndexedDBSize(dbManager) : Promise.resolve(null),
            Promise.resolve(this.getLocalStorageSize()),
            Promise.resolve(this.getSessionInfo(tabs))
        ]);

        this.metrics = {
            memory,
            storage,
            indexedDB,
            localStorage,
            sessionInfo,
            timestamp: Date.now()
        };

        return this.metrics;
    }

    /**
     * Check if cleanup is recommended
     * @param {Object} metrics - Performance metrics
     * @returns {Object} Recommendations
     */
    getRecommendations(metrics = this.metrics) {
        const recommendations = {
            needsCleanup: false,
            warnings: [],
            suggestions: []
        };

        // Check memory usage
        if (metrics.memory && parseFloat(metrics.memory.usedPercentage) > 80) {
            recommendations.needsCleanup = true;
            recommendations.warnings.push({
                type: 'memory',
                severity: 'high',
                message: `Bellek kullanımı yüksek: %${metrics.memory.usedPercentage}`
            });
        }

        // Check storage usage
        if (metrics.storage && parseFloat(metrics.storage.usagePercentage) > 70) {
            recommendations.needsCleanup = true;
            recommendations.warnings.push({
                type: 'storage',
                severity: parseFloat(metrics.storage.usagePercentage) > 85 ? 'high' : 'medium',
                message: `Depolama alanı dolmak üzere: %${metrics.storage.usagePercentage}`
            });
        }

        // Check localStorage usage
        if (metrics.localStorage && parseFloat(metrics.localStorage.usagePercentage) > 60) {
            recommendations.suggestions.push({
                type: 'localStorage',
                message: 'LocalStorage temizliği önerilir'
            });
        }

        // Check tab count
        if (metrics.sessionInfo && metrics.sessionInfo.openTabs > 10) {
            recommendations.suggestions.push({
                type: 'tabs',
                message: `${metrics.sessionInfo.openTabs} açık sekme var. Bazılarını kapatmayı düşünün.`
            });
        }

        // Check history size
        if (metrics.sessionInfo && metrics.sessionInfo.totalHistorySteps > 500) {
            recommendations.suggestions.push({
                type: 'history',
                message: 'Geçmiş temizliği yapılabilir'
            });
        }

        return recommendations;
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes
     * @returns {string}
     */
    static formatBytes(bytes: number) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Export singleton instance
const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
