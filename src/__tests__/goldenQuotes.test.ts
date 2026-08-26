import { describe, it, expect } from 'vitest';
import { type QuoteItem, type Discount, type DbQuote } from '@/context/quote/types';
import { calculateQuoteTotals } from '@/utils/calculations';
import { toMinorUnit, fromMinorUnit } from '@/utils/money';

describe('Golden Financial Quotes Benchmark Suite', () => {
  // CASE 01: 1000 TL, 20% VAT (exclusive) -> Subtotal: 1000 TL, Tax: 200 TL, GrandTotal: 1200 TL
  it('CASE 01: Standard single item with 20% VAT exclusive', () => {
    const items: QuoteItem[] = [
      { id: '1', name: 'Ürün A', quantity: 1, price: 1000, taxRate: 20, unit: 'Adet', total: 1000 },
    ];
    const discount: Discount = { type: 'fixed', value: 0 };
    const res = calculateQuoteTotals(items, discount, { currency: 'TRY' });

    expect(res.subtotal).toBe(1000);
    expect(res.taxTotal).toBe(200);
    expect(res.grandTotal).toBe(1200);
    expect(toMinorUnit(res.grandTotal, 'TRY')).toBe(120000);
  });

  // CASE 02: 1000 TL, 10% line discount, 20% VAT -> Gross: 1000, Net: 900, Tax: 180, GrandTotal: 1080
  it('CASE 02: Single item with 10% line discount and 20% VAT', () => {
    const items: QuoteItem[] = [
      {
        id: '1',
        name: 'Hizmet B',
        quantity: 1,
        price: 1000,
        taxRate: 20,
        discountRate: 10,
        discountType: 'percentage',
        unit: 'Saat',
        total: 900,
      },
    ];
    const discount: Discount = { type: 'fixed', value: 0 };
    const res = calculateQuoteTotals(items, discount, { currency: 'TRY' });

    expect(res.subtotal).toBe(1000);
    expect(res.lineDiscountTotal).toBe(100);
    expect(res.netTotal).toBe(900);
    expect(res.taxTotal).toBe(180);
    expect(res.grandTotal).toBe(1080);
    expect(toMinorUnit(res.grandTotal, 'TRY')).toBe(108000);
  });

  // CASE 03: 1000 TL VAT inclusive, 20% -> Base: 833.33, Tax: 166.67, GrandTotal: 1000
  it('CASE 03: Tax-inclusive pricing (1000 TL inclusive @ 20% VAT)', () => {
    const items: QuoteItem[] = [
      { id: '1', name: 'KDV Dahil Ürün', quantity: 1, price: 1000, taxRate: 20, unit: 'Adet', total: 1000 },
    ];
    const discount: Discount = { type: 'fixed', value: 0 };
    const res = calculateQuoteTotals(items, discount, { currency: 'TRY', taxMode: 'inclusive' });

    expect(res.subtotal).toBe(833.33);
    expect(res.taxTotal).toBe(166.67);
    expect(res.grandTotal).toBe(1000);
  });

  // CASE 04: Mixed VAT rates (%10 and %20)
  it('CASE 04: Multiple items with mixed VAT rates (%10 and %20)', () => {
    const items: QuoteItem[] = [
      { id: '1', name: 'Gıda (%10 KDV)', quantity: 2, price: 500, taxRate: 10, unit: 'Kg', total: 1000 },
      { id: '2', name: 'Yazılım (%20 KDV)', quantity: 1, price: 2000, taxRate: 20, unit: 'Lisans', total: 2000 },
    ];
    const discount: Discount = { type: 'fixed', value: 0 };
    const res = calculateQuoteTotals(items, discount, { currency: 'TRY' });

    expect(res.subtotal).toBe(3000);
    expect(res.taxBreakdown['10']).toBe(100);
    expect(res.taxBreakdown['20']).toBe(400);
    expect(res.taxTotal).toBe(500);
    expect(res.grandTotal).toBe(3500);
  });

  // CASE 05: Global fixed discount (500 TL fixed discount on 2000 TL net)
  it('CASE 05: Global fixed discount with proportional tax reduction', () => {
    const items: QuoteItem[] = [
      { id: '1', name: 'Ürün (%20 KDV)', quantity: 2, price: 1000, taxRate: 20, unit: 'Adet', total: 2000 },
    ];
    const discount: Discount = { type: 'fixed', value: 500 };
    const res = calculateQuoteTotals(items, discount, { currency: 'TRY' });

    expect(res.subtotal).toBe(2000);
    expect(res.globalDiscountAmount).toBe(500);
    expect(res.taxableBase).toBe(1500);
    expect(res.taxTotal).toBe(300); // 1500 * 20% = 300
    expect(res.grandTotal).toBe(1800);
  });

  // CASE 06: Line fixed discount + global percentage discount
  it('CASE 06: Line fixed discount combined with global percentage discount', () => {
    const items: QuoteItem[] = [
      {
        id: '1',
        name: 'Ürün C',
        quantity: 1,
        price: 1000,
        taxRate: 20,
        discountType: 'fixed',
        discountRate: 200, // 200 TL line discount -> net = 800
        unit: 'Adet',
        total: 800,
      },
    ];
    const discount: Discount = { type: 'percentage', value: 10 }; // 10% global discount on 800 = 80 TL -> taxable = 720
    const res = calculateQuoteTotals(items, discount, { currency: 'TRY' });

    expect(res.subtotal).toBe(1000);
    expect(res.lineDiscountTotal).toBe(200);
    expect(res.netTotal).toBe(800);
    expect(res.globalDiscountAmount).toBe(80);
    expect(res.taxableBase).toBe(720);
    expect(res.taxTotal).toBe(144); // 720 * 20% = 144
    expect(res.grandTotal).toBe(864);
  });

  // CASE 07: Multi-currency canonical checks (TRY, EUR, JPY)
  it('CASE 07: Multi-currency handling (JPY with 0 decimals)', () => {
    const jpyItems: QuoteItem[] = [
      { id: '1', name: 'Tokyo Item', quantity: 3, price: 1500, taxRate: 10, unit: 'Pcs', total: 4500 },
    ];
    const discount: Discount = { type: 'fixed', value: 0 };
    const res = calculateQuoteTotals(jpyItems, discount, { currency: 'JPY' });

    expect(res.subtotal).toBe(4500);
    expect(res.taxTotal).toBe(450);
    expect(res.grandTotal).toBe(4950);
    // In JPY, minor units have 0 decimal digits
    expect(toMinorUnit(res.grandTotal, 'JPY')).toBe(4950);
    expect(fromMinorUnit(4950, 'JPY')).toBe(4950);
  });

  // CASE 08: 100 items bulk calculation precision
  it('CASE 08: 100 items bulk calculation with no rounding drift', () => {
    const items: QuoteItem[] = Array.from({ length: 100 }, (_, i) => ({
      id: String(i + 1),
      name: `Kalem ${i + 1}`,
      quantity: 3,
      price: 33.33,
      taxRate: 20,
      unit: 'Adet',
      total: 99.99,
    }));
    const discount: Discount = { type: 'fixed', value: 0 };
    const res = calculateQuoteTotals(items, discount, { currency: 'TRY' });

    expect(res.subtotal).toBe(9999);
    expect(res.taxTotal).toBe(1999.8);
    expect(res.grandTotal).toBe(11998.8);
    expect(toMinorUnit(res.grandTotal, 'TRY')).toBe(1199880);
  });

  // CASE 09: Cross-surface persistence representation (DbQuote)
  it('CASE 09: Canonical DbQuote persistence representation matches engine totals', () => {
    const items: QuoteItem[] = [
      { id: '1', name: 'Sunucu Kurulumu', quantity: 1, price: 5000, taxRate: 20, unit: 'Adet', total: 5000 },
      { id: '2', name: 'Bakım Anlaşması', quantity: 12, price: 500, taxRate: 20, unit: 'Ay', total: 6000 },
    ];
    const discount: Discount = { type: 'percentage', value: 5 }; // 5% discount on 11,000 = 550 TL -> base = 10,450 TL
    const res = calculateQuoteTotals(items, discount, { currency: 'TRY' });

    const dbQuote: Partial<DbQuote> = {
      subtotalMinor: toMinorUnit(res.subtotal, 'TRY'),
      taxTotalMinor: toMinorUnit(res.taxTotal, 'TRY'),
      grandTotalMinor: toMinorUnit(res.grandTotal, 'TRY'),
    };

    expect(dbQuote.subtotalMinor).toBe(1100000);
    expect(dbQuote.taxTotalMinor).toBe(209000);
    expect(dbQuote.grandTotalMinor).toBe(1254000);

    expect(fromMinorUnit(dbQuote.grandTotalMinor!, 'TRY')).toBe(res.grandTotal);
  });
});
