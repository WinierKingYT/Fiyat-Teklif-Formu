import { IndexedDBManager } from '@/context/quote/types';
import { getLocalDateString } from '@/utils/dateUtils';
import Logger from '@/utils/logger';

export interface BackupData {
  customers: unknown[];
  products: unknown[];
  quotes: unknown[];
  templates: unknown[];
  banks: unknown[];
  quoteVersions: unknown[];
  settings: unknown[];
  exportDate: string;
  version: string;
}

export async function exportDatabaseBackup(db: IndexedDBManager): Promise<void> {
  const [customers, products, quotes, templates, banks, quoteVersions, settings] =
    await Promise.all([
      db.getAll('customers'),
      db.getAll('products'),
      db.getAll('quotes'),
      db.getAll('templates'),
      db.getAll('bankInfo'),
      db.getAll('quoteVersions').catch(() => []),
      db.getAll('settings').catch(() => []),
    ]);

  const data: BackupData = {
    customers,
    products,
    quotes,
    templates,
    banks,
    quoteVersions,
    settings,
    exportDate: new Date().toISOString(),
    version: '2.4',
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `teklifmaster_backup_${getLocalDateString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importDatabaseBackup(db: IndexedDBManager, file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = (event.target as FileReader).result as string;
        const data = JSON.parse(text);

        if (Array.isArray(data.customers)) {
          await Promise.all(data.customers.map((item: unknown) => db.put('customers', item)));
        }
        if (Array.isArray(data.products)) {
          await Promise.all(data.products.map((item: unknown) => db.put('products', item)));
        }
        if (Array.isArray(data.quotes)) {
          await Promise.all(data.quotes.map((item: unknown) => db.put('quotes', item)));
        }
        if (Array.isArray(data.templates)) {
          await Promise.all(data.templates.map((item: unknown) => db.put('templates', item)));
        }
        if (Array.isArray(data.banks)) {
          await Promise.all(data.banks.map((item: unknown) => db.put('bankInfo', item)));
        }
        if (Array.isArray(data.quoteVersions)) {
          await Promise.all(data.quoteVersions.map((item: unknown) => db.put('quoteVersions', item)));
        }
        if (Array.isArray(data.settings)) {
          await Promise.all(data.settings.map((item: unknown) => db.put('settings', item)));
        }

        resolve();
      } catch (error) {
        Logger.error('Error importing backup data:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('FileReader error during backup import'));
    };

    reader.readAsText(file);
  });
}
