import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, X } from 'lucide-react';

const variantConfig = {
    danger: { icon: AlertTriangle, iconColor: 'var(--color-error)', btnColor: 'var(--color-error)', label: 'danger' },
    warning: { icon: AlertTriangle, iconColor: 'var(--color-warning)', btnColor: 'var(--color-warning)', label: 'warning' },
    info: { icon: Info, iconColor: 'var(--color-primary)', btnColor: 'var(--color-primary)', label: 'info' },
};

const ConfirmDialog = ({
    isOpen,
    onConfirm,
    onCancel,
    title = 'Onay',
    message = 'Bu işlemi gerçekleştirmek istediğinize emin misiniz?',
    confirmText = 'Onayla',
    cancelText = 'İptal',
    variant = 'danger',
}) => {
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onCancel();
    }, [onCancel]);

    useEffect(() => {
        if (!isOpen) return;
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    const config = variantConfig[variant] || variantConfig.danger;
    const Icon = config.icon;

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] shadow-lg max-w-md w-full animate-scaleIn">
                <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-[var(--radius)] bg-[var(--color-bg-muted)]" style={{ color: config.iconColor }}>
                            <Icon size={22} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--color-text)]">{title}</h3>
                    </div>
                    <button onClick={onCancel} className="p-1.5 rounded-[var(--radius)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5">
                    <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
                </div>

                <div className="flex gap-3 p-5 border-t border-[var(--color-border)]">
                    <button onClick={onCancel} className="btn btn-outline flex-1">{cancelText}</button>
                    <button
                        onClick={onConfirm}
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
