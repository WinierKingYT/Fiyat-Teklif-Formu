import { type IndexedDBManager } from '@/context/quote/types';
import {
  BACKUP_SCHEMA_VERSION,
  BACKUP_STORE_NAMES,
  parseBackupStores,
} from '@/utils/backupValidation';
import { getLocalDateString } from '@/utils/dateUtils';
import Logger from '@/utils/logger';

export interface BackupData {
  schemaVersion: number;
  createdAt: string;
  stores: Record<string, unknown[]>;
}

export async function exportDatabaseBackup(db: IndexedDBManager): Promise<void> {
  const storeEntries = await Promise.all(
    BACKUP_STORE_NAMES.map(async storeName => {
      const items = await db.getAll(storeName);
      return [storeName, items] as const;
    })
  );

  const stores = Object.fromEntries(storeEntries);

  const payload: BackupData = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    stores,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateFormatted = getLocalDateString().replace(/-/g, '');
  a.download = `teklif_master_yedek_${dateFormatted}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importDatabaseBackup(
  db: IndexedDBManager,
  file: File
): Promise<number> {
  if (!file) {
    throw new Error('Yedek dosyası seçilmedi.');
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;
    const stores = parseBackupStores(parsed);
    const restoredCount = await db.restoreStores(stores, { mode: 'replace' });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('db-restored'));
    }

    return restoredCount;
  } catch (error) {
    Logger.error('Error importing backup data:', error);
    throw error;
  }
}
