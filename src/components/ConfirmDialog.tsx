import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, X } from 'lucide-react';

const variantConfig = {
    danger: { icon: AlertTriangle, iconColor: 'var(--color-error)', btnColor: 'var(--color-error)', label: 'danger' },
    warning: { icon: AlertTriangle, iconColor: 'var(--color-warning)', btnColor: 'var(--color-warning)', label: 'warning' },
    info: { icon: Info, iconColor: 'var(--color-primary)', btnColor: 'var(--color-primary)', label: 'info' },
};

const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const isMobile = () => window.innerWidth < 768;

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
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);
    const dialogRef = useRef(null);
    const prevFocusRef = useRef(null);
    const [mobile, setMobile] = useState(false);
    const touchStartY = useRef(0);
    const touchDeltaY = useRef(0);
    const isDragging = useRef(false);

    const handleCancel = useCallback(() => {
        setClosing(true);
        setTimeout(() => {
            setClosing(false);
            setVisible(false);
            onCancel();
        }, 200);
    }, [onCancel]);

    const handleConfirm = useCallback(() => {
        setClosing(true);
        setTimeout(() => {
            setClosing(false);
            setVisible(false);
            onConfirm();
        }, 200);
    }, [onConfirm]);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            setClosing(false);
            setMobile(window.innerWidth < 768);
            prevFocusRef.current = document.activeElement;
        } else if (visible) {
            handleCancel();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!visible || closing) return;
        const timer = requestAnimationFrame(() => {
            const el = dialogRef.current;
            if (!el) return;
            const firstFocusable = el.querySelectorAll(focusableSelector)[0];
            if (firstFocusable) (firstFocusable as HTMLElement).focus();
        });
        return () => cancelAnimationFrame(timer);
    }, [visible, closing]);

    useEffect(() => {
        if (visible && !closing) {
            const handler = (e) => {
                if (e.key === 'Escape') { e.preventDefault(); handleCancel(); return; }
                const el = dialogRef.current;
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
    }, [visible, closing, handleCancel]);

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
        if (touchDeltaY.current > 0 && dialogRef.current) {
            const translate = Math.min(touchDeltaY.current, 200);
            dialogRef.current.style.transform = `translateY(${translate}px)`;
            dialogRef.current.style.transition = 'none';
        }
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        if (touchDeltaY.current > 100) {
            handleCancel();
        } else if (dialogRef.current) {
            dialogRef.current.style.transform = '';
            dialogRef.current.style.transition = '';
        }
    };

    if (!visible) return null;

    const config = variantConfig[variant] || variantConfig.danger;
    const Icon = config.icon;

    const overlayClass = `fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm ${closing ? 'animate-fadeOut' : 'animate-fadeIn'} ${mobile ? 'modal-bottom-sheet' : ''}`;
    const contentClass = `bg-[var(--color-bg-card)] shadow-lg w-full ${closing ? (mobile ? 'animate-slideDown' : 'animate-scaleOut') : ''}`;

    return createPortal(
        <div
            className={overlayClass}
            onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
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
                    <button onClick={handleCancel} className="p-1.5 rounded-[var(--radius)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] transition-colors" aria-label="Kapat">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5">
                    <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
                </div>

                <div className="flex gap-3 p-5 border-t border-[var(--color-border)]">
                    <button onClick={handleCancel} className="btn btn-outline flex-1">{cancelText}</button>
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
