import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportQuoteToCSV } from '@/utils/excelExporter';

vi.mock('@/utils/logger', () => ({
    default: { error: vi.fn(), log: vi.fn(), warn: vi.fn() },
}));

const sampleQuote = {
    date: '2026-01-01',
    number: '2026-001',
    currency: 'TRY',
    language: 'tr',
    customer: { name: 'Acme', company: 'Acme Ltd', email: 'a@acme.com', phone: '0212' },
    company: { name: 'Bizim A.Ş.', email: 'info@bizim.com', phone: '0232', website: 'bizim.com', address: 'İst', authorized: 'Ali' },
    bankData: { bankName: 'Ziraat', branch: 'Merkez', iban: 'TR000000000000000000000000', accountHolder: 'Bizim' },
    subTotal: 250,
    taxAmount: 40,
    grandTotal: 290,
    discount: { type: 'percentage' as const, value: 10 },
    globalDiscountAmount: 25,
    terms: '30 gün',
    notes: 'Not satırı',
};

const sampleItems = [
    { name: 'Laptop', description: '16GB', quantity: 2, price: 100, unit: 'Adet', taxRate: 20, discountRate: 10, netTotal: 180 },
];

import type { MockInstance } from 'vitest';

describe('excelExporter (CSV)', () => {
    let clickSpy: ReturnType<typeof vi.fn>;
    let createdBlob: Blob | null;

    beforeEach(() => {
        createdBlob = null;
        URL.createObjectURL = vi.fn((blob: Blob) => {
            createdBlob = blob;
            return 'blob:mock';
        }) as unknown as typeof URL.createObjectURL;
        URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;
        clickSpy = vi.fn();
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickSpy);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('generates a CSV download containing the quote data', async () => {
        const result = exportQuoteToCSV(sampleQuote, sampleItems);

        expect(result).toBe(true);
        expect(URL.createObjectURL).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();

        const text = await createdBlob!.text();
        expect(text).toContain('FİYAT TEKLİFİ');
        expect(text).toContain('2026-001');
        expect(text).toContain('Acme');
        expect(text).toContain('Bizim A.Ş.');
        expect(text).toContain('Laptop');
        expect(text).toContain('180,00');
        expect(text).toContain('30 gün');
        expect(text).toContain('Not satırı');
    });

    it('builds a filename from the customer name and date', () => {
        exportQuoteToCSV(sampleQuote, sampleItems);

        const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;
        expect(anchor.download).toMatch(/^tekli.?f_Acme_\d{4}-\d{2}-\d{2}\.csv$/i);
        expect(anchor.href).toContain('blob:');
    });

    it('escapes values containing separators, quotes and newlines', async () => {
        const items = [{
            name: 'Özel "Ürün"; A',
            description: 'satır 1\nsatır 2',
            quantity: 1,
            price: 5,
            unit: 'Adet',
            taxRate: 20,
            netTotal: 5,
        }];

        exportQuoteToCSV({ language: 'tr', customer: { name: 'Acme' } }, items);

        const text = await createdBlob!.text();
        expect(text).toContain('"Özel ""Ürün""; A"');
        expect(text).toContain('"satır 1\nsatır 2"');
    });

    it('omits the discount row when there is no discount', async () => {
        const quote = { ...sampleQuote, discount: { type: 'percentage' as const, value: 0 }, globalDiscountAmount: 0 };

        exportQuoteToCSV(quote, sampleItems);

        const text = await createdBlob!.text();
        expect(text).toContain('GENEL TOPLAM');
        expect(text).not.toContain('İskonto (%');
    });

    it('falls back to a default name in the filename for missing customers', async () => {
        exportQuoteToCSV({ language: 'tr', customer: {} }, []);

        const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;
        expect(anchor.download).toMatch(/^tekli.?f_Musteri_\d{4}-\d{2}-\d{2}\.csv$/i);
    });

    it('correctly computes discounted line total when netTotal is not explicitly provided', async () => {
        const itemsWithDiscount = [
            { name: 'Monitor', quantity: 2, price: 100, unit: 'Adet', discountRate: 20 }
        ];

        exportQuoteToCSV(sampleQuote, itemsWithDiscount);

        const text = await createdBlob!.text();
        expect(text).toContain('Monitor');
        expect(text).toContain('160,00'); // 2 * 100 * (1 - 0.20) = 160
    });
});