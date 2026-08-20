import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import SummarySection from '@/components/SummarySection';


// subtotal 250, line discount 5, net 245, global 10% => 24.5
// tax: {20: 36, 10: 4.05}, total 40.05, grand total 260.55
const items = [
    { id: 'a', name: 'A', quantity: 2, price: 100, taxRate: 20, discountRate: 0 },
    { id: 'b', name: 'B', quantity: 1, price: 50, taxRate: 10, discountRate: 10 },
];

const renderSummary = (overrides: Record<string, unknown> = {}) =>
    render(
        <SummarySection
            items={items}
            discount={{ type: 'percentage', value: 10 }}
            onDiscountChange={vi.fn()}
            currency="TRY"
            language="tr"
            {...overrides}
        />
    );

describe('SummarySection', () => {
    it('renders nothing when there are no items', () => {
        const { container } = render(
            <SummarySection items={[]} discount={{ type: 'percentage', value: 0 }} onDiscountChange={vi.fn()} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders subtotal, discount, VAT and grand total', () => {
        renderSummary();

        expect(screen.getByText('Özet')).toBeInTheDocument();
        expect(screen.getByText('₺250,00')).toBeInTheDocument(); // subtotal
        expect(screen.getByText('-₺5,00')).toBeInTheDocument(); // line discount
        expect(screen.getByText('-₺24,50')).toBeInTheDocument(); // global discount
        expect(screen.getByText('₺260,55')).toBeInTheDocument(); // grand total
    });

    it('shows a VAT breakdown per rate', () => {
        renderSummary();

        expect(screen.getByText('KDV %20')).toBeInTheDocument();
        expect(screen.getByText('KDV %10')).toBeInTheDocument();
        expect(screen.getByText('₺36,00')).toBeInTheDocument();
        expect(screen.getByText('₺4,05')).toBeInTheDocument();
        expect(screen.getByText('Toplam KDV')).toBeInTheDocument();
    });

    it('calls onDiscountChange when the discount value changes', () => {
        const onChange = vi.fn();
        renderSummary({ discount: { type: 'percentage', value: 0 }, onDiscountChange: onChange });

        fireEvent.change(screen.getByLabelText('Genel İskonto'), { target: { value: '15' } });

        expect(onChange).toHaveBeenCalledWith({ type: 'percentage', value: 15 });
    });

    it('calls onDiscountChange when the discount type changes', () => {
        const onChange = vi.fn();
        renderSummary({ onDiscountChange: onChange });

        const selects = screen.getAllByRole('combobox');
        fireEvent.change(selects[0], { target: { value: 'fixed' } });

        expect(onChange).toHaveBeenCalledWith({ type: 'fixed', value: 10 });
    });

    it('hides the line discount row when no line discount exists', () => {
        renderSummary({ items: [{ id: 'a', name: 'A', quantity: 1, price: 100, taxRate: 20, discountRate: 0 }] });

        expect(screen.queryByText('Satır İskontoları')).not.toBeInTheDocument();
    });

    it('toggles amount in words on demand', () => {
        renderSummary();

        const wordsToggleBtn = screen.getByRole('button', { name: /Yazıyla Tutar Ekle/i });
        expect(wordsToggleBtn).toBeInTheDocument();

        fireEvent.click(wordsToggleBtn);
        expect(screen.getByText(/Yazıyla Tutarı Gizle/i)).toBeInTheDocument();
        expect(screen.getByText(/İki Yüz Altmış Türk Lirası/i)).toBeInTheDocument();
    });

    it('renders and invokes onSaveQuote and onPreviewPdf CTA buttons', () => {
        const onSave = vi.fn();
        const onPreview = vi.fn();
        renderSummary({ onSaveQuote: onSave, onPreviewPdf: onPreview });

        const previewBtn = screen.getByRole('button', { name: /PDF Önizle & İndir/i });
        const saveBtn = screen.getByRole('button', { name: /Teklifi Kaydet/i });

        expect(previewBtn).toBeInTheDocument();
        expect(saveBtn).toBeInTheDocument();

        fireEvent.click(previewBtn);
        expect(onPreview).toHaveBeenCalledTimes(1);

        fireEvent.click(saveBtn);
        expect(onSave).toHaveBeenCalledTimes(1);
    });
});