import { describe, it, expect } from 'vitest';
import { getAdjustedFontSize } from '@/utils/themeHelpers';

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
