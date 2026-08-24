import '@testing-library/jest-dom'
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

if (!Blob.prototype.text) {
    Blob.prototype.text = function () {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(this);
        });
    };
}

// Faz6: ResizeObserver mock (PdfPreviewPanel & LiveInlinePreview test uyumu)
if (typeof window !== 'undefined' && !(window as unknown as Record<string, unknown>).ResizeObserver) {
    class MockResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
    (window as unknown as Record<string, unknown>).ResizeObserver = MockResizeObserver;
    (globalThis as unknown as Record<string, unknown>).ResizeObserver = MockResizeObserver;
}
