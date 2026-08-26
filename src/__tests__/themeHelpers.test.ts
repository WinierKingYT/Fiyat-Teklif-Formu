import { describe, it, expect } from 'vitest';
import { getAdjustedFontSize, chunkQuoteItems, formatIban, formatTaxOfficeDisplay, formatContactItems } from '@/utils/themeHelpers';

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

    it('should respect custom itemsPerPage when specified and different from 14', () => {
        const items = Array.from({ length: 6 }, (_, i) => i + 1);
        const chunks = chunkQuoteItems(items, { itemsPerPage: 2 });
        expect(chunks.length).toBe(3);
        expect(chunks[0]).toEqual([1, 2]);
        expect(chunks[1]).toEqual([3, 4]);
        expect(chunks[2]).toEqual([5, 6]);
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
