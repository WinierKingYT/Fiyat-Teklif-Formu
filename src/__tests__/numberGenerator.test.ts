import { describe, it, expect } from 'vitest';
import {
    formatNumberTemplate,
    checkAndResetCounter,
    previewQuoteNumber,
    generateNextQuoteNumber,
    NUMBER_PRESETS
} from '@/utils/numberGenerator';
import type { QuoteNumberConfig } from '@/context/quote/types';

describe('numberGenerator', () => {
    const fixedDate = new Date(2026, 7, 21); // 2026-08-21

    it('should format standard template correctly', () => {
        const result = formatNumberTemplate('{PREFIX}-{YYYY}{MM}-{INDEX:4}', 'TK', 1, fixedDate);
        expect(result).toBe('TK-202608-0001');
    });

    it('should format yearly template correctly with custom padding', () => {
        const result = formatNumberTemplate('{PREFIX}/{YYYY}/{INDEX:3}', 'OFFER', 42, fixedDate);
        expect(result).toBe('OFFER/2026/042');
    });

    it('should format short template correctly', () => {
        const result = formatNumberTemplate('{PREFIX}-{INDEX:4}', 'ACME', 123, fixedDate);
        expect(result).toBe('ACME-0123');
    });

    it('should support YY and DD format variables', () => {
        const result = formatNumberTemplate('{PREFIX}-{YY}{MM}{DD}-{INDEX:2}', 'D', 7, fixedDate);
        expect(result).toBe('D-260821-07');
    });

    it('should support RANDOM variable', () => {
        const result = formatNumberTemplate('{PREFIX}-{RANDOM:4}', 'R', 1, fixedDate);
        expect(result).toMatch(/^R-[A-Z0-9]{4}$/);
    });

    it('should preview quote number without changing counter', () => {
        const config: QuoteNumberConfig = {
            template: '{PREFIX}-{YYYY}-{INDEX:4}',
            prefix: 'TK',
            counter: 5,
            resetPeriod: 'never'
        };
        const preview = previewQuoteNumber(config, fixedDate);
        expect(preview).toBe('TK-2026-0005');
        expect(config.counter).toBe(5);
    });

    it('should generate next quote number and increment counter', () => {
        const config: QuoteNumberConfig = {
            template: '{PREFIX}-{YYYY}-{INDEX:4}',
            prefix: 'TK',
            counter: 5,
            resetPeriod: 'never'
        };
        const { formattedNumber, updatedConfig } = generateNextQuoteNumber(config, fixedDate);
        expect(formattedNumber).toBe('TK-2026-0005');
        expect(updatedConfig.counter).toBe(6);
    });

    it('should reset counter on year change when resetPeriod is yearly', () => {
        const config: QuoteNumberConfig = {
            template: '{PREFIX}-{YYYY}-{INDEX:4}',
            prefix: 'TK',
            counter: 150,
            resetPeriod: 'yearly',
            lastResetDate: '2025'
        };
        const checked = checkAndResetCounter(config, fixedDate);
        expect(checked.counter).toBe(1);
        expect(checked.lastResetDate).toBe('2026');
    });

    it('should reset counter on month change when resetPeriod is monthly', () => {
        const config: QuoteNumberConfig = {
            template: '{PREFIX}-{YYYY}{MM}-{INDEX:4}',
            prefix: 'TK',
            counter: 88,
            resetPeriod: 'monthly',
            lastResetDate: '2026-07'
        };
        const checked = checkAndResetCounter(config, fixedDate);
        expect(checked.counter).toBe(1);
        expect(checked.lastResetDate).toBe('2026-08');
    });

    it('should reset counter on day change when resetPeriod is daily', () => {
        const config: QuoteNumberConfig = {
            template: '{PREFIX}-{YYYY}{MM}{DD}-{INDEX:2}',
            prefix: 'TK',
            counter: 12,
            resetPeriod: 'daily',
            lastResetDate: '2026-08-20',
            series: [{ id: 's1', name: 'S1', prefix: 'TK', template: '{PREFIX}-{INDEX}', counter: 12 }]
        };
        const checked = checkAndResetCounter(config, fixedDate);
        expect(checked.counter).toBe(1);
        expect(checked.series?.[0].counter).toBe(1);
        expect(checked.lastResetDate).toBe('2026-08-21');
    });

    it('should not reset counter when in same period', () => {
        const config: QuoteNumberConfig = {
            template: '{PREFIX}-{YYYY}-{INDEX:4}',
            prefix: 'TK',
            counter: 42,
            resetPeriod: 'yearly',
            lastResetDate: '2026'
        };
        const checked = checkAndResetCounter(config, fixedDate);
        expect(checked.counter).toBe(42);
    });

    it('should handle series properly in generateNextQuoteNumber', () => {
        const config: QuoteNumberConfig = {
            template: '{PREFIX}-{INDEX:4}',
            prefix: 'TK',
            counter: 1,
            resetPeriod: 'never',
            series: [
                { id: 'default', name: 'Standart', prefix: 'TK', template: '{PREFIX}-{INDEX:4}', counter: 10 },
                { id: 'export', name: 'İhracat', prefix: 'EXP', template: '{PREFIX}/{YYYY}/{INDEX:3}', counter: 20 }
            ],
            activeSeriesId: 'export'
        };

        const { formattedNumber, updatedConfig } = generateNextQuoteNumber(config, fixedDate);
        expect(formattedNumber).toBe('EXP/2026/020');
        const exportSeries = updatedConfig.series?.find(s => s.id === 'export');
        expect(exportSeries?.counter).toBe(21);
    });

    it('has all expected presets defined', () => {
        expect(NUMBER_PRESETS.length).toBeGreaterThanOrEqual(5);
        expect(NUMBER_PRESETS.map(p => p.id)).toContain('standard');
        expect(NUMBER_PRESETS.map(p => p.id)).toContain('yearly');
    });
});
