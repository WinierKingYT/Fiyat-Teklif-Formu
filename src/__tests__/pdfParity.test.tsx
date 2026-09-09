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

    it('keeps 11 plain items with bank and signature on exactly 1 page (no orphaned summary)', () => {
        const chunks = chunkQuoteItems(generateItems(11), {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true
        });
        expect(chunks.length).toBe(1);
        expect(chunks[0].length).toBe(11);
    });

    it('keeps 14 plain items on exactly 1 page (CASE 1: dense-plain)', () => {
        const chunks = chunkQuoteItems(generateItems(14), {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true
        });
        expect(chunks.length).toBe(1);
        expect(chunks[0].length).toBe(14);
    });

    it('keeps 14 image items on exactly 1 page (CASE 3: dense-image, modern)', () => {
        const withImages = generateItems(14).map((item) => ({ ...item, image: 'data:image/png;base64,abc' }));
        const chunks = chunkQuoteItems(withImages, {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true
        });
        expect(chunks.length).toBe(1);
        expect(chunks.flat()).toHaveLength(14);
    });

    it('keeps 14 image rows with short descriptions on 1 page (CASE 4)', () => {
        const items = Array.from({ length: 14 }, (_, i) => ({
            id: `item-${i + 1}`,
            name: `Ürün ${i + 1}`,
            description: 'Kısa tek satır açıklama',
            quantity: 1,
            price: 100,
            taxRate: 20,
            total: 100,
            unit: 'Adet'
        })).map((item) => ({ ...item, image: 'data:image/png;base64,abc' }));
        const chunks = chunkQuoteItems(items, {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true
        });
        expect(chunks.length).toBe(1);
        expect(chunks.flat()).toHaveLength(14);
    });

    it('paginates 14 image rows with very long descriptions safely (CASE 6)', () => {
        const items = Array.from({ length: 14 }, (_, i) => ({
            id: `item-${i + 1}`,
            name: `Ürün ${i + 1}`,
            description: 'Uzun açıklama. '.repeat(30),
            quantity: 1,
            price: 100,
            taxRate: 20,
            total: 100,
            unit: 'Adet'
        })).map((item) => ({ ...item, image: 'data:image/png;base64,abc' }));
        const chunks = chunkQuoteItems(items, {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true
        });
        expect(chunks.length).toBeGreaterThan(1);
        expect(chunks.flat()).toHaveLength(14);
    });

    it('does not squeeze 15 items — paginates into exactly 2 pages', () => {
        const chunks = chunkQuoteItems(generateItems(15), {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true
        });
        expect(chunks.length).toBe(2);
        expect(chunks.flat()).toHaveLength(15);
    });

    it('keeps 13 image rows on exactly 1 page (dense-image)', () => {
        const withImages = generateItems(13).map((item) => ({ ...item, image: 'data:image/png;base64,abc' }));
        const chunks = chunkQuoteItems(withImages, {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true
        });
        expect(chunks.length).toBe(1);
        expect(chunks.flat()).toHaveLength(13);
    });

    it('keeps 11 rows with a single image on one page (fitsTwelve)', () => {
        const withImages = generateItems(11).map((item, i) => i === 0 ? { ...item, image: 'data:image/png;base64,abc' } : item);
        const chunks = chunkQuoteItems(withImages, {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true
        });
        expect(chunks.length).toBe(1);
        expect(chunks.flat()).toHaveLength(11);
    });

    it('keeps 12 image rows on exactly 1 page (dense-image, modern)', () => {
        const withImages = generateItems(12).map((item) => ({ ...item, image: 'data:image/png;base64,abc' }));
        const chunks = chunkQuoteItems(withImages, {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true
        });
        expect(chunks.length).toBe(1);
        expect(chunks.flat()).toHaveLength(12);
    });

    it('keeps 10 image rows on one page (fitsTwelve)', () => {
        const withImages = generateItems(10).map((item) => ({ ...item, image: 'data:image/png;base64,abc' }));
        const chunks = chunkQuoteItems(withImages, {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true
        });
        expect(chunks.length).toBe(1);
        expect(chunks.flat()).toHaveLength(10);
    });

    // 12 two-line rows + terms fit one compact page (dense-plain). Under the old
    // comfortable-only model this overflowed; the compact render is E2E-measured
    // in e2e/pdf-density.spec.ts — if that fixture ever overflows, revisit the cap.
    it('keeps 12 described items with terms on a single dense page', () => {
        const items = Array.from({ length: 12 }, (_, i) => ({
            id: `item-${i + 1}`,
            name: `Kurumsal Web Sitesi Tasarımı ve Geliştirme ${i + 1}`,
            description: 'Responsive ve SEO uyumlu özel arayüz tasarımı',
            quantity: 1,
            price: 100,
            taxRate: 20,
            total: 100,
            unit: 'Adet'
        }));
        const chunks = chunkQuoteItems(items, {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true,
            showTerms: true,
            hasTerms: true
        });
        expect(chunks.length).toBe(1);
        expect(chunks.flat()).toHaveLength(12);
    });

    // Regression: 10 described items + terms fit a single squeezed page.
    it('keeps 10 described items with terms on a single page', () => {
        const items = Array.from({ length: 10 }, (_, i) => ({
            id: `item-${i + 1}`,
            name: `Bulut Sunucu ve Güvenlik Altyapısı ${i + 1}`,
            description: 'Yıllık yüksek erişilebilir bulut sunucu paketi',
            quantity: 1,
            price: 100,
            taxRate: 20,
            total: 100,
            unit: 'Adet'
        }));
        const chunks = chunkQuoteItems(items, {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true,
            showTerms: true,
            hasTerms: true
        });
        expect(chunks.length).toBe(1);
        expect(chunks[0]).toHaveLength(10);
    });

    it('does not squeeze when spacious density is explicitly set', () => {
        const chunks = chunkQuoteItems(generateItems(11), {
            hasCustomer: true,
            hasBankData: true,
            showSummary: true,
            showSignatures: true,
            tableDensity: 'spacious'
        });
        expect(chunks.length).toBe(2);
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

    it('filters out empty product rows from chunkQuoteItems and PDF export', () => {
        const mixedItems: QuoteItem[] = [
            { id: '1', name: 'Gerçek Ürün 1', quantity: 1, price: 100, taxRate: 20, total: 100, unit: 'Adet' },
            { id: '2', name: '', quantity: 1, price: 0, taxRate: 20, total: 0, unit: 'Adet' },
            { id: '3', name: '   ', quantity: 0, price: 0, taxRate: 20, total: 0, unit: 'Adet' },
            { id: '4', name: 'Gerçek Ürün 2', quantity: 2, price: 250, taxRate: 20, total: 500, unit: 'Adet' },
            { id: '5', name: '', quantity: 1, price: 0, taxRate: 20, total: 0, unit: 'Adet' }
        ];

        const chunks = chunkQuoteItems(mixedItems);
        expect(chunks.length).toBe(1);
        expect(chunks[0].length).toBe(2);
        expect(chunks[0].map(i => i.name)).toEqual(['Gerçek Ürün 1', 'Gerçek Ürün 2']);
    });

    it('allows 0 TL items with valid product names in PDF export and renders them accurately', () => {
        const zeroPriceItems: QuoteItem[] = [
            { id: '1', name: 'Ücretsiz Kurulum & Destek', quantity: 1, price: 0, taxRate: 20, total: 0, unit: 'Adet' }
        ];

        const chunks = chunkQuoteItems(zeroPriceItems);
        expect(chunks.length).toBe(1);
        expect(chunks[0].length).toBe(1);
        expect(chunks[0][0].name).toBe('Ücretsiz Kurulum & Destek');

        const config = getDefaultPdfConfig();
        const { container } = render(
            <PdfExportSurface
                id="canonical-pdf-export-surface"
                quoteData={mockQuoteData}
                customerData={mockCustomerData}
                companyData={mockCompanyData}
                bankData={mockBankData}
                items={zeroPriceItems}
                discount={mockDiscount}
                pdfConfig={config}
            />
        );

        expect(container.textContent).toContain('Ücretsiz Kurulum & Destek');
        expect(container.textContent).toContain('₺0,00');
    });

    it('completely suppresses customer box when customerData is empty', () => {
        const config = getDefaultPdfConfig();
        const emptyCustomer: CustomerData = {
            name: '',
            company: '',
            email: '',
            phone: '',
            address: '',
            taxOffice: '',
            taxNumber: ''
        };

        const { container } = render(
            <PdfExportSurface
                id="canonical-pdf-export-surface"
                quoteData={mockQuoteData}
                customerData={emptyCustomer}
                companyData={mockCompanyData}
                bankData={mockBankData}
                items={generateItems(3)}
                discount={mockDiscount}
                pdfConfig={config}
            />
        );

        expect(container.querySelector('.customer-section')).toBeNull();
    });

    it('suppresses empty bank info box and does not render placeholder dashes', () => {
        const config = getDefaultPdfConfig();
        const emptyBankData: BankData = {
            bankName: '',
            branch: '',
            accountNumber: '',
            iban: '',
            accountHolder: ''
        };

        const { container } = render(
            <PdfExportSurface
                id="canonical-pdf-export-surface"
                quoteData={mockQuoteData}
                customerData={mockCustomerData}
                companyData={mockCompanyData}
                bankData={emptyBankData}
                items={generateItems(3)}
                discount={mockDiscount}
                pdfConfig={config}
            />
        );

        expect(container.querySelector('.payment-info-box')).toBeNull();
        expect(container.textContent).not.toContain('Belirtilmemiş');
        expect(container.textContent).not.toContain('Firma Adı');
    });

    it('renders only company and authorized name when other customer fields are empty', () => {
        const config = getDefaultPdfConfig();
        const partialCustomer: CustomerData = {
            name: 'Ali Yılmaz',
            company: 'Yılmaz İnşaat Ltd.',
            email: '',
            phone: '',
            address: '',
            taxOffice: '',
            taxNumber: ''
        };

        const { container } = render(
            <PdfExportSurface
                id="canonical-pdf-export-surface"
                quoteData={mockQuoteData}
                customerData={partialCustomer}
                companyData={mockCompanyData}
                bankData={mockBankData}
                items={generateItems(2)}
                discount={mockDiscount}
                pdfConfig={config}
            />
        );

        const customerBox = container.querySelector('.customer-section') || container.querySelector('.customer-box');
        expect(customerBox).not.toBeNull();
        expect(customerBox?.textContent).toContain('Yılmaz İnşaat Ltd.');
        expect(customerBox?.textContent).toContain('Ali Yılmaz');
        // Unspecified fields should not have labels or empty lines
        expect(customerBox?.textContent).not.toContain('Tel:');
        expect(customerBox?.textContent).not.toContain('E-posta:');
        expect(customerBox?.textContent).not.toContain('Adres:');
        expect(customerBox?.textContent).not.toContain('Vergi:');
    });

    it('has overflow-confirm copy for the download gate (A2)', async () => {
        const tr = (await import('@/i18n/tr.json')).default as Record<string, string>;
        expect(tr.pdfOverflowConfirmTitle).toBeTruthy();
        expect(tr.pdfOverflowConfirmMessage).toContain('{pages}');
    });

    it('waitForAllImages returns empty for containers without images (C7)', async () => {
        const { waitForAllImages } = await import('@/utils/pdfGenerator');
        const div = document.createElement('div');
        div.innerHTML = '<p>no images here</p>';
        await expect(waitForAllImages(div, 50)).resolves.toEqual([]);
    });

    it('waitForAllImages reports unloadable images as failed (C7)', async () => {
        const { waitForAllImages } = await import('@/utils/pdfGenerator');
        const div = document.createElement('div');
        // jsdom never loads images → complete=false → reported as failed after timeout
        div.innerHTML = '<img src="https://example.invalid/broken.png" alt="broken" />';
        const failed = await waitForAllImages(div, 50);
        expect(failed).toHaveLength(1);
        expect(failed[0].tagName).toBe('IMG');
    });
});
