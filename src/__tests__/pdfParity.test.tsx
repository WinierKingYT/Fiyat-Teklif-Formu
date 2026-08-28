import { render } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';
import PdfExportSurface from '@/components/PdfExportSurface';
import { getDefaultPdfConfig } from '@/context/quote/initialState';
import { chunkQuoteItems } from '@/utils/themeHelpers';
import type { QuoteData, CustomerData, CompanyData, BankData, QuoteItem, Discount } from '@/context/quote/types';

describe('PDF Export Parity & Non-Destructive Styles', () => {
    const mockQuoteData: QuoteData = {
        title: 'Fiyat Teklifi',
        number: 'TK-2026-99',
        date: '2026-08-28',
        validUntilDays: '15',
        currency: 'TRY',
        language: 'tr'
    };

    const mockCustomerData: CustomerData = {
        name: 'Ahmet Yılmaz',
        company: 'Yılmaz Mühendislik',
        email: 'ahmet@yilmaz.com',
        phone: '0555 123 4567',
        address: 'Atatürk Cad. No: 42 D: 5 Kadıköy / İstanbul',
        taxOffice: 'Kadıköy',
        taxNumber: '1234567890'
    };

    const mockCompanyData: CompanyData = {
        name: 'Pro Satıcı A.Ş.',
        authorized: 'Mehmet Satıcı',
        phone: '0212 999 8877',
        taxOffice: 'Beşiktaş',
        taxNumber: '9876543210'
    };

    const mockBankData: BankData = {
        bankName: 'Garanti BBVA',
        iban: 'TR12 0006 2000 0001 2345 6789 01'
    };

    const generateItems = (count: number, withDescriptions = false): QuoteItem[] => {
        return Array.from({ length: count }, (_, i) => ({
            id: `item-${i + 1}`,
            name: `Ürün / Hizmet Kalemi ${i + 1}`,
            description: withDescriptions ? `Detaylı teknik açıklama satır 1\nDetaylı teknik şartname satır 2\nKalem ${i + 1} için özel notlar.` : '',
            quantity: i + 1,
            price: (i + 1) * 100,
            taxRate: 20,
            total: (i + 1) * 100 * (i + 1),
            unit: 'Adet'
        }));
    };

    const mockDiscount: Discount = {
        type: 'percentage',
        value: 10
    };

    it('renders the dedicated canonical A4 surface with 210mm width and transform none', () => {
        const config = getDefaultPdfConfig();
        const { container } = render(
            <PdfExportSurface
                id="canonical-pdf-export-surface"
                quoteData={mockQuoteData}
                customerData={mockCustomerData}
                companyData={mockCompanyData}
                bankData={mockBankData}
                items={generateItems(1)}
                discount={mockDiscount}
                pdfConfig={config}
            />
        );

        const surfaceWrapper = container.querySelector('#pdf-export-surface-wrapper') as HTMLElement;
        expect(surfaceWrapper).toBeDefined();
        expect(surfaceWrapper.style.width).toBe('210mm');
        expect(surfaceWrapper.style.transform).toBe('none');
        expect(surfaceWrapper.style.zoom).toBe('1');
        expect(surfaceWrapper.style.boxShadow).toBe('none');

        const canonicalSurface = container.querySelector('#canonical-pdf-export-surface');
        expect(canonicalSurface).toBeDefined();
    });

    it('preserves theme page padding without destructive 0px resets', () => {
        const config = getDefaultPdfConfig();
        const { container } = render(
            <PdfExportSurface
                id="canonical-pdf-export-surface"
                quoteData={mockQuoteData}
                customerData={mockCustomerData}
                companyData={mockCompanyData}
                bankData={mockBankData}
                items={generateItems(1)}
                discount={mockDiscount}
                pdfConfig={config}
            />
        );

        const pages = container.querySelectorAll('.pdf-page');
        expect(pages.length).toBeGreaterThan(0);
        const firstPage = pages[0] as HTMLElement;
        expect(firstPage.style.padding).toBe('1.25rem');
    });

    it('chunks 1 item into exactly 1 page', () => {
        const chunks = chunkQuoteItems(generateItems(1), {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true
        });
        expect(chunks.length).toBe(1);
        expect(chunks[0].length).toBe(1);
    });

    it('chunks 5 items into exactly 1 page', () => {
        const chunks = chunkQuoteItems(generateItems(5), {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true
        });
        expect(chunks.length).toBe(1);
        expect(chunks[0].length).toBe(5);
    });

    it('chunks 11 items with bank and signature into exactly 2 pages with maximized page utilization and no orphan items', () => {
        const chunks = chunkQuoteItems(generateItems(11), {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true
        });
        expect(chunks.length).toBe(2);
        // Page 1 maximizes utilization (7 to 9 items), Page 2 cleanly holds the rest (>= 2)
        expect(chunks[0].length).toBeGreaterThanOrEqual(7);
        expect(chunks[0].length).toBeLessThanOrEqual(9);
        expect(chunks[1].length).toBeGreaterThanOrEqual(2);
        expect(chunks[1].length).toBe(11 - chunks[0].length);
    });

    it('chunks 15 items into exactly 2 pages', () => {
        const chunks = chunkQuoteItems(generateItems(15), {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true
        });
        expect(chunks.length).toBe(2);
        expect(chunks[0].length).toBeGreaterThanOrEqual(7);
        expect(chunks[1].length).toBe(15 - chunks[0].length);
    });

    it('chunks 25 items into exactly 3 pages', () => {
        const chunks = chunkQuoteItems(generateItems(25), {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true
        });
        expect(chunks.length).toBe(3);
    });

    it('accounts for multiline descriptions so they paginate without overflowing', () => {
        const longItems = generateItems(7, true);
        const chunks = chunkQuoteItems(longItems, {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true
        });
        // 7 multiline items with full bottom section cannot fit on 1 single page; it paginates to 2
        expect(chunks.length).toBe(2);
    });

    it('renders 11 items with full details across exactly 2 explicit .pdf-page elements in ModernTheme', () => {
        const config = getDefaultPdfConfig();
        const { container } = render(
            <PdfExportSurface
                id="canonical-pdf-export-surface"
                quoteData={{ ...mockQuoteData, terms: 'Ödeme %50 peşin, %50 teslimatta.', notes: 'Teklif 15 gün geçerlidir.' }}
                customerData={mockCustomerData}
                companyData={mockCompanyData}
                bankData={mockBankData}
                items={generateItems(11)}
                discount={mockDiscount}
                pdfConfig={config}
            />
        );

        const pages = container.querySelectorAll('.pdf-page');
        expect(pages.length).toBe(2);

        // Page 1 header has full company & customer
        expect(pages[0].querySelector('.customer-section')).not.toBeNull();

        // Page 2 continuation header is compact
        expect(pages[1].querySelector('.customer-section')).toBeNull();

        // Page 2 bottom section has summary & signatures
        expect(pages[1].querySelector('.pdf-summary-grid')).not.toBeNull();
        expect(pages[1].querySelector('.signature-section')).not.toBeNull();
    });
});
