import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for detecting touch gestures
 * @param {Object} options - Configuration options
 * @param {Function} options.onSwipeLeft - Callback for swipe left gesture
 * @param {Function} options.onSwipeRight - Callback for swipe right gesture
 * @param {Function} options.onLongPress - Callback for long press gesture 
 * @param {number} options.swipeThreshold - Minimum distance for swipe (default: 50px)
 * @param {number} options.longPressDelay - Long press duration (default: 500ms)
 * @returns {Object} - Ref to attach to element and gesture state
 */
const useTouchGestures = ({
    onSwipeLeft,
    onSwipeRight,
    onLongPress,
    swipeThreshold = 50,
    longPressDelay = 500
} = {}) => {
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const touchEndX = useRef(0);
    const touchEndY = useRef(0);
    const longPressTimer = useRef(null);
    const elementRef = useRef(null);

    const handleTouchStart = useCallback((e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        touchEndX.current = e.touches[0].clientX;
        touchEndY.current = e.touches[0].clientY;

        // Start long press timer
        if (onLongPress) {
            longPressTimer.current = setTimeout(() => {
                onLongPress(e);
            }, longPressDelay);
        }
    }, [onLongPress, longPressDelay]);

    const handleTouchMove = useCallback((e) => {
        touchEndX.current = e.touches[0].clientX;
        touchEndY.current = e.touches[0].clientY;

        // Cancel long press if finger moves
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleTouchEnd = useCallback((e) => {
        // Clear long press timer
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        const deltaX = touchEndX.current - touchStartX.current;
        const deltaY = touchEndY.current - touchStartY.current;

        // Check if horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
            if (deltaX > 0 && onSwipeRight) {
                onSwipeRight(e);
            } else if (deltaX < 0 && onSwipeLeft) {
                onSwipeLeft(e);
            }
        }
    }, [onSwipeLeft, onSwipeRight, swipeThreshold]);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchmove', handleTouchMove, { passive: true });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);

            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
            }
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return elementRef;
};

export default useTouchGestures;
