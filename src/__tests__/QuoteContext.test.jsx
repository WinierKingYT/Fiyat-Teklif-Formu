import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import { QuoteProvider, useQuote } from '../context/QuoteContext';
import { getLocalDateString } from '../utils/dateUtils';

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
        activeTab
    } = useQuote();

    return (
        <div>
            <div data-testid="active-tab-id">{activeTabId}</div>
            <div data-testid="tab-count">{tabs.length}</div>
            <div data-testid="quote-title">{tabs.find(t => t.id === activeTabId)?.title}</div>
            <div data-testid="quote-date">{activeTab?.data?.quoteData?.date}</div>
            <button onClick={addTab}>Add Tab</button>
            <button onClick={() => updateQuoteData('validUntilDays', '20')}>Update Days</button>
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
        expect(screen.getByTestId('active-tab-id')).toHaveTextContent('default-tab');
    });

    it('should add a new tab', async () => {
        render(
            <QuoteProvider>
                <TestComponent />
            </QuoteProvider>
        );

        await act(async () => {
            screen.getByText('Add Tab').click();
        });

        expect(screen.getByTestId('tab-count')).toHaveTextContent('2');
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

        // The effect calculates new validUntil
        // date + 5 days
        const dateObj = new Date(initialDate + 'T00:00:00');
        dateObj.setDate(dateObj.getDate() + 5);
        const expectedDate = getLocalDateString(dateObj);

        expect(result.current.quoteData.validUntil).toBe(expectedDate);
    });
});
