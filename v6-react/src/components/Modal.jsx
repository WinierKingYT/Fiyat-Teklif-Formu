import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const [mounted, setMounted] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Swipe to dismiss state (mobile)
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const modalRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            setIsClosing(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') handleClose();
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

    const handleClose = () => {
        setIsClosing(true);
        // Wait for animation to complete
        setTimeout(() => {
            onClose();
            setIsAnimating(false);
        }, 300);
    };

    // Swipe to dismiss handlers (mobile)
    const handleTouchStart = (e) => {
        setTouchStart(e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
        if (touchStart - touchEnd > 100) {
            // Swiped Down
            handleClose();
        }
        setTouchStart(0);
        setTouchEnd(0);
    };

    if (!isOpen || !mounted) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-7xl',
        full: 'max-w-full m-4'
    };

    return createPortal(
        <div
            className={`modal-overlay ${isAnimating ? 'entering' : ''} ${isClosing ? 'exiting' : ''}`}
        >
            {/* Enhanced Glassmorphism Backdrop */}
            <div
                className="glass-modal-backdrop"
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div
                ref={modalRef}
                className={`modal-content ${sizeClasses[size]} ${isAnimating ? 'entering' : ''} ${isClosing ? 'exiting' : ''}`}
                role="dialog"
                aria-modal="true"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Sticky Header */}
                <div className="modal-header">
                    <h3 className="text-xl font-bold tracking-tight">{title}</h3>
                    <button
                        onClick={handleClose}
                        className="modal-close-btn"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
