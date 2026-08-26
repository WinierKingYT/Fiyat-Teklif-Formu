import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import indexedDBManager from '@/utils/indexedDBManager';

// Internal state access type for testing
type TestableManager = {
    isInitialized: boolean;
    isConnectionOpen: boolean;
    initializationPromise: Promise<IDBDatabase> | null;
    db: IDBDatabase | null;
};

const testableManager = indexedDBManager as unknown as TestableManager;

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
        contains: vi.fn(() => true),
    },
    close: vi.fn(),
    onversionchange: null as ((event: IDBVersionChangeEvent) => void) | null,
    onclose: null as (() => void) | null,
    onerror: null as ((event: Event) => void) | null,
};

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

const triggerBlocked = () => {
    expect(currentRequest).not.toBeNull();
    currentRequest!.onblocked?.(new Event('blocked'));
};

const mockIndexedDB = {
    open: vi.fn(() => captureRequest()),
};

describe('IndexedDB Multi-Tab Recovery & Resilience', () => {
    beforeEach(() => {
        testableManager.isInitialized = false;
        testableManager.isConnectionOpen = false;
        testableManager.initializationPromise = null;
        testableManager.db = null;

        vi.clearAllMocks();
        (globalThis as unknown as { indexedDB: unknown }).indexedDB = mockIndexedDB;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should cleanly close connection and reset internal state via closeConnection', async () => {
        const initPromise = indexedDBManager.initialize();
        triggerSuccess(mockDb);
        await initPromise;

        expect(testableManager.isConnectionOpen).toBe(true);
        expect(testableManager.isInitialized).toBe(true);

        indexedDBManager.closeConnection();
        expect(testableManager.isConnectionOpen).toBe(false);
        expect(testableManager.isInitialized).toBe(false);
        expect(testableManager.db).toBeNull();
        expect(mockDb.close).toHaveBeenCalled();
    });

    it('should reconnect seamlessly on subsequent operation via ensureConnection', async () => {
        const initPromise = indexedDBManager.initialize();
        triggerSuccess(mockDb);
        await initPromise;

        indexedDBManager.closeConnection();

        const ensurePromise = indexedDBManager.ensureConnection();
        triggerSuccess(mockDb);
        const db = await ensurePromise;

        expect(db).toBe(mockDb);
        expect(testableManager.isConnectionOpen).toBe(true);
        expect(testableManager.isInitialized).toBe(true);
    });

    it('should fire db-version-change event and close connection when onversionchange is triggered', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        const initPromise = indexedDBManager.initialize();
        triggerSuccess(mockDb);
        await initPromise;

        expect(testableManager.db).toBe(mockDb);
        expect(mockDb.onversionchange).toBeDefined();

        // Trigger onversionchange (simulating another tab requesting upgrade)
        if (mockDb.onversionchange) {
            mockDb.onversionchange(new Event('versionchange') as IDBVersionChangeEvent);
        }

        expect(testableManager.isConnectionOpen).toBe(false);
        expect(testableManager.isInitialized).toBe(false);
        expect(testableManager.db).toBeNull();
        expect(mockDb.close).toHaveBeenCalled();
        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'db-version-change' }));

        dispatchSpy.mockRestore();
    });

    it('should reset state on onblocked and allow subsequent retry to succeed', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        // 1. First initialization triggers upgrade blocked
        const firstInitPromise = indexedDBManager.initialize();
        triggerBlocked();

        await expect(firstInitPromise).rejects.toThrow('Database upgrade blocked');
        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'db-blocked' }));

        // Verify state is clean and initializationPromise is reset
        expect(testableManager.isConnectionOpen).toBe(false);
        expect(testableManager.isInitialized).toBe(false);
        expect(testableManager.initializationPromise).toBeNull();
        expect(testableManager.db).toBeNull();

        // 2. Subsequent retry starts fresh open request and succeeds
        const secondInitPromise = indexedDBManager.initialize();
        expect(mockIndexedDB.open).toHaveBeenCalledTimes(2);

        triggerSuccess(mockDb);
        const db = await secondInitPromise;

        expect(db).toBe(mockDb);
        expect(testableManager.isConnectionOpen).toBe(true);
        expect(testableManager.isInitialized).toBe(true);

        dispatchSpy.mockRestore();
    });
});
