import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildVersionPackageZip, exportVersionPackage, generatePrintableHtml } from '@/utils/exportVersionPackage';
import type { QuoteVersion } from '@/context/quote/types';

describe('exportVersionPackage', () => {
    const mockVersion: QuoteVersion = {
        versionId: 'ver_1_1700000000000',
        quoteId: 1,
        createdAt: 1700000000000,
        versionName: 'V1.0 Test',
        snapshot: {
            id: 1,
            quoteData: {
                title: 'Web Tasarım Teklifi',
                number: 'TEK-2026-001',
                date: '2026-08-19',
                currency: 'TRY',
                language: 'tr'
            },
            customerData: {
                name: 'Ahmet Yılmaz',
                company: 'ABC Ltd. Şti.',
                email: 'ahmet@example.com',
                phone: '05551234567',
                address: 'İstanbul, Türkiye'
            },
            companyData: {
                name: 'Dijital Ajans A.Ş.',
                email: 'info@dijital.com',
                phone: '02120000000',
                authorized: 'Mehmet Öz'
            },
            bankData: {
                bankName: 'Garanti BBVA',
                branch: 'Kadıköy',
                iban: 'TR123456789012345678901234',
                accountHolder: 'Dijital Ajans A.Ş.'
            },
            items: [
                {
                    id: 'item-1',
                    name: 'Frontend Geliştirme',
                    description: 'React tabanlı tek sayfa uygulama',
                    quantity: 1,
                    unit: 'Adet',
                    price: 15000,
                    discountRate: 10,
                    taxRate: 20,
                    total: 13500
                },
                {
                    id: 'item-2',
                    name: 'Bakım ve Destek',
                    quantity: 12,
                    unit: 'Ay',
                    price: 1000,
                    taxRate: 20,
                    total: 12000
                }
            ],
            discount: {
                type: 'percentage',
                value: 5
            }
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate printable HTML with correct metadata and table rows', () => {
        const html = generatePrintableHtml(mockVersion.snapshot, mockVersion);

        expect(html).toContain('Web Tasarım Teklifi');
        expect(html).toContain('TEK-2026-001');
        expect(html).toContain('ABC Ltd. Şti.');
        expect(html).toContain('Frontend Geliştirme');
        expect(html).toContain('Bakım ve Destek');
        expect(html).toContain('Garanti BBVA');
        expect(html).toContain('TR123456789012345678901234');
        expect(html).toContain('V1.0 Test');
    });

    it('should build a ZIP package containing JSON, CSV, XLSX, HTML and README files', async () => {
        const { blob, fileName } = await buildVersionPackageZip(mockVersion);

        expect(fileName).toBe('Teklif_TEK-2026-001_V1_0_Test_Paket.zip');
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.size).toBeGreaterThan(0);
    });

    it('should trigger browser download when exportVersionPackage is called', async () => {
        const appendChildSpy = vi.spyOn(document.body, 'appendChild');
        const removeChildSpy = vi.spyOn(document.body, 'removeChild');
        globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
        globalThis.URL.revokeObjectURL = vi.fn();

        const result = await exportVersionPackage(mockVersion);

        expect(result).toBe(true);
        expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
        expect(appendChildSpy).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalled();
        expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled();
    });
});
