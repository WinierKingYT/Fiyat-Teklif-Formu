import { describe, it, expect } from 'vitest';
import { numberToWordsTurkish, numberToWordsEnglish, numberToWordsGerman, numberToWords } from '@/utils/numberToWordsTurkish';

describe('numberToWords', () => {
  it('converts basic amounts correctly in Turkish', () => {
    expect(numberToWordsTurkish(0, 'TRY')).toBe('Yalnız #Sıfır Türk Lirasıdır#');
    expect(numberToWordsTurkish(1, 'TRY')).toBe('Yalnız #Bir Türk Lirasıdır#');
    expect(numberToWordsTurkish(100, 'TRY')).toBe('Yalnız #Yüz Türk Lirasıdır#');
    expect(numberToWordsTurkish(1000, 'TRY')).toBe('Yalnız #Bin Türk Lirasıdır#');
  });

  it('converts complex numbers with decimals and currency names in Turkish', () => {
    expect(numberToWordsTurkish(24500.5, 'TRY')).toBe('Yalnız #Yirmi Dört Bin Beş Yüz Türk Lirası Elli Kuruştur#');
    expect(numberToWordsTurkish(1250, 'USD')).toBe('Yalnız #Bin İki Yüz Elli Amerikan Dolarıdır#');
    expect(numberToWordsTurkish(800.25, 'EUR')).toBe('Yalnız #Sekiz Yüz Euro Yirmi Beş Centtir#');
    expect(numberToWordsTurkish(150.00, 'EUR')).toBe('Yalnız #Yüz Elli Eurodur#');
  });

  it('converts amounts in English', () => {
    expect(numberToWordsEnglish(1500, 'USD')).toBe('Only #One Thousand Five Hundred US Dollars#');
    expect(numberToWordsEnglish(25.50, 'EUR')).toBe('Only #Twenty Five Euros and Fifty Cents#');
  });

  it('converts amounts in German', () => {
    expect(numberToWordsGerman(1500, 'EUR')).toBe('Nur #Eintausend Fünfhundert Euro#');
  });

  it('respects language parameter in universal numberToWords function', () => {
    expect(numberToWords(100, 'USD', 'en')).toBe('Only #One Hundred US Dollars#');
    expect(numberToWords(100, 'EUR', 'de')).toBe('Nur #Einhundert Euro#');
    expect(numberToWords(100, 'TRY', 'tr')).toBe('Yalnız #Yüz Türk Lirasıdır#');
  });

  it('handles invalid or empty inputs gracefully', () => {
    expect(numberToWords(NaN)).toBe('');
  });

  it('converts negative amounts with Eksi prefix', () => {
    expect(numberToWordsTurkish(-250, 'TRY')).toBe('Yalnız #Eksi İki Yüz Elli Türk Lirasıdır#');
  });
});
