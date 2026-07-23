import React from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
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

const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);
    const modalRef = useRef(null);
    const prevFocusRef = useRef(null);

    const handleClose = useCallback(() => {
        setClosing(true);
        setTimeout(() => {
            setClosing(false);
            setVisible(false);
            onClose();
        }, 200);
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            setClosing(false);
            prevFocusRef.current = document.activeElement;
        } else if (visible) {
            handleClose();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!visible) return;
        const handler = (e) => { if (e.key === 'Escape') handleClose(); };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [visible, handleClose]);

    useEffect(() => {
        if (!visible || closing) return;
        const timer = requestAnimationFrame(() => {
            const el = modalRef.current;
            if (!el) return;
            const firstFocusable = el.querySelectorAll(focusableSelector)[0];
            if (firstFocusable) (firstFocusable as HTMLElement).focus();
        });
        return () => cancelAnimationFrame(timer);
    }, [visible, closing]);

    useEffect(() => {
        if (visible && !closing) {
            const handler = (e) => {
                const el = modalRef.current;
                if (!el || e.key !== 'Tab') return;
                const focusables = el.querySelectorAll(focusableSelector);
                if (focusables.length === 0) return;
                const first = focusables[0] as HTMLElement;
                const last = focusables[focusables.length - 1] as HTMLElement;
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            };
            document.addEventListener('keydown', handler);
            return () => document.removeEventListener('keydown', handler);
        }
    }, [visible, closing]);

    useEffect(() => {
        if (!visible) {
            prevFocusRef.current && (prevFocusRef.current as HTMLElement).focus?.();
        }
    }, [visible]);

    if (!visible) return null;

    return createPortal(
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm ${closing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div
                ref={modalRef}
                className={`bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] w-full max-h-[85vh] overflow-hidden shadow-lg flex flex-col ${closing ? 'animate-scaleOut' : 'animate-scaleIn'}`}
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
