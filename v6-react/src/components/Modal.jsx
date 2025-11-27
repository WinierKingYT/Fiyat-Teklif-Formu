import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-7xl',
        full: 'max-w-full m-4'
    };

    // Portal ile document.body'ye render et
    return createPortal(
        <div
            className="fixed inset-0 flex items-center justify-center p-4 z-[9999] transition-all duration-300"
        >
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div
                className={`
                    relative 
                    bg-white dark:bg-slate-900 
                    text-slate-900 dark:text-slate-100 
                    rounded-2xl shadow-2xl 
                    w-full ${sizeClasses[size]} 
                    max-h-[90vh] 
                    flex flex-col 
                    transform transition-all 
                    border border-slate-200 dark:border-slate-700
                `}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
