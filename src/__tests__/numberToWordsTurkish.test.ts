import { describe, it, expect } from 'vitest';
import { numberToWordsTurkish } from '@/utils/numberToWordsTurkish';

describe('numberToWordsTurkish', () => {
  it('converts basic amounts correctly', () => {
    expect(numberToWordsTurkish(0, 'TRY')).toBe('Yalnız #Sıfır Türk Lirasıdır#');
    expect(numberToWordsTurkish(1, 'TRY')).toBe('Yalnız #Bir Türk Lirasıdır#');
    expect(numberToWordsTurkish(100, 'TRY')).toBe('Yalnız #Yüz Türk Lirasıdır#');
    expect(numberToWordsTurkish(1000, 'TRY')).toBe('Yalnız #Bin Türk Lirasıdır#');
  });

  it('converts complex numbers with decimals and currency names', () => {
    expect(numberToWordsTurkish(24500.5, 'TRY')).toBe('Yalnız #Yirmi Dört Bin Beş Yüz Türk Lirası Elli Kuruştur#');
    expect(numberToWordsTurkish(1250, 'USD')).toBe('Yalnız #Bin İki Yüz Elli Amerikan Dolarıdır#');
    expect(numberToWordsTurkish(800.25, 'EUR')).toBe('Yalnız #Sekiz Yüz Euro Yirmi Beş Centtir#');
    expect(numberToWordsTurkish(150.00, 'EUR')).toBe('Yalnız #Yüz Elli Eurodur#');
  });

  it('handles invalid or empty inputs gracefully', () => {
    expect(numberToWordsTurkish(NaN)).toBe('');
    expect(numberToWordsTurkish(null as unknown as number)).toBe('');
  });

  it('converts negative amounts with Eksi prefix', () => {
    expect(numberToWordsTurkish(-250, 'TRY')).toBe('Yalnız #Eksi İki Yüz Elli Türk Lirasıdır#');
  });
});
