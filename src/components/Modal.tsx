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

const isMobile = () => window.innerWidth < 768;

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);
    const modalRef = useRef(null);
    const prevFocusRef = useRef(null);
    const touchStartY = useRef(0);
    const touchDeltaY = useRef(0);
    const isDragging = useRef(false);
    const [mobile, setMobile] = useState(false);

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
            setMobile(window.innerWidth < 768);
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

    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
        touchDeltaY.current = 0;
        isDragging.current = true;
    };

    const handleTouchMove = (e) => {
        if (!isDragging.current) return;
        touchDeltaY.current = e.touches[0].clientY - touchStartY.current;
        if (touchDeltaY.current > 0 && modalRef.current) {
            const translate = Math.min(touchDeltaY.current, 200);
            modalRef.current.style.transform = `translateY(${translate}px)`;
            modalRef.current.style.transition = 'none';
        }
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        if (touchDeltaY.current > 100) {
            handleClose();
        } else if (modalRef.current) {
            modalRef.current.style.transform = '';
            modalRef.current.style.transition = '';
        }
    };

    if (!visible) return null;

    const overlayClass = `fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm ${closing ? 'animate-fadeOut' : 'animate-fadeIn'} ${mobile ? 'modal-bottom-sheet' : ''}`;

    return createPortal(
        <div
            className={overlayClass}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
            onTouchStart={mobile ? handleTouchStart : undefined}
            onTouchMove={mobile ? handleTouchMove : undefined}
            onTouchEnd={mobile ? handleTouchEnd : undefined}
        >
            <div
                ref={modalRef}
                className={`bg-[var(--color-bg-card)] w-full max-h-[85vh] overflow-hidden shadow-lg flex flex-col ${closing ? (mobile ? 'animate-slideDown' : 'animate-scaleOut') : ''}`}
                style={{
                    maxWidth: mobile ? '100%' : (sizeMap[size] || '500px'),
                    borderRadius: mobile ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
                    transform: mobile ? 'none' : undefined,
                    transition: mobile ? 'transform 0.3s ease-out' : undefined,
                }}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                {mobile && <div className="modal-drag-handle" />}
                <div className={`flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] ${mobile ? 'pt-1' : ''}`}>
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
