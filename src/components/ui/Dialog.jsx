import React, { useEffect, useRef } from 'react';

const Dialog = ({ open, onOpenChange, children }) => {
    if (!open) return null;

    return (
        <DialogPortal onOpenChange={onOpenChange}>
            {children}
        </DialogPortal>
    );
};

const DialogPortal = ({ onOpenChange, children }) => {
    const overlayRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onOpenChange(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onOpenChange]);

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onOpenChange(false);
    };

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={handleOverlayClick}
        >
            <div
                className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] w-full max-h-[85vh] overflow-hidden shadow-lg flex flex-col animate-in fade-in zoom-in-95 duration-200"
                style={{ maxWidth: 'var(--dialog-max-width, 700px)' }}
            >
                {children}
            </div>
        </div>
    );
};

const DialogHeader = ({ className = '', children, ...props }) => (
    <div className={`flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] ${className}`} {...props}>
        {children}
    </div>
);

const DialogTitle = ({ className = '', children, ...props }) => (
    <h2 className={`text-base font-semibold text-[var(--color-text)] flex items-center gap-2 ${className}`} {...props}>
        {children}
    </h2>
);

const DialogBody = ({ className = '', children, ...props }) => (
    <div className={`px-5 py-5 overflow-y-auto flex-1 ${className}`} {...props}>
        {children}
    </div>
);

const DialogFooter = ({ className = '', children, ...props }) => (
    <div className={`flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--color-border)] ${className}`} {...props}>
        {children}
    </div>
);

const DialogClose = ({ onClose, className = '', children, ...props }) => (
    <button
        onClick={onClose}
        className={`p-1.5 rounded-[var(--radius)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)] transition-colors ${className}`}
        aria-label="Close"
        {...props}
    >
        {children || <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>}
    </button>
);

export { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose };
