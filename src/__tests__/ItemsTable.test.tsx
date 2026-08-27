import { act, render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ItemsTable from '@/components/ItemsTable';
import { QuoteProvider } from '@/context/QuoteContext';
import type { QuoteItem } from '@/context/quote/types';

const mockDb = {
    getByIndex: vi.fn(),
    getAll: vi.fn(),
    add: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
};

vi.mock('@/hooks/useIndexedDB', () => ({
    useIndexedDB: () => ({ db: mockDb, isReady: true }),
}));

vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));

const Harness = ({ initial = [] }: { initial?: QuoteItem[] }) => {
    const [items, setItems] = useState<QuoteItem[]>(initial);
    return (
        <QuoteProvider>
            <ItemsTable items={items} onItemsChange={setItems} currency="TRY" />
        </QuoteProvider>
    );
};

const nameInput = () => document.querySelector<HTMLInputElement>('[data-row="0"][data-field="name"]');
const deleteButton = () => screen.getByRole('button', { name: 'Satırı sil' });
const duplicateButton = () => screen.getByRole('button', { name: 'Çoğalt' });
const renderHarness = async (initial: QuoteItem[] = []) => {
    await act(async () => {
        render(<Harness initial={initial} />);
    });
};

describe('ItemsTable', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        mockDb.getByIndex.mockResolvedValue(null);
        mockDb.get.mockResolvedValue(null);
        mockDb.getAll.mockResolvedValue([]);
    });

    it('shows an empty state when there are no items', async () => {
        await renderHarness();

        expect(screen.getByText(/içe aktarın veya ürün ekleyin/)).toBeInTheDocument();
        expect(screen.getByText('Kalem Ekle')).toBeInTheDocument();
    });

    it('adds a new empty row when the add button is clicked', async () => {
        await renderHarness();

        fireEvent.click(screen.getByText('Kalem Ekle'));

        const input = nameInput();
        expect(input).toBeInTheDocument();
        expect(input?.value).toBe('');
        expect(screen.queryByText(/içe aktarın veya ürün ekleyin/)).not.toBeInTheDocument();
    });

    it('updates the row name when the user types', async () => {
        await renderHarness();

        fireEvent.click(screen.getByText('Kalem Ekle'));
        fireEvent.change(nameInput()!, { target: { value: 'Laptop' } });

        expect(nameInput()?.value).toBe('Laptop');
    });

    it('removes a row when the delete button is clicked', async () => {
        await renderHarness();

        fireEvent.click(screen.getByText('Kalem Ekle'));
        expect(nameInput()).toBeInTheDocument();

        fireEvent.click(deleteButton());

        expect(nameInput()).not.toBeInTheDocument();
        expect(screen.getByText(/içe aktarın veya ürün ekleyin/)).toBeInTheDocument();
    });

    it('duplicates a row when the duplicate button is clicked', async () => {
        await renderHarness([{ id: 'x', name: 'Laptop', description: '', quantity: 1, unit: 'Adet', price: 100, taxRate: 20, discountRate: 0, total: 100 }]);

        expect(document.querySelectorAll('[data-field="name"]').length).toBe(1);

        fireEvent.click(duplicateButton());

        expect(document.querySelectorAll('[data-field="name"]').length).toBe(2);
    });

    it('shows row validation errors after editing an invalid row', async () => {
        await renderHarness();

        fireEvent.click(screen.getByText('Kalem Ekle'));
        const price = document.querySelector<HTMLInputElement>('[data-row="0"][data-field="price"]')!;
        fireEvent.change(price, { target: { value: '-5' } });
        fireEvent.blur(price);

        expect(screen.getByText('Geçersiz fiyat')).toBeInTheDocument();
    });

    it('adds a new row when Enter is pressed on the last row', async () => {
        await renderHarness([{ id: 'x', name: 'Item 1', description: '', quantity: 1, unit: 'Adet', price: 100, taxRate: 20, discountRate: 0, total: 100 }]);

        const input = nameInput()!;
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(document.querySelectorAll('[data-field="name"]').length).toBe(2);
    });

    it('updates VAT rate when selecting a preset from the dropdown', async () => {
        await renderHarness([{ id: 'x', name: 'Item 1', description: '', quantity: 1, unit: 'Adet', price: 100, taxRate: 20, discountRate: 0, total: 100 }]);

        const vatSelect = document.querySelector<HTMLSelectElement>('[data-row="0"][data-field="taxRate"]')!;
        expect(vatSelect.value).toBe('20');

        fireEvent.change(vatSelect, { target: { value: '10' } });
        expect(vatSelect.value).toBe('10');
    });
});
