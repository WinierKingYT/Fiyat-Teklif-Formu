import { describe, it, expect } from 'vitest';
import { getLocalDateString, getLocalDateTimeString, formatLocalDate } from '../utils/dateUtils';

describe('dateUtils', () => {
  describe('getLocalDateString', () => {
    it('returns YYYY-MM-DD format for a given date', () => {
      const date = new Date(2025, 0, 15); // Jan 15, 2025
      expect(getLocalDateString(date)).toBe('2025-01-15');
    });
    it('uses current date when no argument', () => {
      const result = getLocalDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getLocalDateTimeString', () => {
    it('returns ISO-like string without Z', () => {
      const date = new Date(2025, 5, 15, 10, 30, 0);
      const result = getLocalDateTimeString(date);
      expect(result).not.toContain('Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('formatLocalDate', () => {
    it('formats YYYY-MM-DD to DD.MM.YYYY', () => {
      expect(formatLocalDate('2025-01-15')).toBe('15.01.2025');
    });
    it('returns "-" for empty input', () => {
      expect(formatLocalDate('')).toBe('-');
    });
    it('returns original string on invalid input', () => {
      expect(formatLocalDate('not-a-date')).toBe('NaN.NaN.NaN');
    });
  });
});
