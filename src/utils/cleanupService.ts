// Cleanup Service
// Manages database cleanup operations for long-term application health

import Logger from './logger';

class CleanupService {
    private dbManager: any;
    private settings: any;
    constructor() {
        this.dbManager = null; // IndexedDBManager instance
        this.settings = {
            autoCleanupEnabled: false,
            quoteRetentionDays: 90,
            recycleBinRetentionDays: 30,
            cleanupOnStartup: false,
            maxHistorySteps: 50
        };
    }

    /**
     * Initialize with database manager instance
     * @param {IndexedDBManager} dbManager
     */
    setDatabase(dbManager) {
        this.dbManager = dbManager;
    }

    /**
     * Load cleanup settings from IndexedDB
     * @returns {Promise<Object>}
     */
    async loadSettings() {
        if (!this.dbManager) {
            console.warn('Database not initialized');
            return this.settings;
        }

        try {
            const result = await this.dbManager.getByIndex('settings', 'key', 'cleanup_settings');

            if (result?.value) {
                this.settings = { ...this.settings, ...result.value };
            }
            return this.settings;
        } catch (error) {
            console.error('Error loading cleanup settings:', error);
            return this.settings;
        }
    }

    /**
     * Save cleanup settings to IndexedDB
     * @param {Object} newSettings
     * @returns {Promise<void>}
     */
    async saveSettings(newSettings) {
        if (!this.dbManager) throw new Error('Database not initialized');

        this.settings = { ...this.settings, ...newSettings };

        try {
            await this.dbManager.put('settings', {
                id: 'cleanup_settings',
                key: 'cleanup_settings',
                value: this.settings
            });

            Logger.log('Cleanup settings saved', this.settings);
        } catch (error) {
            Logger.error('Error saving cleanup settings', error);
            throw error;
        }
    }

    /**
     * Clean old quotes older than specified days
     * @param {number} days - Age threshold in days
     * @returns {Promise<Object>} Cleanup stats
     */
    async cleanOldQuotes(days = null) {
        const cutoffDays = days ?? this.settings.quoteRetentionDays;
        if (!this.dbManager) throw new Error('Database not initialized');

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - cutoffDays);
        const cutoffTime = cutoffDate.toISOString();

        try {
            const allQuotes = await this.dbManager.getAll('quotes');

            let deletedCount = 0;

            for (const quote of allQuotes) {
                const quoteDate = quote.updatedAt || quote.createdAt;
                if (quoteDate && quoteDate < cutoffTime) {
                    await this.dbManager.delete('quotes', quote.id);
                    deletedCount++;
                }
            }

            Logger.log(`Cleaned ${deletedCount} old quotes older than ${cutoffDays} days`);

            return {
                success: true,
                deletedCount,
                cutoffDate: cutoffTime,
                cutoffDays
            };
        } catch (error) {
            Logger.error('Error cleaning old quotes', error);
            throw error;
        }
    }

    /**
     * Clean recycle bin items older than specified days
     * @param {number} days
     * @returns {Promise<Object>}
     */
    async cleanRecycleBin(days = null) {
        const cutoffDays = days ?? this.settings.recycleBinRetentionDays;
        if (!this.dbManager) throw new Error('Database not initialized');

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - cutoffDays);
        const cutoffTime = cutoffDate.toISOString();

        try {
            const allItems = await this.dbManager.getAll('recycle_bin');

            let deletedCount = 0;

            for (const item of allItems) {
                if (item.deletedAt && item.deletedAt < cutoffTime) {
                    await this.dbManager.delete('recycle_bin', item.id);
                    deletedCount++;
                }
            }

            Logger.log(`Cleaned ${deletedCount} recycle bin items older than ${cutoffDays} days`);

            return {
                success: true,
                deletedCount,
                cutoffDate: cutoffTime,
                cutoffDays
            };
        } catch (error) {
            Logger.error('Error cleaning recycle bin', error);
            throw error;
        }
    }

    /**
     * Clean orphaned data (e.g., references to deleted items)
     * @returns {Promise<Object>}
     */
    async cleanOrphanedData() {
        if (!this.dbManager) throw new Error('Database not initialized');

        try {
            let cleanedCount = 0;

            // Clean old form states (store name might be 'formState')
            try {
                const allStates = await this.dbManager.getAll('formState');
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                for (const state of allStates) {
                    if (state.timestamp && new Date(state.timestamp) < thirtyDaysAgo) {
                        await this.dbManager.delete('formState', state.id);
                        cleanedCount++;
                    }
                }
            } catch (err) {
                // Store might not exist
                console.warn('formState store not accessible:', err.message);
            }

            Logger.log(`Cleaned ${cleanedCount} orphaned data entries`);

            return {
                success: true,
                cleanedCount
            };
        } catch (error) {
            Logger.error('Error cleaning orphaned data', error);
            throw error;
        }
    }

    /**
     * Trim tab history to max steps
     * @param {Array} tabs - Current tabs array
     * @param {number} maxSteps - Maximum history steps to keep
     * @returns {Array} Updated tabs
     */
    trimTabHistory(tabs, maxSteps = null) {
        const limit = maxSteps ?? this.settings.maxHistorySteps;

        return tabs.map(tab => {
            if (tab.history && tab.history.length > limit) {
                const trimCount = tab.history.length - limit;
                const newHistory = tab.history.slice(trimCount);
                const newIndex = Math.max(0, tab.historyIndex - trimCount);

                Logger.log(`Trimmed ${trimCount} history steps from tab ${tab.id}`);

                return {
                    ...tab,
                    history: newHistory,
                    historyIndex: newIndex
                };
            }
            return tab;
        });
    }

    /**
     * Get cleanup statistics (what can be cleaned)
     * @returns {Promise<Object>}
     */
    async getCleanupStats() {
        if (!this.dbManager) throw new Error('Database not initialized');

        const stats = {
            oldQuotes: 0,
            recycleBinItems: 0,
            orphanedData: 0,
            totalSavings: 0
        };

        try {
            // Count old quotes
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.settings.quoteRetentionDays);
            const cutoffTime = cutoffDate.toISOString();

            const allQuotes = await this.dbManager.getAll('quotes');
            stats.oldQuotes = allQuotes.filter(q => {
                const date = q.updatedAt || q.createdAt;
                return date && date < cutoffTime;
            }).length;

            // Count recycle bin items
            const rbCutoffDate = new Date();
            rbCutoffDate.setDate(rbCutoffDate.getDate() - this.settings.recycleBinRetentionDays);
            const rbCutoffTime = rbCutoffDate.toISOString();

            const rbItems = await this.dbManager.getAll('recycle_bin');
            stats.recycleBinItems = rbItems.filter(item => {
                return item.deletedAt && item.deletedAt < rbCutoffTime;
            }).length;

            // Count orphaned form states
            try {
                const formStates = await this.dbManager.getAll('formState');
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                stats.orphanedData = formStates.filter(state => {
                    return state.timestamp && new Date(state.timestamp) < thirtyDaysAgo;
                }).length;
            } catch (err) {
                // formState store might not exist
                stats.orphanedData = 0;
            }

            // Rough estimate of savings (in bytes)
            stats.totalSavings = (stats.oldQuotes * 5000) +
                (stats.recycleBinItems * 5000) +
                (stats.orphanedData * 1000);

            return stats;
        } catch (error) {
            Logger.error('Error getting cleanup stats', error);
            throw error;
        }
    }

    /**
     * Perform full cleanup based on settings
     * @param {Object} options - Custom options to override settings
     * @returns {Promise<Object>}
     */
    async performFullCleanup(options: any = {}) {
        const results = {
            oldQuotes: null,
            recycleBin: null,
            orphanedData: null,
            success: true,
            errors: []
        };

        try {
            if (options.cleanQuotes !== false) {
                results.oldQuotes = await this.cleanOldQuotes(options.quoteRetentionDays);
            }

            if (options.cleanRecycleBin !== false) {
                results.recycleBin = await this.cleanRecycleBin(options.recycleBinRetentionDays);
            }

            if (options.cleanOrphaned !== false) {
                results.orphanedData = await this.cleanOrphanedData();
            }

            Logger.log('FullCleanup completed', results);
        } catch (error) {
            results.success = false;
            results.errors.push(error.message);
            Logger.error('Full cleanup failed', error);
        }

        return results;
    }

    /**
     * Perform startup cleanup if enabled
     * @returns {Promise<void>}
     */
    async performStartupCleanup() {
        await this.loadSettings();

        if (this.settings.cleanupOnStartup && this.settings.autoCleanupEnabled) {
            Logger.log('Performing startup cleanup...');
            try {
                await this.performFullCleanup();
            } catch (error) {
                Logger.error('Startup cleanup failed', error);
            }
        }
    }
}

// Export singleton instance
const cleanupService = new CleanupService();
export default cleanupService;

