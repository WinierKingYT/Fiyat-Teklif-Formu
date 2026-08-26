import {
    exportDatabaseBackup,
    importDatabaseBackup,
} from '@/application/quote/backupService';
import type { IndexedDBManager } from '@/context/quote/types';

export const createLegacyBackup = async (db: IndexedDBManager): Promise<void> => {
    return exportDatabaseBackup(db);
};

export const restoreBackupFile = async (db: IndexedDBManager, file: File): Promise<number> => {
    return importDatabaseBackup(db, file);
};

export { exportDatabaseBackup, importDatabaseBackup };
