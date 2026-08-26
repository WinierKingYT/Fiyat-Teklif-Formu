import { describe, expect, it } from 'vitest';
import { BACKUP_SCHEMA_VERSION, parseBackupStores } from '@/utils/backupValidation';

describe('parseBackupStores', () => {
    it('accepts a current wrapped backup', () => {
        const stores = parseBackupStores({
            schemaVersion: BACKUP_SCHEMA_VERSION,
            createdAt: '2026-08-25T00:00:00.000Z',
            stores: {
                customers: [{ id: 1, name: 'Müşteri' }],
                products: [],
            },
        });

        expect(stores.customers).toEqual([{ id: 1, name: 'Müşteri' }]);
        expect(stores.products).toEqual([]);
    });

    it('accepts the legacy direct-store backup shape', () => {
        const stores = parseBackupStores({
            quotes: [{ id: 7, quoteNumber: 'TK-7' }],
        });

        expect(stores.quotes).toHaveLength(1);
    });

    it('rejects unknown stores', () => {
        expect(() => parseBackupStores({ stores: { unknownStore: [] } }))
            .toThrow(/desteklenmeyen veri alanı/i);
    });

    it('rejects invalid records and future schema versions', () => {
        expect(() => parseBackupStores({ stores: { customers: ['invalid'] } }))
            .toThrow(/kayıtları geçersiz/i);
        expect(() => parseBackupStores({
            schemaVersion: BACKUP_SCHEMA_VERSION + 1,
            stores: { customers: [] },
        })).toThrow(/şema sürümü/i);
    });
});
