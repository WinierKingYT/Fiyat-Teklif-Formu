import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ModernTheme from '@/components/pdf-themes/ModernTheme';

const t = {
    image: 'Görsel',
    item: 'Ürün/Hizmet',
    description: 'Açıklama',
    unit: 'Birim',
    quantity: 'Miktar',
    unitPrice: 'Birim Fiyat',
    discount: 'İskonto',
    tax: 'KDV',
    total: 'Toplam',
    summary: 'ÖZET',
    subtotal: 'Ara Toplam',
    vat: 'KDV',
    generalTotal: 'GENEL TOPLAM',
    bankInfo: 'BANKA BİLGİLERİ',
    bank: 'Banka',
    branch: 'Şube',
    accountNo: 'Hesap No',
    iban: 'IBAN',
    accountHolder: 'Hesap Sahibi',
    date: 'Tarih',
    validUntil: 'Geçerlilik',
    page: 'Sayfa',
    company: 'Firma',
    customer: 'MÜŞTERİ',
    authorized: 'Yetkili',
    phone: 'Tel',
    email: 'E-posta',
    notes: 'NOTLAR',
    terms: 'Teklif Geçerlilik & Ödeme',
    payment: 'Ödeme',
    signature: 'İmza',
    companyStamp: 'Firma Kaşesi',
    thankYou: 'Teşekkür Ederiz',
    regards: 'Saygılarımızla',
    clickToEdit: 'Düzenlemek için tıklayın',
    edit: 'Düzenle',
};

const baseConfig = {
    globalFontFamily: 'Inter',
    fontSize: 12,
    title: 'Hizmet Teklifi',
    showLogo: false,
    showWatermark: false,
    showTableUnit: true,
    showTableTax: true,
    showTableImages: false,
    showSummary: true,
    showBankInfo: true,
    showSignatures: false,
    showTerms: false,
    showNotes: false,
    showPageNumbers: true,
    itemsPerPage: 20,
    customFooter: '',
};

const activeLayout = [
    { id: 'header', label: 'Header', enabled: true },
    { id: 'customer', label: 'Customer', enabled: true },
    { id: 'items', label: 'Items', enabled: true },
    { id: 'notes', label: 'Notes', enabled: true },
    { id: 'signatures', label: 'Signatures', enabled: true },
    { id: 'footer', label: 'Footer', enabled: true },
];

const items = [
    { id: 'i1', name: 'Laptop', description: '16GB', quantity: 2, price: 100, taxRate: 20, discountRate: 0, unit: 'Adet' },
    { id: 'i2', name: 'Mouse', description: '', quantity: 1, price: 50, taxRate: 20, discountRate: 0, unit: 'Adet' },
];

const renderTheme = (overrides: Record<string, unknown> = {}) =>
    render(
        <ModernTheme
            id="test-quote"
            containerStyles={{ pageMinHeight: '290mm' }}
            config={baseConfig}
            color="#2563eb"
            activeLayout={activeLayout}
            companyData={{ name: 'Bizim A.Ş.', address: 'İstiklal Cd.', phone: '0212', email: 'info@bizim.com', website: 'bizim.com', logo: null, signature: null, stamp: null, authorized: 'Ali' }}
            quoteData={{ date: '2026-01-01', validUntil: '2026-01-11', number: '2026-001', notes: '', warrantyTerms: '' }}
            customerData={{ name: 'Müşteri Adı', company: 'Acme Ltd', phone: '', email: '' }}
            items={items}
            bankData={{ bankName: 'Ziraat', branch: 'Merkez', iban: 'TR0000', accountHolder: 'Bizim' }}
            signature={null}
            t={t}
            formatDate={(d?: string) => d || ''}
            formatCurrency={(n: number) => `${n} TL`}
            subtotal={250}
            discountAmount={0}
            totalTax={50}
            total={300}
            currentLocale="tr-TR"
            hasLineItemDiscounts={false}
            onEdit={undefined}
            {...overrides}
        />
    );

describe('ModernTheme', () => {
    it('renders the container with the given id', () => {
        renderTheme();

        const container = document.getElementById('test-quote');
        expect(container).not.toBeNull();
        expect(container?.className).toContain('modern-theme-container');
    });

    it('renders the company header, quote title and number', () => {
        renderTheme();

        expect(screen.getAllByText('Bizim A.Ş.').length).toBeGreaterThan(0);
        expect(screen.getByText('Hizmet Teklifi')).toBeInTheDocument();
        expect(screen.getAllByText(/#2026-001/).length).toBeGreaterThanOrEqual(1);
    });

    it('renders the item table with item totals', () => {
        renderTheme();

        expect(screen.getByText('Laptop')).toBeInTheDocument();
        expect(screen.getByText('Mouse')).toBeInTheDocument();
        expect(screen.getByText('300 TL')).toBeInTheDocument(); // grand total
    });

    it('omits the unit and tax columns when disabled', () => {
        renderTheme({
            config: { ...baseConfig, showTableUnit: false, showTableTax: false },
        });

        expect(screen.queryByText('Birim', { selector: 'th' })).not.toBeInTheDocument();
        expect(screen.queryByText('KDV', { selector: 'th' })).not.toBeInTheDocument();
    });

    it('shows the watermark text when enabled', () => {
        renderTheme({
            config: { ...baseConfig, showWatermark: true, watermarkText: 'TASLAK' },
        });

        expect(screen.getByText('TASLAK')).toBeInTheDocument();
    });

    it('paginates items based on itemsPerPage', () => {
        const manyItems = Array.from({ length: 5 }, (_, i) => ({
            id: `i${i}`, name: `Ürün ${i}`, description: '', quantity: 1, price: 10, taxRate: 20, discountRate: 0, unit: 'Adet',
        }));

        renderTheme({ items: manyItems, config: { ...baseConfig, itemsPerPage: 2 } });

        expect(document.querySelectorAll('.pdf-page').length).toBe(3);
    });

    it('renders company and customer tax information when provided', () => {
        renderTheme({
            companyData: {
                name: 'Bizim A.Ş.',
                address: 'İstiklal Cd.',
                phone: '0212',
                email: 'info@bizim.com',
                website: 'bizim.com',
                logo: null,
                signature: null,
                stamp: null,
                authorized: 'Ali',
                taxOffice: 'Beşiktaş',
                taxNumber: '1234567890'
            },
            customerData: {
                name: 'Müşteri Adı',
                company: 'Acme Ltd',
                phone: '',
                email: '',
                taxOffice: 'Kadıköy',
                taxNumber: '9876543210'
            }
        });

        expect(screen.getByText(/Beşiktaş.*V\.D\./)).toBeInTheDocument();
        expect(screen.getByText(/1234567890/)).toBeInTheDocument();
        expect(screen.getByText(/Kadıköy.*V\.D\./)).toBeInTheDocument();
        expect(screen.getByText(/9876543210/)).toBeInTheDocument();
    });

    it('renders itemized multi-rate VAT breakdown when multiple rates exist', () => {
        const multiVatItems = [
            { id: 'i1', name: 'Kitap', description: '', quantity: 1, price: 100, taxRate: 10, discountRate: 0, unit: 'Adet' },
            { id: 'i2', name: 'Telefon', description: '', quantity: 1, price: 200, taxRate: 20, discountRate: 0, unit: 'Adet' },
        ];

        renderTheme({
            items: multiVatItems,
            subtotal: 300,
            totalTax: 50,
            total: 350,
            config: { ...baseConfig, showTableTax: true }
        });

        expect(screen.getByText(/KDV \(%10\):/)).toBeInTheDocument();
        expect(screen.getByText(/KDV \(%20\):/)).toBeInTheDocument();
    });

    it('smart chunks 21 items across 2 balanced pages to avoid single-page overflow', () => {
        const eightItems = Array.from({ length: 21 }, (_, i) => ({
            id: `item-${i}`,
            name: `Ürün ${i + 1}`,
            description: 'Açıklama',
            quantity: 1,
            price: 100,
            taxRate: 20,
            discountRate: 0,
            unit: 'Adet',
        }));

        renderTheme({
            items: eightItems,
            config: baseConfig,
        });

        const pages = document.querySelectorAll('.pdf-page');
        expect(pages.length).toBe(2);
    });

    it('renders amount in words ribbon below total', () => {
        renderTheme({
            total: 300,
            config: { ...baseConfig, showSummary: true }
        });
        expect(screen.getByText(/Yalnız #Üç Yüz Türk Lirasıdır#/)).toBeInTheDocument();
    });

    it('handles seller signature only when showCustomerSignature is false', () => {
        renderTheme({
            config: { ...baseConfig, showSignatures: true, showCustomerSignature: false }
        });
        expect(screen.getAllByText(/Bizim A\.Ş\./).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/Yetkili Kaşe \/ İmza/)).toBeInTheDocument();
        expect(screen.queryByText(/Müşteri Onayı/)).not.toBeInTheDocument();
    });

    it('renders both seller and customer signature when showCustomerSignature is true', () => {
        renderTheme({
            config: { ...baseConfig, showSignatures: true, showCustomerSignature: true }
        });
        expect(screen.getByText(/Yetkili Kaşe \/ İmza/)).toBeInTheDocument();
        expect(screen.getByText(/Müşteri Onayı/)).toBeInTheDocument();
    });
});
