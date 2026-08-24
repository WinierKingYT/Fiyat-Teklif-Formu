import { render } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';
import { PdfCustomFields } from '@/components/pdf-themes/common/PdfCustomFields';
import type { CustomField } from '@/context/quote/types';

describe('PdfCustomFields', () => {
    it('should render nothing if customFields is empty', () => {
        const { container } = render(<PdfCustomFields customFields={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render visible custom fields with non-empty values', () => {
        const fields: CustomField[] = [
            { id: '1', label: 'Proje Kodu', value: 'PRJ-2026', showOnPdf: true, order: 1 },
            { id: '2', label: 'Teslim Yeri', value: 'İstanbul Depo', showOnPdf: true, order: 2 },
            { id: '3', label: 'Gizli Bilgi', value: 'Gizli', showOnPdf: false, order: 3 },
            { id: '4', label: 'Boş Alan', value: '', showOnPdf: true, order: 4 },
        ];

        const { getByText, queryByText } = render(
            <PdfCustomFields customFields={fields} themeColor="#2563eb" variant="grid" />
        );

        expect(getByText('Proje Kodu:')).toBeDefined();
        expect(getByText('PRJ-2026')).toBeDefined();
        expect(getByText('Teslim Yeri:')).toBeDefined();
        expect(getByText('İstanbul Depo')).toBeDefined();

        // Hidden or empty fields should NOT be rendered
        expect(queryByText('Gizli Bilgi:')).toBeNull();
        expect(queryByText('Boş Alan:')).toBeNull();
    });

    it('should support chips variant', () => {
        const fields: CustomField[] = [
            { id: '1', label: 'Sevkiyat', value: 'Kargo', showOnPdf: true, order: 1 }
        ];

        const { getByText } = render(
            <PdfCustomFields customFields={fields} themeColor="#10b981" variant="chips" />
        );

        expect(getByText('Sevkiyat:')).toBeDefined();
        expect(getByText('Kargo')).toBeDefined();
    });
});
