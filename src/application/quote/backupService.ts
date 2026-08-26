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

export interface BackupPreview extends BackupData {
  fileName: string;
  storeCounts: Record<string, number>;
  totalRecords: number;
}

export async function readDatabaseBackup(file: File): Promise<BackupData> {
  if (!file) {
    throw new Error('Yedek dosyası seçilmedi.');
  }

  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;
  const stores = parseBackupStores(parsed);
  const metadata = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : {};

  return {
    schemaVersion: typeof metadata.schemaVersion === 'number' ? metadata.schemaVersion : 1,
    createdAt: typeof metadata.createdAt === 'string' ? metadata.createdAt : '',
    stores,
  };
}

export async function previewDatabaseBackup(file: File): Promise<BackupPreview> {
  const backup = await readDatabaseBackup(file);
  const storeCounts = Object.fromEntries(
    Object.entries(backup.stores).map(([storeName, items]) => [storeName, items.length])
  );

  return {
    ...backup,
    fileName: file.name,
    storeCounts,
    totalRecords: Object.values(storeCounts).reduce((total, count) => total + count, 0),
  };
}

async function createDatabaseBackup(db: IndexedDBManager): Promise<BackupData> {
  const storeEntries = await Promise.all(
    BACKUP_STORE_NAMES.map(async storeName => {
      const items = await db.getAll(storeName);
      return [storeName, items] as const;
    })
  );

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    stores: Object.fromEntries(storeEntries),
  };
}

export async function exportDatabaseBackup(
  db: IndexedDBManager,
  options?: { filenamePrefix?: string }
): Promise<void> {
  const payload = await createDatabaseBackup(db);

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateFormatted = getLocalDateString().replace(/-/g, '');
  a.download = `${options?.filenamePrefix || 'teklif_master_yedek'}_${dateFormatted}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importDatabaseBackup(
  db: IndexedDBManager,
  file: File
): Promise<number> {
  try {
    const backup = await readDatabaseBackup(file);
    const restoredCount = await db.restoreStores(backup.stores, { mode: 'replace' });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('db-restored'));
    }

    return restoredCount;
  } catch (error) {
    Logger.error('Error importing backup data:', error);
    throw error;
  }
}
