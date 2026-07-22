import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

// --- Mocks ---

// Mock IndexedDB Hook
const mockDb = {
    getByIndex: vi.fn(),
    add: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    delete: vi.fn(),
};

vi.mock('../hooks/useIndexedDB', () => ({
    useIndexedDB: () => ({
        db: mockDb,
        isReady: true,
    }),
}));

// Mock Toast
vi.mock('react-hot-toast', () => ({
    Toaster: () => <div data-testid="toaster" />,
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock Components
vi.mock('../components/Layout', () => ({
    default: ({ children }) => <div data-testid="layout">{children}</div>
}));

// We only need to mock components that are directly rendered or cause issues.
// Since we are mocking Layout and Layout wraps everything, we might check what App passes to Layout.
// App passes <QuoteBuilder /> as children to Layout.
// QuoteBuilder renders many components. We should mock them to be safe.

vi.mock('../components/QuoteInfoForm', () => ({ default: () => <div data-testid="quote-info-form" /> }));
vi.mock('../components/CustomerInfoForm', () => ({ default: () => <div data-testid="customer-info-form" /> }));
vi.mock('../components/CompanyInfoForm', () => ({ default: () => <div data-testid="company-info-form" /> }));
vi.mock('../components/ItemsTable', () => ({ default: () => <div data-testid="items-table" /> }));
vi.mock('../components/SummarySection', () => ({ default: () => <div data-testid="summary-section" /> }));
vi.mock('../components/TermsAndNotes', () => ({ default: () => <div data-testid="terms-and-notes" /> }));
vi.mock('../components/BankInfoForm', () => ({ default: () => <div data-testid="bank-info-form" /> }));

// Modals
vi.mock('../components/CustomerSelectModal', () => ({ default: () => <div data-testid="modal" /> }));
vi.mock('../components/ProductSelectModal', () => ({ default: () => <div data-testid="modal" /> }));
vi.mock('../components/SavedQuotesModal', () => ({ default: () => <div data-testid="modal" /> }));
vi.mock('../components/AnalyticsModal', () => ({ default: () => <div data-testid="modal" /> }));
vi.mock('../components/CustomerManagerModal', () => ({ default: () => <div data-testid="modal" /> }));
vi.mock('../components/ProductManagerModal', () => ({ default: () => <div data-testid="modal" /> }));
vi.mock('../components/TemplateManagerModal', () => ({ default: () => <div data-testid="modal" /> }));
vi.mock('../components/DatabaseManagerModal', () => ({ default: () => <div data-testid="modal" /> }));
vi.mock('../components/BankManagerModal', () => ({ default: () => <div data-testid="modal" /> }));
vi.mock('../components/RecycleBinModal', () => ({ default: () => <div data-testid="modal" /> }));

vi.mock('../components/Settings', () => ({ default: () => <div data-testid="settings" /> }));

// Utils
vi.mock('../hooks/useKeyboardShortcuts', () => ({ default: () => { } }));


describe('App Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        mockDb.getByIndex.mockResolvedValue(null);
        mockDb.get.mockResolvedValue(null); // Defaults
    });

    it('renders without crashing', async () => {
        render(<App />);
        expect(screen.getByTestId('layout')).toBeInTheDocument();
    });

    it('renders the builder view by default', async () => {
        render(<App />);

        // Check for specific components that belong to the builder view
        // DashboardHero is in the modern layout builder view
        await waitFor(() => {
            expect(screen.getByTestId('dashboard-hero')).toBeInTheDocument();
        });

        expect(screen.getByTestId('items-table')).toBeInTheDocument();
        expect(screen.getByTestId('summary-section')).toBeInTheDocument();
    });
});
