import { describe, it, expect } from 'vitest';
import { getDefaultPdfConfig } from '@/context/quote/initialState';
import { parseStoredPdfConfig } from '@/context/quote/PdfConfigContext';
import {
  quoteItemSchema,
  discountSchema,
  companyDataSchema,
  bankDataSchema,
  quoteDataSchema,
  customerDataSchema,
  pdfConfigSchema,
} from '@/context/quote/types';

describe('quoteItemSchema', () => {
  it('should accept valid item', () => {
    const result = quoteItemSchema.safeParse({
      id: '1',
      name: 'Test Item',
      quantity: 2,
      price: 100,
      taxRate: 20,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(2);
      expect(result.data.price).toBe(100);
    }
  });

  it('should reject item without name', () => {
    const result = quoteItemSchema.safeParse({
      id: '1',
      name: '',
      quantity: 1,
      price: 100,
      taxRate: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject item with zero quantity', () => {
    const result = quoteItemSchema.safeParse({
      id: '1',
      name: 'Item',
      quantity: 0,
      price: 100,
      taxRate: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should transform string quantity to number', () => {
    const result = quoteItemSchema.safeParse({
      id: '1',
      name: 'Item',
      quantity: '5',
      price: '100',
      taxRate: '20',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(5);
      expect(result.data.price).toBe(100);
      expect(result.data.taxRate).toBe(20);
    }
  });

  it('should accept negative price (nonnegative allows 0)', () => {
    const result = quoteItemSchema.safeParse({
      id: '1',
      name: 'Item',
      quantity: 1,
      price: -1,
      taxRate: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should accept item with optional discountRate', () => {
    const result = quoteItemSchema.safeParse({
      id: '1',
      name: 'Item',
      quantity: 1,
      price: 100,
      taxRate: 0,
      discountRate: 15,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discountRate).toBe(15);
    }
  });

  it('should accept item without optional fields', () => {
    const result = quoteItemSchema.safeParse({
      id: '1',
      name: 'Item',
      quantity: 1,
      price: 50,
      taxRate: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe('discountSchema', () => {
  it('should accept percentage discount', () => {
    const result = discountSchema.safeParse({ type: 'percentage', value: 10 });
    expect(result.success).toBe(true);
  });

  it('should accept fixed discount', () => {
    const result = discountSchema.safeParse({ type: 'fixed', value: 50 });
    expect(result.success).toBe(true);
  });

  it('should accept zero value', () => {
    const result = discountSchema.safeParse({ type: 'percentage', value: 0 });
    expect(result.success).toBe(true);
  });

  it('should reject invalid type', () => {
    const result = discountSchema.safeParse({ type: 'invalid', value: 10 });
    expect(result.success).toBe(false);
  });

  it('should reject negative value', () => {
    const result = discountSchema.safeParse({ type: 'fixed', value: -5 });
    expect(result.success).toBe(false);
  });
});

describe('companyDataSchema', () => {
  it('should accept empty object', () => {
    const result = companyDataSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept null for logo/signature/stamp', () => {
    const result = companyDataSchema.safeParse({
      logo: null,
      signature: null,
      stamp: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept string for logo/signature/stamp', () => {
    const result = companyDataSchema.safeParse({
      logo: 'https://example.com/logo.png',
      signature: 'data:image/png;base64,...',
      stamp: 'data:image/png;base64,...',
    });
    expect(result.success).toBe(true);
  });
});

describe('bankDataSchema', () => {
  it('should accept empty object', () => {
    const result = bankDataSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept full bank data', () => {
    const result = bankDataSchema.safeParse({
      bankName: 'Ziraat Bankası',
      branch: 'Merkez',
      accountHolder: 'Ahmet Yılmaz',
      accountNumber: '12345678',
      iban: 'TR123456789012345678901234',
    });
    expect(result.success).toBe(true);
  });
});

describe('quoteDataSchema', () => {
  it('should accept empty object', () => {
    const result = quoteDataSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept full quote data', () => {
    const result = quoteDataSchema.safeParse({
      title: 'Hizmet Teklifi',
      number: 'TKL-2026-001',
      date: '2026-08-17',
      currency: 'TRY',
      language: 'tr',
    });
    expect(result.success).toBe(true);
  });
});

describe('customerDataSchema', () => {
  it('should accept empty object', () => {
    const result = customerDataSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept full customer data', () => {
    const result = customerDataSchema.safeParse({
      name: 'Müşteri A.Ş.',
      company: 'Müşteri A.Ş.',
      email: 'info@musteri.com',
      phone: '+90 212 555 1234',
    });
    expect(result.success).toBe(true);
  });
});

describe('pdfConfigSchema and getDefaultPdfConfig', () => {
  it('should validate getDefaultPdfConfig successfully', () => {
    const defaultConfig = getDefaultPdfConfig();
    const result = pdfConfigSchema.safeParse(defaultConfig);
    expect(result.success).toBe(true);
  });

  it('keeps valid stored settings and removes unknown fields', () => {
    const config = parseStoredPdfConfig(JSON.stringify({
      color: '#ff0000',
      tableCellPadding: '4px',
      removedFeature: true,
    }));

    expect(config.color).toBe('#ff0000');
    expect(config.tableCellPadding).toBe('4px');
    expect(config).not.toHaveProperty('removedFeature');
  });

  it('falls back to defaults when a stored setting has an invalid type', () => {
    const config = parseStoredPdfConfig(JSON.stringify({ itemsPerPage: 'invalid' }));

    expect(config).toEqual(getDefaultPdfConfig());
  });
});
