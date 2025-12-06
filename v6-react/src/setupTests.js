import '@testing-library/jest-dom'
import { vi } from 'vitest';

// Global Mock for Recharts to prevent "loadAndTransform" errors
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }) => children, // Just return children or null, avoid JSX <div>
    PieChart: () => null,
    Pie: () => null,
    Cell: () => null,
    Tooltip: () => null,
    Legend: () => null,
    BarChart: () => null,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
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
