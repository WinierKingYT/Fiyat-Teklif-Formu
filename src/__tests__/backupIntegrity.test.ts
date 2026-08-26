import { describe, expect, it, vi } from 'vitest';
import { exportDatabaseBackup, importDatabaseBackup } from '@/application/quote/backupService';
import { buildQuoteRecord } from '@/application/quote/quoteRecordBuilder';
import { getInitialBankData, getInitialCompanyData, getInitialCustomerData, getInitialQuoteData } from '@/context/quote/initialState';
import type { IndexedDBManager } from '@/context/quote/types';

describe('Data Integrity Closure: Backup, Restore & Timestamps', () => {
    describe('exportDatabaseBackup', () => {
        it('throws immediately when reading any store fails and produces no download file', async () => {
            const fakeDb = {
                getAll: vi.fn().mockImplementation((storeName: string) => {
                    if (storeName === 'quotes') {
                        return Promise.reject(new Error('IndexedDB disk I/O read failure'));
                    }
                    return Promise.resolve([]);
                }),
            } as unknown as IndexedDBManager;

            const createElementSpy = vi.spyOn(document, 'createElement');
            const appendChildSpy = vi.spyOn(document.body, 'appendChild');

            await expect(exportDatabaseBackup(fakeDb)).rejects.toThrow('IndexedDB disk I/O read failure');

            expect(createElementSpy).not.toHaveBeenCalledWith('a');
            expect(appendChildSpy).not.toHaveBeenCalled();

            createElementSpy.mockRestore();
            appendChildSpy.mockRestore();
        });

        it('successfully triggers download with all stores when reads succeed', async () => {
            const fakeDb = {
                getAll: vi.fn().mockImplementation((storeName: string) => {
                    if (storeName === 'customers') return Promise.resolve([{ id: 1, name: 'Ahmet' }]);
                    return Promise.resolve([]);
                }),
            } as unknown as IndexedDBManager;

            const mockAnchor = {
                href: '',
                download: '',
                click: vi.fn(),
            };

            const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
            const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as unknown as Node);
            const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as unknown as Node);
            
            const originalCreateObjectURL = window.URL.createObjectURL;
            const originalRevokeObjectURL = window.URL.revokeObjectURL;
            window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
            window.URL.revokeObjectURL = vi.fn();

            await exportDatabaseBackup(fakeDb);

            expect(mockAnchor.click).toHaveBeenCalled();
            expect(mockAnchor.download).toMatch(/^teklif_master_yedek_\d{8}\.json$/);

            createElementSpy.mockRestore();
            appendChildSpy.mockRestore();
            removeChildSpy.mockRestore();
            window.URL.createObjectURL = originalCreateObjectURL;
            window.URL.revokeObjectURL = originalRevokeObjectURL;
        });
    });

    describe('importDatabaseBackup', () => {
        it('calls db.restoreStores with mode replace', async () => {
            const fakeDb = {
                restoreStores: vi.fn().mockResolvedValue(3),
            } as unknown as IndexedDBManager;

            const validBackup = JSON.stringify({
                schemaVersion: 3,
                createdAt: new Date().toISOString(),
                stores: {
                    customers: [{ id: 1, name: 'Ahmet' }],
                    products: [{ id: 10, name: 'Hizmet' }],
                },
            });

            const file = new File([validBackup], 'backup.json', { type: 'application/json' });
            const count = await importDatabaseBackup(fakeDb, file);

            expect(count).toBe(3);
            expect(fakeDb.restoreStores).toHaveBeenCalledWith(
                {
                    customers: [{ id: 1, name: 'Ahmet' }],
                    products: [{ id: 10, name: 'Hizmet' }],
                },
                { mode: 'replace' }
            );
        });
    });

    describe('canonical timestamp ownership', () => {
        it('preserves existing createdAt and updates updatedAt in ISO format', () => {
            const originalCreatedAt = '2025-05-10T08:30:00.000Z';
            const originalUpdatedAt = '2025-05-10T08:30:00.000Z';

            const record = buildQuoteRecord({
                id: 101,
                status: 'saved',
                quoteData: { ...getInitialQuoteData(), number: 'TK-101' },
                customerData: { ...getInitialCustomerData(), name: 'Test Müşteri' },
                companyData: getInitialCompanyData(),
                items: [{ id: '1', name: 'Kalem', quantity: 1, price: 100, taxRate: 20 }],
                discount: { type: 'percentage', value: 0 },
                bankData: getInitialBankData(),
                createdAt: originalCreatedAt,
            });

            expect(record.createdAt).toBe(originalCreatedAt);
            expect(record.updatedAt).not.toBe(originalUpdatedAt);
            expect(new Date(record.updatedAt!).toISOString()).toBe(record.updatedAt);
        });

        it('generates matching ISO format for new records without createdAt', () => {
            const record = buildQuoteRecord({
                id: 102,
                status: 'draft',
                quoteData: getInitialQuoteData(),
                customerData: getInitialCustomerData(),
                companyData: getInitialCompanyData(),
                items: [],
                discount: { type: 'percentage', value: 0 },
                bankData: getInitialBankData(),
            });

            expect(record.createdAt).toBeDefined();
            expect(record.updatedAt).toBeDefined();
            expect(new Date(record.createdAt!).toISOString()).toBe(record.createdAt);
            expect(new Date(record.updatedAt!).toISOString()).toBe(record.updatedAt);
        });
    });
});
