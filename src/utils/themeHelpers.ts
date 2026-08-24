export const getAdjustedFontSize = (size: unknown, factor: number = 0.9, defaultSize: string = '0.85em') => {
    if (!size || size === 'inherit') return defaultSize;
    if (typeof size === 'number') return `${size * factor}px`;
    if (typeof size === 'string') {
        if (size.endsWith('px')) return `${parseFloat(size) * factor}px`;
        if (size.endsWith('rem') || size.endsWith('em')) return `calc(${size} * ${factor})`;
    }
    return defaultSize;
};

/**
 * Formats an IBAN string into 4-character blocks for optimal readability.
 * E.g., "TR123456789012345678901234" -> "TR12 3456 7890 1234 5678 9012 34"
 */
export function formatIban(iban?: string | null): string {
    if (!iban) return '';
    const clean = iban.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (!clean) return '';
    return clean.match(/.{1,4}/g)?.join(' ') || clean;
}

export interface ChunkOptions {
    itemsPerPage?: number;
    showSummary?: boolean;
    showBankInfo?: boolean;
    showSignatures?: boolean;
    showTerms?: boolean;
    isLandscape?: boolean;
    margins?: string;
    tableRowHeight?: number;
    fontSize?: number;
}

/**
 * Intelligently chunks quote items across pages based on page content role
 * (single-page quote vs multi-page: first page, middle pages, and last page with summary & signatures)
 * to prevent page height overflow.
 */
export function chunkQuoteItems<T>(items: T[], options: ChunkOptions = {}): T[][] {
    if (!items || items.length === 0) {
        return [[]];
    }

    // If a custom itemsPerPage is explicitly specified and not the default 20, respect it linearly
    if (options.itemsPerPage && options.itemsPerPage !== 20) {
        const perPage = Math.max(1, options.itemsPerPage);
        const chunks: T[][] = [];
        for (let i = 0; i < items.length; i += perPage) {
            chunks.push(items.slice(i, i + perPage));
        }
        return chunks;
    }

    const isLandscape = !!options.isLandscape;
    const isCompact = options.margins === 'compact';
    const heightFactor = typeof options.tableRowHeight === 'number' && options.tableRowHeight > 0
        ? Math.min(1.6, Math.max(0.7, options.tableRowHeight / 35))
        : 1;

    // Capacity for a standalone single-page quote — güvenli tek sayfa
    const singlePageLimit = Math.max(4, Math.floor((isLandscape ? (isCompact ? 10 : 9) : (isCompact ? 14 : 12)) / heightFactor));

    if (items.length <= singlePageLimit) {
        return [items];
    }

    // Capacity limits — maksimum hedef, sayfa bütünlüğü korunarak
    // Page 1: Header + Customer + Table (No bottom sections)
    const firstPageLimit = Math.max(6, Math.floor((isLandscape ? (isCompact ? 16 : 14) : 20) / heightFactor));
    // Middle pages: Compact Header + Table
    const middlePageLimit = Math.max(6, Math.floor((isLandscape ? (isCompact ? 18 : 16) : (isCompact ? 22 : 20)) / heightFactor));
    // Last page: Compact Header + Table + Summary + Bank + Terms + Signatures
    const lastPageLimit = Math.max(4, Math.floor((isLandscape ? (isCompact ? 10 : 9) : (isCompact ? 14 : 12)) / heightFactor));

    // If it fits across exactly 2 pages:
    if (items.length <= firstPageLimit + lastPageLimit) {
        // Balance items so last page has at least 1 and at most lastPageLimit items
        const p2Count = Math.min(lastPageLimit, Math.max(1, Math.ceil(items.length / 2)));
        const p1Count = items.length - p2Count;
        return [
            items.slice(0, p1Count),
            items.slice(p1Count)
        ];
    }

    // For 3+ pages:
    const chunks: T[][] = [];
    let remaining = [...items];

    // Page 1
    chunks.push(remaining.slice(0, firstPageLimit));
    remaining = remaining.slice(firstPageLimit);

    while (remaining.length > 0) {
        if (remaining.length <= lastPageLimit) {
            chunks.push(remaining);
            break;
        }

        if (remaining.length <= middlePageLimit + lastPageLimit) {
            const pLastCount = Math.min(lastPageLimit, Math.max(1, Math.ceil(remaining.length / 2)));
            const pMidCount = remaining.length - pLastCount;
            chunks.push(remaining.slice(0, pMidCount));
            chunks.push(remaining.slice(pMidCount));
            break;
        }

        chunks.push(remaining.slice(0, middlePageLimit));
        remaining = remaining.slice(middlePageLimit);
    }

    return chunks;
}