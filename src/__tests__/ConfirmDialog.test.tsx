import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ConfirmDialog from '@/components/ConfirmDialog';

// Regression: clicking "Evet" used to route through handleClose, which fired
// onCancel after the close animation and swallowed the approval — the awaiting
// showConfirm() promise resolved false and downloads silently never started.
describe('ConfirmDialog', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    const renderDialog = (onConfirm: () => void, onCancel: () => void) => {
        render(
            <ConfirmDialog
                isOpen
                onConfirm={onConfirm}
                onCancel={onCancel}
                title="Sayfa taşması var"
                message="Yine de indirilsin mi?"
                confirmText="Evet"
                cancelText="Vazgeç"
            />
        );
    };

    it('approves without ever firing cancel (no race)', () => {
        vi.useFakeTimers();
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        renderDialog(onConfirm, onCancel);

        fireEvent.click(screen.getByText('Evet'));
        expect(onConfirm).toHaveBeenCalledTimes(1);

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('cancels without firing confirm', () => {
        vi.useFakeTimers();
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        renderDialog(onConfirm, onCancel);

        fireEvent.click(screen.getByText('Vazgeç'));
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });
});
