import React, { useState, useEffect, useCallback, useRef } from 'react';

const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const useDialogBehavior = (
  isOpen: boolean,
  onClose: () => void
) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [mobile, setMobile] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const touchStartY = useRef<number>(0);
  const touchDeltaY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const restoreFocus = useCallback(() => {
    if (prevFocusRef.current && typeof prevFocusRef.current.focus === 'function') {
      prevFocusRef.current.focus();
    }
    prevFocusRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setVisible(false);
      restoreFocus();
      onClose();
    }, 200);
  }, [onClose, restoreFocus]);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setClosing(false);
      setMobile(window.innerWidth < 768);
      prevFocusRef.current = document.activeElement as HTMLElement;
    } else if (visible) {
      handleClose();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); handleClose(); return; }
    };
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
      const el = dialogRef.current;
      if (!el) return;
      const firstFocusable = el.querySelectorAll(focusableSelector)[0];
      if (firstFocusable) (firstFocusable as HTMLElement).focus();
    });
    return () => cancelAnimationFrame(timer);
  }, [visible, closing]);

  useEffect(() => {
    if (visible && !closing) {
      const handler = (e: KeyboardEvent) => {
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
  }, [visible, closing]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchDeltaY.current = e.touches[0].clientY - touchStartY.current;
    if (touchDeltaY.current > 0 && dialogRef.current) {
      const translate = Math.min(touchDeltaY.current, 200);
      dialogRef.current.style.transform = `translateY(${translate}px)`;
      dialogRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (touchDeltaY.current > 100) {
      handleClose();
    } else if (dialogRef.current) {
      dialogRef.current.style.transform = '';
      dialogRef.current.style.transition = '';
    }
  }, [handleClose]);

  return {
    visible,
    closing,
    mobile,
    dialogRef,
    handleClose,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    restoreFocus,
  };
};
