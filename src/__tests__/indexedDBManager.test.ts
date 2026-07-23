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
        contains: vi.fn(() => false),
    },
    close: vi.fn(),
};

// We will capture the request object to trigger events manually
let currentRequest = null;

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
        const mockRequestSuccess = (result) => ({
            result,
            error: null,
            onsuccess: null,
            onerror: null,
        });

        const simulateRequest = (method, resultVal) => {
            mockStore[method].mockImplementation(() => {
                const req = { ...mockRequestSuccess(resultVal) };
                setTimeout(() => {
                    if (req.onsuccess) req.onsuccess();
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
        expect(currentRequest).toBeDefined();
        currentRequest.onsuccess({ target: { result: mockDb } });

        await initPromise;

        expect((indexedDBManager as any).isInitialized).toBe(true);
        expect((indexedDBManager as any).db).toBe(mockDb);
    });

    it('should add data to store', async () => {
        // Init first
        const initPromise = indexedDBManager.initialize();
        currentRequest.onsuccess({ target: { result: mockDb } });
        await initPromise;

        const data = { name: 'Test Item' };
        await indexedDBManager.add('products', data);

        expect(mockStore.add).toHaveBeenCalled();
    });

    it('should perform migration on upgrade needed', async () => {
        const initPromise = indexedDBManager.initialize();

        // Trigger Upgrade
        expect(currentRequest).toBeDefined();
        expect(currentRequest.onupgradeneeded).toBeDefined();

        currentRequest.onupgradeneeded({
            target: { result: mockDb },
            oldVersion: 0
        });

        // Then Trigger Success
        currentRequest.onsuccess({ target: { result: mockDb } });

        await initPromise;

        // Verify Migrations ran (createInitialStores)
        expect(mockDb.createObjectStore).toHaveBeenCalledWith('customers', expect.any(Object));
        expect(mockDb.createObjectStore).toHaveBeenCalledWith('products', expect.any(Object));
    });
});
