import { describe, expect, it } from 'vitest';
import { BACKUP_SCHEMA_VERSION, BACKUP_STORE_NAMES, parseBackupStores } from '@/utils/backupValidation';

const createFullV3Stores = (overrides: Record<string, unknown[]> = {}): Record<string, unknown[]> => {
    const base: Record<string, unknown[]> = {};
    for (const name of BACKUP_STORE_NAMES) {
        base[name] = overrides[name] || [];
    }
    return base;
};

describe('parseBackupStores', () => {
    it('accepts a current wrapped backup containing all canonical stores', () => {
        const fullStores = createFullV3Stores({
            customers: [{ id: 1, name: 'Müşteri' }],
        });

        const stores = parseBackupStores({
            schemaVersion: BACKUP_SCHEMA_VERSION,
            createdAt: '2026-08-25T00:00:00.000Z',
            stores: fullStores,
        });

        expect(stores.customers).toEqual([{ id: 1, name: 'Müşteri' }]);
        expect(stores.products).toEqual([]);
        expect(stores.quotes).toEqual([]);
        expect(Object.keys(stores)).toHaveLength(BACKUP_STORE_NAMES.length);
    });

    it('rejects a schema v3 backup when canonical stores are missing', () => {
        expect(() => parseBackupStores({
            schemaVersion: BACKUP_SCHEMA_VERSION,
            createdAt: '2026-08-25T00:00:00.000Z',
            stores: {
                customers: [{ id: 1, name: 'Müşteri' }],
                products: [],
            },
        })).toThrow(/eksik veri alanları var/i);
    });

    it('accepts the legacy direct-store backup shape and normalizes missing stores to empty arrays', () => {
        const stores = parseBackupStores({
            quotes: [{ id: 7, quoteNumber: 'TK-7' }],
        });

        expect(stores.quotes).toEqual([{ id: 7, quoteNumber: 'TK-7' }]);
        expect(stores.customers).toEqual([]);
        expect(stores.products).toEqual([]);
        expect(Object.keys(stores)).toHaveLength(BACKUP_STORE_NAMES.length);
    });

    it('rejects unknown stores', () => {
        expect(() => parseBackupStores({ stores: { unknownStore: [] } }))
            .toThrow(/desteklenmeyen veri alanı/i);
    });

    it('rejects invalid records and future schema versions', () => {
        const fullStores = createFullV3Stores({
            customers: ['invalid' as unknown as Record<string, unknown>],
        });

        expect(() => parseBackupStores({ stores: fullStores }))
            .toThrow(/kayıtları geçersiz/i);

        expect(() => parseBackupStores({
            schemaVersion: BACKUP_SCHEMA_VERSION + 1,
            stores: fullStores,
        })).toThrow(/şema sürümü/i);
    });
});
