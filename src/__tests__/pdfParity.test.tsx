import { render } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';
import PdfExportSurface from '@/components/PdfExportSurface';
import { getDefaultPdfConfig } from '@/context/quote/initialState';
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

    const mockItems: QuoteItem[] = [
        {
            id: 'item-1',
            name: 'Sunucu Bakım Paketi',
            quantity: 2,
            price: 1500,
            taxRate: 20,
            total: 3000,
            unit: 'Adet'
        }
    ];

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
                items={mockItems}
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
                items={mockItems}
                discount={mockDiscount}
                pdfConfig={config}
            />
        );

        const pages = container.querySelectorAll('.pdf-page');
        expect(pages.length).toBeGreaterThan(0);
        const firstPage = pages[0] as HTMLElement;
        expect(firstPage.style.padding).toBe('1.25rem');
    });
});
