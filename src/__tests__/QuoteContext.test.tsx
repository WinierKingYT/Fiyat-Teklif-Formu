import { screen } from '@testing-library/dom';
import { render, act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteProvider, useQuote } from '@/context/QuoteContext';
import { getLocalDateString } from '@/utils/dateUtils';

// Mock useIndexedDB
const mockDb = {
    getByIndex: vi.fn(),
    add: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
};

vi.mock('../hooks/useIndexedDB', () => ({
    useIndexedDB: () => ({
        db: mockDb,
        isReady: true,
    }),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Helper component to test hook
const TestComponent = () => {
    const {
        tabs,
        addTab,
        activeTabId,
        updateQuoteData,
    } = useQuote();
    const activeTab = tabs.find(t => t.id === activeTabId);

    return (
        <div>
            <div data-testid="active-tab-id">{activeTabId}</div>
            <div data-testid="tab-count">{tabs.length}</div>
            <div data-testid="quote-title">{tabs.find(t => t.id === activeTabId)?.title}</div>
            <div data-testid="quote-date">{activeTab?.data?.quoteData?.date}</div>
            <button type="button" onClick={addTab}>Add Tab</button>
            <button type="button" onClick={() => updateQuoteData('validUntilDays', '20')}>Update Days</button>
        </div>
    );
};

describe('QuoteContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        // Default mock implementations
        mockDb.getByIndex.mockResolvedValue(null); // No saved tabs
        mockDb.get.mockResolvedValue(null);
    });

    it('should provide initial state', () => {
        render(
            <QuoteProvider>
                <TestComponent />
            </QuoteProvider>
        );

        expect(screen.getByTestId('tab-count')).toHaveTextContent('1');
        expect(screen.getByTestId('active-tab-id')).toHaveTextContent('active-quote');
    });

    it('should reset quote when addTab/newQuote is triggered', async () => {
        render(
            <QuoteProvider>
                <TestComponent />
            </QuoteProvider>
        );

        await act(async () => {
            screen.getByText('Add Tab').click();
        });

        expect(screen.getByTestId('tab-count')).toHaveTextContent('1');
        expect(screen.getByTestId('active-tab-id')).toHaveTextContent('active-quote');
    });

    it('should update quote data', async () => {
        render(
            <QuoteProvider>
                <TestComponent />
            </QuoteProvider>
        );

        await act(async () => {
            screen.getByText('Update Days').click();
        });

        // Verification relies on component re-render or internal state check
        // Since we don't expose quoteData.validUntilDays directly in TestComponent text,
        // we can verify via accessing the hook directly or checking side effects.

        // Let's create a more direct test via renderHook for state updates
    });
});

describe('QuoteContext Hook Direct', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        mockDb.getByIndex.mockResolvedValue(null);
    });

    it('should update validUntil date when days change', async () => {
        const { result } = renderHook(() => useQuote(), { wrapper: QuoteProvider });

        const initialDate = result.current.quoteData.date;

        await act(async () => {
            result.current.updateQuoteData('validUntilDays', '5');
        });

        // Effect needs to run
        // We might need to wait for the effect in React 18+
        // But renderHook usually handles this.

        const dateObj = new Date(initialDate + 'T00:00:00');
        dateObj.setDate(dateObj.getDate() + 5);
        const expectedDate = getLocalDateString(dateObj);

        expect(result.current.quoteData.validUntil).toBe(expectedDate);
    });

    it('should save a version snapshot and revert to it', async () => {
        const { result } = renderHook(() => useQuote(), { wrapper: QuoteProvider });

        await act(async () => {
            result.current.updateQuoteData('title', 'İlk Başlık');
        });

        let savedVersionId: string | null = null;
        await act(async () => {
            savedVersionId = await result.current.saveVersion('Sürüm 1');
        });

        expect(savedVersionId).toBeTruthy();
        expect(mockDb.put).toHaveBeenCalledWith('quoteVersions', expect.objectContaining({
            versionName: 'Sürüm 1',
            snapshot: expect.objectContaining({
                quoteData: expect.objectContaining({
                    title: 'İlk Başlık'
                })
            })
        }));

        // Now change title
        await act(async () => {
            result.current.updateQuoteData('title', 'İkinci Değiştirilmiş Başlık');
        });
        expect(result.current.quoteData.title).toBe('İkinci Değiştirilmiş Başlık');

        // Mock db.get for revert
        mockDb.get.mockImplementation(async (store: string) => {
            if (store === 'quoteVersions') {
                return {
                    versionId: savedVersionId,
                    versionName: 'Sürüm 1',
                    snapshot: {
                        id: 123,
                        quoteData: { title: 'İlk Başlık', number: 'T-001', currency: 'TRY', language: 'tr' },
                        customerData: { name: 'Müşteri 1' },
                        companyData: { name: 'Firma 1' },
                        items: [],
                        discount: { type: 'percentage', value: 0 },
                        bankData: { bankName: 'Banka 1' }
                    }
                };
            }
            return null;
        });

        // Revert to version
        await act(async () => {
            await result.current.revertToVersion(savedVersionId!);
        });

        expect(result.current.quoteData.title).toBe('İlk Başlık');
    });

    it('should automatically create a snapshot in quoteVersions when saveQuote is executed', async () => {
        const { result } = renderHook(() => useQuote(), { wrapper: QuoteProvider });

        await act(async () => {
            result.current.updateCompanyData('name', 'Örnek Firma A.Ş.');
            result.current.updateCustomerData('name', 'Ahmet Müşteri');
            result.current.updateQuoteData('number', 'TK-2026-01');
            result.current.updateQuoteData('currency', 'TRY');
            result.current.updateQuoteData('title', 'Otomatik Kaydedilen Teklif');
            result.current.setItems([
                { id: '1', name: 'Ürün A', quantity: 2, price: 100, taxRate: 20, total: 200, unit: 'Adet' }
            ]);
        });

        await act(async () => {
            await result.current.saveQuote(false);
        });

        expect(mockDb.add).toHaveBeenCalledWith('quotes', expect.any(Object));
        expect(mockDb.put).toHaveBeenCalledWith('quoteVersions', expect.objectContaining({
            versionName: 'Otomatik Kayıt',
            snapshot: expect.objectContaining({
                quoteData: expect.objectContaining({
                    title: 'Otomatik Kaydedilen Teklif'
                })
            })
        }));
    });
});
