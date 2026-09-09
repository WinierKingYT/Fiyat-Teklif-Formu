import { describe, it, expect } from 'vitest';
import { getAdjustedFontSize, chunkQuoteItems, formatIban, formatTaxOfficeDisplay, formatContactItems, formatPdfTitle, getExportBlockReason, resolveSinglePageDensity, buildDensityChunkOptions, DENSE_IMAGE_THEMES } from '@/utils/themeHelpers';

describe('getAdjustedFontSize', () => {
    it('should return default for null/undefined', () => {
        expect(getAdjustedFontSize(null)).toBe('0.85em');
        expect(getAdjustedFontSize(undefined)).toBe('0.85em');
    });

    it('should return default for "inherit"', () => {
        expect(getAdjustedFontSize('inherit')).toBe('0.85em');
    });

    it('should handle number input', () => {
        expect(getAdjustedFontSize(16)).toBe('14.4px');
        expect(getAdjustedFontSize(20, 0.8)).toBe('16px');
    });

    it('should handle px string input', () => {
        expect(getAdjustedFontSize('16px')).toBe('14.4px');
        expect(getAdjustedFontSize('24px', 0.5)).toBe('12px');
    });

    it('should handle rem/em string input', () => {
        expect(getAdjustedFontSize('1rem')).toBe('calc(1rem * 0.9)');
        expect(getAdjustedFontSize('1.5em', 0.8)).toBe('calc(1.5em * 0.8)');
    });

    it('should use custom default', () => {
        expect(getAdjustedFontSize(null, 0.9, '1em')).toBe('1em');
        expect(getAdjustedFontSize('inherit', 0.9, '12px')).toBe('12px');
    });

    it('should return default for unknown string format', () => {
        expect(getAdjustedFontSize('abc')).toBe('0.85em');
    });
});

describe('chunkQuoteItems', () => {
    it('should handle empty or null items array', () => {
        expect(chunkQuoteItems([])).toEqual([[]]);
    });

    it('should keep single page quote when items count is small without bottom sections', () => {
        const items = Array.from({ length: 14 }, (_, i) => i + 1);
        const chunks = chunkQuoteItems(items, { showSummary: false, showBankInfo: false, showTerms: false, showNotes: false, showSignatures: false });
        expect(chunks.length).toBe(1);
        expect(chunks[0]).toEqual(items);
    });

    it('should split into 3 pages for 25 items when all bottom sections are enabled to prevent overflow', () => {
        const items = Array.from({ length: 25 }, (_, i) => i + 1);
        const chunks = chunkQuoteItems(items, {
            showSummary: true,
            showBankInfo: true,
            hasBankData: true,
            showTerms: true,
            hasTerms: true,
            showNotes: true,
            hasNotes: true,
            showSignatures: true
        });
        expect(chunks.length).toBe(3);
        expect(chunks.flat()).toEqual(items);
        // Ensure last page has a reasonable number of items (<= 7) so summary/notes/signatures never overflow
        expect(chunks[2].length).toBeLessThanOrEqual(7);
    });

    it('should balance items across 2 pages without empty gaps for moderate item counts', () => {
        const items = Array.from({ length: 15 }, (_, i) => i + 1);
        const chunks = chunkQuoteItems(items);
        expect(chunks.length).toBe(2);
        expect(chunks[0].length).toBeGreaterThan(0);
        expect(chunks[1].length).toBeGreaterThan(0);
        expect(chunks.flat()).toEqual(items);
    });

    it('should handle large lists across 3+ pages', () => {
        const items = Array.from({ length: 50 }, (_, i) => i + 1);
        const chunks = chunkQuoteItems(items);
        expect(chunks.length).toBeGreaterThanOrEqual(3);
        expect(chunks.flat()).toEqual(items);
    });

    it('should avoid sparse middle pages for landscape quotes', () => {
        const items = Array.from({ length: 22 }, (_, i) => i + 1);
        const chunks = chunkQuoteItems(items, {
            isLandscape: true,
            showSummary: true,
            showBankInfo: true,
            hasBankData: false,
            showTerms: true,
            hasTerms: false,
            showNotes: true,
            hasNotes: false,
            showSignatures: true,
        });

        expect(chunks).toHaveLength(3);
        expect(chunks.map(chunk => chunk.length)).toEqual([7, 7, 8]);
        expect(chunks.flat()).toEqual(items);
    });

    it('should respect custom itemsPerPage when specified and different from 14', () => {
        const items = Array.from({ length: 6 }, (_, i) => i + 1);
        const chunks = chunkQuoteItems(items, { itemsPerPage: 2 });
        expect(chunks.length).toBe(3);
        expect(chunks[0]).toEqual([1, 2]);
        expect(chunks[1]).toEqual([3, 4]);
        expect(chunks[2]).toEqual([5, 6]);
    });
});

describe('resolveSinglePageDensity', () => {
    const plain = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `i${i}`, name: `Ürün ${i}` }));

    it('returns dense-plain for 8-14 plain portrait items', () => {
        // 8 items fit normal (comfortable); 11-14 need the compact tier.
        expect(resolveSinglePageDensity(plain(8))).toBe('normal');
        expect(resolveSinglePageDensity(plain(11))).toBe('normal');
        expect(resolveSinglePageDensity(plain(14))).toBe('dense-plain');
    });

    it('returns normal for small quotes and null beyond 14', () => {
        expect(resolveSinglePageDensity(plain(5))).toBe('normal');
        expect(resolveSinglePageDensity(plain(15))).toBe(null);
    });

    it('returns null for landscape, spacious, explicit spacing/padding, tall rows and long text', () => {
        // 12 plain rows would otherwise go dense-plain; each guard must veto.
        const base = plain(12);
        expect(resolveSinglePageDensity(base, { isLandscape: true })).toBe(null);
        expect(resolveSinglePageDensity(base, { tableDensity: 'spacious' })).toBe(null);
        expect(resolveSinglePageDensity(base, { margins: 'wide' })).toBe(null);
        expect(resolveSinglePageDensity(base, { sectionSpacing: 1 })).toBe(null);
        expect(resolveSinglePageDensity(base, { tableCellPadding: '8px 8px' })).toBe(null);
        expect(resolveSinglePageDensity(base, { tableRowHeight: 42 })).toBe(null);
        // 12 rows where one has a pathological description: too tall for every tier.
        expect(resolveSinglePageDensity(plain(11).concat([{ id: 'y', name: 'A', description: 'x'.repeat(121) }] as never[]))).toBe(null);
    });

    it('returns dense-image for image rows on capable themes, null elsewhere', () => {
        expect(DENSE_IMAGE_THEMES).toContain('modern');
        const withImages = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `g${i}`, name: `Ürün ${i + 1}`, image: 'data:image/png;base64,abc' }));
        expect(resolveSinglePageDensity(withImages(14))).toBe('dense-image');
        expect(resolveSinglePageDensity(withImages(14), { theme: 'corporate' })).toBe(null);
        expect(resolveSinglePageDensity(withImages(15))).toBe(null);
    });

    it('buildDensityChunkOptions derives the same flags the hook uses', () => {
        const opts = buildDensityChunkOptions({
            config: { theme: 'modern', showSummary: true, tableDensity: 'comfortable' },
            layout: [{ id: 'summary', enabled: true }],
            bankData: { bankName: 'X', iban: '', accountNumber: '' },
            quoteData: { deliveryTerms: '', warrantyTerms: '', terms: 't', notes: '' },
            customerData: { name: 'Ali' },
        });
        expect(opts.theme).toBe('modern');
        expect(opts.hasBankData).toBe(true);
        expect(opts.hasTerms).toBe(true);
        expect(opts.hasNotes).toBe(false);
        expect(opts.hasCustomer).toBe(true);
        expect(opts.showSummary).toBe(true);
    });

    it('squeezes 12 plain items with bottom sections into a single chunk', () => {
        const chunks = chunkQuoteItems(plain(12), { showSummary: true, showSignatures: true, hasCustomer: true, hasBankData: true });
        expect(chunks.length).toBe(1);
        expect(chunks[0]).toHaveLength(12);
    });

    it('measures image rows by max(image, text) — short descriptions add nothing on tall images', () => {
        const opts = { showSummary: true, showBankInfo: true, hasBankData: true, showSignatures: true, hasCustomer: true };
        const withImages = Array.from({ length: 6 }, (_, i) => ({
            id: `g${i}`, name: `Ürün ${i + 1}`, description: 'Kısa açıklama', image: 'data:image/png;base64,abc'
        }));
        const chunks = chunkQuoteItems(withImages, opts);
        expect(chunks.length).toBe(1);
        expect(chunks.flat()).toHaveLength(6);
    });

    it('keeps 8-9 image rows on one page when they physically fit (smallSingle)', () => {
        const opts = { showSummary: true, showBankInfo: true, hasBankData: true, showSignatures: true, hasCustomer: true };
        for (const n of [8, 9]) {
            const items = Array.from({ length: n }, (_, i) => ({
                id: `s${i}`, name: `Ürün ${i + 1}`, image: 'data:image/png;base64,abc'
            }));
            const chunks = chunkQuoteItems(items, opts);
            expect(chunks.length).toBe(1);
            expect(chunks.flat()).toHaveLength(n);
        }
    });

    it('treats rows as imageless when the image column is hidden', () => {
        const opts = { showSummary: true, showBankInfo: true, hasBankData: true, showSignatures: true, hasCustomer: true, showTableImages: false };
        const items = Array.from({ length: 12 }, (_, i) => ({
            id: `h${i}`, name: `Ürün ${i + 1}`, image: 'data:image/png;base64,abc'
        }));
        const chunks = chunkQuoteItems(items, opts);
        expect(chunks.length).toBe(1);
        expect(chunks.flat()).toHaveLength(12);
        expect(resolveSinglePageDensity(items, opts)).toBe('dense-plain');
    });

    it('keeps 7 image rows with short descriptions on one page (no [5,2] orphan split)', () => {
        const opts = { showSummary: true, showBankInfo: true, hasBankData: true, showSignatures: true, hasCustomer: true };
        const items = Array.from({ length: 7 }, (_, i) => ({
            id: `q${i}`, name: `Ürün ${i + 1}`, description: 'Kısa açıklama', image: 'data:image/png;base64,abc'
        }));
        const chunks = chunkQuoteItems(items, opts);
        expect(chunks.length).toBe(1);
        expect(chunks.flat()).toHaveLength(7);
    });

    it('still accounts long descriptions on image rows (text taller than image)', () => {
        const opts = { showSummary: true, showBankInfo: true, hasBankData: true, showSignatures: true, hasCustomer: true };
        const items = Array.from({ length: 12 }, (_, i) => ({
            id: `h${i}`, name: `Ürün ${i + 1}`, description: 'Uzun açıklama satırı bir\nsatır iki\nsatır üç ve devamı', image: 'data:image/png;base64,abc'
        }));
        const chunks = chunkQuoteItems(items, opts);
        expect(chunks.length).toBeGreaterThan(1);
        expect(chunks.flat()).toHaveLength(12);
    });

    it('keeps small described quotes (4-7 rows) on one page without orphan splits', () => {
        const opts = { showSummary: true, showBankInfo: true, hasBankData: true, showSignatures: true, showTerms: true, hasTerms: true, hasCustomer: true };
        for (const n of [4, 5, 6, 7]) {
            const items = Array.from({ length: n }, (_, i) => ({ id: `d${i}`, name: `Ürün ${i + 1}`, description: 'Kısa açıklama' }));
            const chunks = chunkQuoteItems(items, opts);
            expect(chunks.length).toBe(1);
            expect(chunks.flat()).toHaveLength(n);
        }
    });
});

describe('formatPdfTitle', () => {
    it('preserves Turkish dotted and dotless I characters', () => {
        expect(formatPdfTitle('Fiyat Teklifi', 'tr')).toBe('FİYAT TEKLİFİ');
        expect(formatPdfTitle('İndirimli ürün', 'tr')).toBe('İNDİRİMLİ ÜRÜN');
    });

    it('uses the selected locale for non-Turkish titles', () => {
        expect(formatPdfTitle('price quote', 'en')).toBe('PRICE QUOTE');
        expect(formatPdfTitle('preisangebot', 'de')).toBe('PREISANGEBOT');
    });
});

describe('formatTaxOfficeDisplay', () => {
    it('should return empty string for null, undefined or empty values', () => {
        expect(formatTaxOfficeDisplay(null)).toBe('');
        expect(formatTaxOfficeDisplay(undefined)).toBe('');
        expect(formatTaxOfficeDisplay('')).toBe('');
        expect(formatTaxOfficeDisplay('   ')).toBe('');
    });

    it('should append label if not already containing tax office keywords', () => {
        expect(formatTaxOfficeDisplay('Pendik', 'V.D.')).toBe('Pendik (V.D.)');
        expect(formatTaxOfficeDisplay('Kadıköy')).toBe('Kadıköy (V.D.)');
    });

    it('should not duplicate label if it already has "Vergi Dairesi" or "V.D."', () => {
        expect(formatTaxOfficeDisplay('Pendik Vergi Dairesi', 'V.D.')).toBe('Pendik Vergi Dairesi');
        expect(formatTaxOfficeDisplay('Kadıköy V.D.', 'V.D.')).toBe('Kadıköy V.D.');
        expect(formatTaxOfficeDisplay('Marmara Kurumsal Vergi Dairesi Müdürlüğü')).toBe('Marmara Kurumsal Vergi Dairesi Müdürlüğü');
    });
});

describe('formatContactItems', () => {
    it('should filter out empty, null and undefined items', () => {
        expect(formatContactItems('+90 555 123 45 67', null, 'info@example.com', '', undefined, 'https://example.com')).toEqual([
            '+90 555 123 45 67',
            'info@example.com',
            'https://example.com'
        ]);
    });
});

describe('formatIban', () => {
    it('should return empty string for null, undefined or empty values', () => {
        expect(formatIban(null)).toBe('');
        expect(formatIban(undefined)).toBe('');
        expect(formatIban('')).toBe('');
    });

    it('should format 26-character Turkish IBAN into 4-character blocks', () => {
        const input = 'TR123456789012345678901234';
        expect(formatIban(input)).toBe('TR12 3456 7890 1234 5678 9012 34');
    });

    it('should strip existing spaces and special characters then reformat', () => {
        const input = 'tr12 3456-7890_1234 5678 9012 34';
        expect(formatIban(input)).toBe('TR12 3456 7890 1234 5678 9012 34');
    });
});

describe('getExportBlockReason', () => {
    const t = (key: string) => key;
    const validItems = [{ id: '1', name: 'Ürün A', quantity: 1, price: 100 }];

    it('blocks when there are no valid items', () => {
        expect(getExportBlockReason({ items: [], customerName: 'Ali', customerCompany: '' }, t)).toBe('addAtLeastOneProduct');
        expect(getExportBlockReason({ items: [{ id: '1', name: '   ' }], customerName: 'Ali', customerCompany: '' }, t)).toBe('addAtLeastOneProduct');
        expect(getExportBlockReason({ items: null, customerName: 'Ali', customerCompany: '' }, t)).toBe('addAtLeastOneProduct');
    });

    it('blocks when customer name and company are both missing', () => {
        expect(getExportBlockReason({ items: validItems, customerName: '', customerCompany: '' }, t)).toBe('validationCustomerRequired');
        expect(getExportBlockReason({ items: validItems, customerName: '   ', customerCompany: null }, t)).toBe('validationCustomerRequired');
    });

    it('allows export when items and customer (name or company) exist', () => {
        expect(getExportBlockReason({ items: validItems, customerName: 'Ali', customerCompany: '' }, t)).toBeNull();
        expect(getExportBlockReason({ items: validItems, customerName: '', customerCompany: 'ABC Ltd.' }, t)).toBeNull();
    });

    it('falls back to Turkish defaults without a translator', () => {
        expect(getExportBlockReason({ items: [] })).toContain('ürün');
        expect(getExportBlockReason({ items: validItems, customerName: '', customerCompany: '' })).toContain('müşteri');
    });
});
