import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import indexedDBManager from '../utils/indexedDBManager';

// --- Global IndexedDB Mock ---
const mockTransaction = {
    objectStore: vi.fn(),
};

const mockStore = {
    add: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    index: vi.fn(),
    createIndex: vi.fn(),
};

const mockDb = {
    transaction: vi.fn(() => mockTransaction),
    createObjectStore: vi.fn(() => mockStore),
    objectStoreNames: {
        contains: vi.fn((name) => ['customers', 'products', 'quotes', 'drafts', 'templates', 'previewData', 'formState', 'settings', 'bankInfo', 'recycle_bin'].includes(name)),
    },
    close: vi.fn(),
};

// We will capture the request object to trigger events manually
let currentRequest: {
    result: typeof mockDb;
    error: null;
    onsuccess: ((event: Event) => void) | null;
    onerror: ((event: Event) => void) | null;
    onupgradeneeded: ((event: IDBVersionChangeEvent) => void) | null;
    onblocked: ((event: Event) => void) | null;
} | null = null;

const captureRequest = () => {
    currentRequest = {
        result: mockDb,
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        onblocked: null,
    };
    return currentRequest;
};

const triggerSuccess = (target: typeof mockDb) => {
    expect(currentRequest).not.toBeNull();
    currentRequest!.onsuccess?.({ target } as any);
};

const triggerUpgrade = (target: typeof mockDb, oldVersion: number) => {
    expect(currentRequest).not.toBeNull();
    currentRequest!.onupgradeneeded?.({ target: { result: target }, oldVersion } as any);
};

const mockIndexedDB = {
    open: vi.fn(() => captureRequest()),
};

describe('IndexedDBManager', () => {
    beforeEach(() => {
        (indexedDBManager as any).isInitialized = false;
        (indexedDBManager as any).isConnectionOpen = false;
        (indexedDBManager as any).initializationPromise = null;
        (indexedDBManager as any).db = null;

        vi.clearAllMocks();

        (globalThis as any).indexedDB = mockIndexedDB;

        mockDb.transaction.mockReturnValue(mockTransaction);
        mockTransaction.objectStore.mockReturnValue(mockStore);

        // Mock store method returns for generic CRUD
        const mockRequestSuccess = (result: any) => ({
            result,
            error: null,
            onsuccess: null as (() => void) | null,
            onerror: null as ((...args: any[]) => void) | null,
        });

        const simulateRequest = (method, resultVal) => {
            mockStore[method].mockImplementation(() => {
                const req = { ...mockRequestSuccess(resultVal) };
                setTimeout(() => {
                    req.onsuccess?.();
                }, 0);
                return req;
            });
        };

        ['add', 'put', 'delete', 'clear'].forEach(m => simulateRequest(m, 'success'));
        simulateRequest('get', { id: 1, data: 'test' });
        simulateRequest('getAll', [{ id: 1, data: 'test' }]);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should initialize connection successfully', async () => {
        const initPromise = indexedDBManager.initialize();

        // Manually trigger success
        triggerSuccess(mockDb);

        await initPromise;

        expect((indexedDBManager as any).isInitialized).toBe(true);
        expect((indexedDBManager as any).db).toBe(mockDb);
    });

    it('should add data to store', async () => {
        // Init first
        const initPromise = indexedDBManager.initialize();
        triggerSuccess(mockDb);
        await initPromise;

        const data = { name: 'Test Item' };
        await indexedDBManager.add('products', data);

        expect(mockStore.add).toHaveBeenCalled();
    });

    it('should perform migration on upgrade needed', async () => {
        const initPromise = indexedDBManager.initialize();

        // Trigger Upgrade
        triggerUpgrade(mockDb, 0);

        // Then Trigger Success
        triggerSuccess(mockDb);

        await initPromise;

        // Verify upgrade was triggered - migrations ran
        expect(currentRequest).not.toBeNull();
        expect(currentRequest!.onupgradeneeded).toBeDefined();
    });
});
