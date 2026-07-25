import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, X } from 'lucide-react';
import { useDialogBehavior } from '../hooks/useDialogBehavior';

const variantConfig: Record<string, { icon: React.FC<{ size: number }>; iconColor: string; btnColor: string; label: string }> = {
    danger: { icon: AlertTriangle, iconColor: 'var(--color-error)', btnColor: 'var(--color-error)', label: 'danger' },
    warning: { icon: AlertTriangle, iconColor: 'var(--color-warning)', btnColor: 'var(--color-warning)', label: 'warning' },
    info: { icon: Info, iconColor: 'var(--color-primary)', btnColor: 'var(--color-primary)', label: 'info' },
};

interface ConfirmDialogProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: string;
}

const ConfirmDialog = ({
    isOpen,
    onConfirm,
    onCancel,
    title = 'Onay',
    message = 'Bu işlemi gerçekleştirmek istediğinize emin misiniz?',
    confirmText = 'Onayla',
    cancelText = 'İptal',
    variant: variantProp = 'danger',
}: ConfirmDialogProps) => {
    const variant = (['danger', 'warning', 'info'].includes(variantProp) ? variantProp : 'danger') as 'danger' | 'warning' | 'info';
    const {
        visible,
        closing,
        mobile,
        dialogRef,
        handleClose,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
    } = useDialogBehavior(isOpen, onCancel);

    const handleConfirm = useCallback(() => {
        handleClose();
        setTimeout(() => onConfirm(), 200);
    }, [handleClose, onConfirm]);

    if (!visible) return null;

    const config = variantConfig[variant] || variantConfig.danger;
    const Icon = config.icon;

    const overlayClass = `fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm ${closing ? 'animate-fadeOut' : 'animate-fadeIn'} ${mobile ? 'modal-bottom-sheet' : ''}`;
    const contentClass = `bg-[var(--color-bg-card)] shadow-lg w-full ${closing ? (mobile ? 'animate-slideDown' : 'animate-scaleOut') : ''}`;

    return createPortal(
        <div
            className={overlayClass}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
            onTouchStart={mobile ? handleTouchStart : undefined}
            onTouchMove={mobile ? handleTouchMove : undefined}
            onTouchEnd={mobile ? handleTouchEnd : undefined}
        >
            <div ref={dialogRef} className={contentClass} style={{
                maxWidth: mobile ? '100%' : '500px',
                borderRadius: mobile ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
                transition: 'transform 0.3s ease-out',
            }}>
                {mobile && <div className="modal-drag-handle" />}
                <div className={`flex items-center justify-between p-5 border-b border-[var(--color-border)] ${mobile ? 'pt-1' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-[var(--radius)] bg-[var(--color-bg-muted)]" style={{ color: config.iconColor }}>
                            <Icon size={22} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--color-text)]">{title}</h3>
                    </div>
                    <button onClick={handleClose} className="p-1.5 rounded-[var(--radius)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] transition-colors" aria-label="Kapat">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5">
                    <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
                </div>

                <div className="flex gap-3 p-5 border-t border-[var(--color-border)]">
                    <button onClick={handleClose} className="btn btn-outline flex-1">{cancelText}</button>
                    <button
                        onClick={handleConfirm}
                        className="btn flex-1 text-white"
                        style={{ background: config.btnColor }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmDialog;
