import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const sizeMap = {
    sm: '350px',
    md: '500px',
    lg: '700px',
    xl: '900px',
    '2xl': '1100px',
    full: '95%',
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const handleClose = useCallback(() => onClose(), [onClose]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') handleClose(); };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div
                className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] w-full max-h-[85vh] overflow-hidden shadow-lg flex flex-col"
                style={{ maxWidth: sizeMap[size] || '500px' }}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
                    <h2 className="text-base font-semibold text-[var(--color-text)] flex items-center gap-2">
                        {title}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-[var(--radius)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)] transition-colors"
                        aria-label="Kapat"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="px-5 py-5 overflow-y-auto flex-1">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
