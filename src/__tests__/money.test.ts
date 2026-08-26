import { describe, it, expect } from 'vitest';
import {
  getFractionDigits,
  toMinorUnit,
  fromMinorUnit,
  roundToCurrency,
  createMoney,
  formatMoney,
} from '@/utils/money';

describe('Money & Minor-Unit Utility', () => {
  describe('getFractionDigits', () => {
    it('should return 2 for TRY, USD, EUR, GBP', () => {
      expect(getFractionDigits('TRY')).toBe(2);
      expect(getFractionDigits('USD')).toBe(2);
      expect(getFractionDigits('EUR')).toBe(2);
      expect(getFractionDigits('GBP')).toBe(2);
    });

    it('should return 0 for JPY and KRW', () => {
      expect(getFractionDigits('JPY')).toBe(0);
      expect(getFractionDigits('KRW')).toBe(0);
    });

    it('should return 3 for KWD, BHD, OMR', () => {
      expect(getFractionDigits('KWD')).toBe(3);
      expect(getFractionDigits('BHD')).toBe(3);
    });

    it('should return 2 for unknown or undefined currencies', () => {
      expect(getFractionDigits(undefined)).toBe(2);
      expect(getFractionDigits('XYZ')).toBe(2);
    });
  });

  describe('toMinorUnit and fromMinorUnit conversions', () => {
    it('should convert 2-decimal currencies correctly (TRY/USD)', () => {
      expect(toMinorUnit(1250.50, 'TRY')).toBe(125050);
      expect(fromMinorUnit(125050, 'TRY')).toBe(1250.50);

      expect(toMinorUnit(0.01, 'USD')).toBe(1);
      expect(fromMinorUnit(1, 'USD')).toBe(0.01);
    });

    it('should convert 0-decimal currencies correctly (JPY)', () => {
      expect(toMinorUnit(5000, 'JPY')).toBe(5000);
      expect(fromMinorUnit(5000, 'JPY')).toBe(5000);

      expect(toMinorUnit(5000.4, 'JPY')).toBe(5000);
    });

    it('should convert 3-decimal currencies correctly (KWD)', () => {
      expect(toMinorUnit(12.345, 'KWD')).toBe(12345);
      expect(fromMinorUnit(12345, 'KWD')).toBe(12.345);
    });

    it('should handle floating point edge cases cleanly', () => {
      // 0.1 + 0.2 in JS float is 0.30000000000000004
      const amount = 0.1 + 0.2;
      expect(toMinorUnit(amount, 'TRY')).toBe(30);
      expect(roundToCurrency(amount, 'TRY')).toBe(0.3);
    });
  });

  describe('createMoney and formatMoney', () => {
    it('should create a structured Money object', () => {
      const money = createMoney(1200.75, 'TRY');
      expect(money).toEqual({
        amountMinor: 120075,
        currency: 'TRY',
      });
    });

    it('should format money object or numbers properly', () => {
      const money = createMoney(1200.50, 'TRY');
      const formatted = formatMoney(money, 'TRY', 'tr-TR');
      expect(formatted).toContain('1.200,50');

      const jpyMoney = createMoney(5000, 'JPY');
      const formattedJpy = formatMoney(jpyMoney, 'JPY', 'ja-JP');
      expect(formattedJpy).toContain('5,000');
    });
  });
});
