import { X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import { useDialogBehavior } from '@/hooks/useDialogBehavior';

const sizeMap: Record<string, string> = {
    sm: '350px',
    md: '500px',
    lg: '700px',
    xl: '900px',
    '2xl': '1100px',
    full: '95%',
};

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: string;
}

const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
    const {
        visible,
        closing,
        mobile,
        dialogRef,
        handleClose,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
    } = useDialogBehavior(isOpen, onClose);

    if (!visible) return null;

    const overlayClass = `fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm ${closing ? 'animate-fadeOut' : 'animate-fadeIn'} ${mobile ? 'modal-bottom-sheet' : ''} ${mobile ? 'overflow-hidden' : ''}`;

    return createPortal(
        <div
            className={overlayClass}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
            onTouchStart={mobile ? handleTouchStart : undefined}
            onTouchMove={mobile ? handleTouchMove : undefined}
            onTouchEnd={mobile ? handleTouchEnd : undefined}
        >
            <div
                ref={dialogRef}
                className={`bg-[var(--color-bg-card)] w-full shadow-lg flex flex-col ${closing ? (mobile ? 'animate-slideDown' : 'animate-scaleOut') : ''}`}
                style={{
                    maxWidth: mobile ? '100%' : (sizeMap[size] || '500px'),
                    maxHeight: mobile ? '100vh' : '85vh',
                    borderRadius: mobile ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
                    transform: mobile ? 'none' : undefined,
                    transition: mobile ? 'transform 0.3s ease-out' : undefined,
                    overflow: 'hidden',
                }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {mobile && <div className="modal-drag-handle" />}
                <div className={`flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)] ${mobile ? 'pt-1' : ''}`}>
                    <h2 id="modal-title" className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2 truncate pr-2">
                        {title}
                    </h2>
                    <button type="button"
                        onClick={handleClose}
                        className="p-1.5 rounded-[var(--radius)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)] transition-colors shrink-0"
                        aria-label="Kapat"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto flex-1 overscroll-contain">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
