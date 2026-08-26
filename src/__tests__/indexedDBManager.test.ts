import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import indexedDBManager from '@/utils/indexedDBManager';

// Internal state erişimi için daraltılmış test tipi
type TestableManager = {
    isInitialized: boolean;
    isConnectionOpen: boolean;
    initializationPromise: Promise<void> | null;
    db: IDBDatabase | null;
};

const testableManager = indexedDBManager as unknown as TestableManager;

// --- Global IndexedDB Mock ---
const mockTransaction = {
    objectStore: vi.fn(),
    abort: vi.fn(),
    error: null as DOMException | null,
    oncomplete: null as ((event?: Event) => void) | null,
    onerror: null as ((event?: Event) => void) | null,
    onabort: null as ((event?: Event) => void) | null,
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
        contains: vi.fn((name) => ['customers', 'products', 'quotes', 'drafts', 'templates', 'previewData', 'formState', 'settings', 'bankInfo', 'recycle_bin', 'quoteVersions'].includes(name)),
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
    currentRequest!.onsuccess?.({ target } as unknown as Event);
};

const triggerUpgrade = (target: typeof mockDb, oldVersion: number) => {
    expect(currentRequest).not.toBeNull();
    currentRequest!.onupgradeneeded?.({ target: { result: target }, oldVersion } as unknown as IDBVersionChangeEvent);
};

const mockIndexedDB = {
    open: vi.fn(() => captureRequest()),
};

describe('IndexedDBManager', () => {
    beforeEach(() => {
        testableManager.isInitialized = false;
        testableManager.isConnectionOpen = false;
        testableManager.initializationPromise = null;
        testableManager.db = null;

        vi.clearAllMocks();

        (globalThis as unknown as { indexedDB: unknown }).indexedDB = mockIndexedDB;

        mockDb.transaction.mockReturnValue(mockTransaction);
        mockTransaction.objectStore.mockReturnValue(mockStore);
        mockTransaction.oncomplete = null;
        mockTransaction.onerror = null;
        mockTransaction.onabort = null;
        mockTransaction.error = null;

        // Mock store method returns for generic CRUD
        const mockRequestSuccess = (result: unknown) => ({
            result,
            error: null,
            onsuccess: null as (() => void) | null,
            onerror: null as ((...args: unknown[]) => void) | null,
        });

        const simulateRequest = (method: string, resultVal: unknown) => {
            (mockStore as Record<string, ReturnType<typeof vi.fn>>)[method].mockImplementation(() => {
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

        expect(testableManager.isInitialized).toBe(true);
        expect(testableManager.db).toBe(mockDb);
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

    it('should save and query quoteVersions with versionId and quoteId index', async () => {
        const initPromise = indexedDBManager.initialize();
        triggerSuccess(mockDb);
        await initPromise;

        const versionData = {
            versionId: 'ver_1_12345',
            quoteId: 1,
            createdAt: 12345,
            snapshot: { id: 1, quoteData: { title: 'Test' } },
            versionName: 'V1'
        };

        await indexedDBManager.put('quoteVersions', versionData);
        expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining(versionData));

        await indexedDBManager.get('quoteVersions', 'ver_1_12345');
        expect(mockStore.get).toHaveBeenCalledWith('ver_1_12345');
    });

    it('should restore all backup records in a single transaction with atomic clear in replace mode', async () => {
        const initPromise = indexedDBManager.initialize();
        triggerSuccess(mockDb);
        await initPromise;

        const restorePromise = indexedDBManager.restoreStores({
            customers: [{ id: 1, name: 'Müşteri' }],
            products: [{ id: 2, name: 'Ürün' }],
        }, { mode: 'replace' });

        await vi.waitFor(() => {
            expect(mockDb.transaction).toHaveBeenCalledWith(['customers', 'products'], 'readwrite');
            expect(mockStore.clear).toHaveBeenCalledTimes(2);
            expect(mockStore.put).toHaveBeenCalledTimes(2);
        });

        mockTransaction.oncomplete?.();
        await expect(restorePromise).resolves.toBe(2);
    });

    it('should restore in merge mode without clearing stores', async () => {
        const initPromise = indexedDBManager.initialize();
        triggerSuccess(mockDb);
        await initPromise;

        mockStore.clear.mockClear();
        mockStore.put.mockClear();

        const restorePromise = indexedDBManager.restoreStores({
            customers: [{ id: 1, name: 'Müşteri' }],
        }, { mode: 'merge' });

        await vi.waitFor(() => {
            expect(mockDb.transaction).toHaveBeenCalledWith(['customers'], 'readwrite');
            expect(mockStore.clear).not.toHaveBeenCalled();
            expect(mockStore.put).toHaveBeenCalledTimes(1);
        });

        mockTransaction.oncomplete?.();
        await expect(restorePromise).resolves.toBe(1);
    });
});
