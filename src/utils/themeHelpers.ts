export const getAdjustedFontSize = (size: unknown, factor: number = 0.9, defaultSize: string = '0.85em') => {
    if (!size || size === 'inherit') return defaultSize;
    if (typeof size === 'number') return `${size * factor}px`;
    if (typeof size === 'string') {
        const trimmed = size.trim();
        if (trimmed.endsWith('px')) return `${parseFloat(trimmed) * factor}px`;
        if (trimmed.endsWith('pt')) return `${(parseFloat(trimmed) * 1.333 * factor).toFixed(1)}px`;
        if (trimmed.endsWith('rem') || trimmed.endsWith('em')) return `calc(${trimmed} * ${factor})`;
        const numeric = parseFloat(trimmed);
        if (!isNaN(numeric) && numeric > 0) return `${numeric * factor}px`;
    }
    return defaultSize;
};

/**
 * Formats an IBAN string into 4-character blocks for optimal readability.
 * E.g., "TR123456789012345678901234" -> "TR12 3456 7890 1234 5678 9012 34"
 */
export function formatIban(iban?: string | null): string {
    if (!iban) return '';
    const clean = iban
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase()
        .slice(0, 34);
    if (!clean) return '';
    return clean.match(/.{1,4}/g)?.join(' ') || clean;
}

export interface ChunkOptions {
    itemsPerPage?: number;
    showSummary?: boolean;
    showBankInfo?: boolean;
    hasBankData?: boolean;
    showSignatures?: boolean;
    showCustomerSignature?: boolean;
    showTerms?: boolean;
    hasTerms?: boolean;
    showNotes?: boolean;
    hasNotes?: boolean;
    notesLength?: number;
    customFooter?: string;
    isLandscape?: boolean;
    margins?: string;
    tableRowHeight?: number;
    fontSize?: number;
}

/**
 * Formats tax office display without duplicate "(Vergi Dairesi)" or "(V.D.)".
 * E.g., "Pendik Vergi Dairesi" -> "Pendik Vergi Dairesi"
 * E.g., "Pendik" -> "Pendik (V.D.)"
 */
export function formatTaxOfficeDisplay(taxOffice?: string | null, label = 'V.D.'): string {
    if (!taxOffice) return '';
    const trimmed = taxOffice.trim();
    if (!trimmed) return '';
    if (/(?:vergi\s*dairesi|v\.?\s*d\.?|tax\s*office)/i.test(trimmed)) {
        return trimmed;
    }
    return `${trimmed} (${label})`;
}

/**
 * Filters and cleans contact information items to avoid trailing or orphaned bullets.
 */
export function formatContactItems(...items: (string | null | undefined)[]): string[] {
    return items
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map(item => item.trim());
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

    // If a custom itemsPerPage is explicitly specified (and not the default 14), respect it
    if (options.itemsPerPage && options.itemsPerPage !== 14) {
        let totalContentWeight = 0;
        for (const item of items) {
            let weight = 1;
            const itemObj = item as Record<string, unknown>;
            if (typeof itemObj.description === 'string' && itemObj.description.length > 0) {
                const lines = itemObj.description.split('\n').length;
                const extraByLength = Math.floor(itemObj.description.length / 80);
                weight += Math.min(2.5, Math.max(lines - 1, extraByLength) * 0.4);
            }
            totalContentWeight += weight;
        }
        const avgItemWeight = items.length > 0 ? totalContentWeight / items.length : 1;
        const adjustedPerPage = avgItemWeight > 1.3
            ? Math.max(2, Math.floor(options.itemsPerPage / Math.min(1.6, avgItemWeight)))
            : Math.max(1, options.itemsPerPage);

        const chunks: T[][] = [];
        for (let i = 0; i < items.length; i += adjustedPerPage) {
            chunks.push(items.slice(i, i + adjustedPerPage));
        }
        return chunks;
    }

    const isLandscape = !!options.isLandscape;
    const isCompact = options.margins === 'compact';
    const isSpacious = options.margins === 'spacious' || options.margins === 'wide';
    const marginFactor = isSpacious ? 1.15 : (isCompact ? 0.9 : 1);
    const baseHeightFactor = typeof options.tableRowHeight === 'number' && options.tableRowHeight > 0
        ? Math.min(1.6, Math.max(0.7, options.tableRowHeight / 35))
        : 1;

    // Calculate content density weight based on descriptions if available
    let totalContentWeight = 0;
    for (const item of items) {
        let weight = 1;
        const itemObj = item as Record<string, unknown>;
        if (typeof itemObj.description === 'string' && itemObj.description.length > 0) {
            const lines = itemObj.description.split('\n').length;
            const extraByLength = Math.floor(itemObj.description.length / 80);
            weight += Math.min(10, Math.max(lines - 1, extraByLength) * 0.4);
        }
        totalContentWeight += weight;
    }
    const avgItemWeight = items.length > 0 ? totalContentWeight / items.length : 1;
    const heightFactor = baseHeightFactor * Math.min(3.0, Math.max(1.0, avgItemWeight)) * marginFactor;

    // Calculate dynamic bottom sections weight (in table item equivalents)
    let bottomSectionWeight = 0;
    if (options.showSummary !== false) bottomSectionWeight += 4.5;
    if (options.showBankInfo !== false && options.hasBankData !== false) bottomSectionWeight += 3.0;
    if (options.showTerms !== false && options.hasTerms !== false) bottomSectionWeight += 3.0;
    if (options.showNotes !== false && options.hasNotes !== false) {
        bottomSectionWeight += 2.5;
        if (options.notesLength && options.notesLength > 100) bottomSectionWeight += 1.5;
    }
    if (options.showSignatures !== false) {
        bottomSectionWeight += 3.5;
        if (options.showCustomerSignature) bottomSectionWeight += 0.5;
    }
    if (options.customFooter) bottomSectionWeight += 1.0;

    const hasBottomSections = bottomSectionWeight > 0;

    // Standard middle page limit (Header + Table only)
    const middlePageLimit = Math.max(6, Math.floor((isLandscape ? (isCompact ? 18 : 16) : (isCompact ? 24 : 22)) / heightFactor));

    // First page limit (Header + Customer Box + Table)
    const firstPageLimit = Math.max(5, Math.floor((isLandscape ? (isCompact ? 14 : 12) : (isCompact ? 16 : 14)) / heightFactor));

    // Last page limit (Continuation Header + Table + Bottom Sections)
    const rawLastLimit = Math.max(3, middlePageLimit - Math.round(bottomSectionWeight / heightFactor));
    const lastPageLimit = hasBottomSections ? Math.min(middlePageLimit, rawLastLimit) : middlePageLimit;

    // Single page limit (Header + Customer Box + Table + Bottom Sections)
    const rawSingleLimit = Math.max(2, firstPageLimit - Math.round(bottomSectionWeight / heightFactor));
    const singlePageLimit = hasBottomSections ? Math.min(firstPageLimit, rawSingleLimit) : firstPageLimit;

    if (items.length <= singlePageLimit) {
        return [items];
    }

    // If it fits across exactly 2 pages:
    if (items.length <= firstPageLimit + lastPageLimit) {
        // Balance items between page 1 and page 2 so neither page has an awkward huge empty void
        const p2Count = Math.min(lastPageLimit, Math.max(2, Math.floor(items.length * 0.4)));
        const p1Count = items.length - p2Count;
        return [
            items.slice(0, p1Count),
            items.slice(p1Count)
        ];
    }

    // For 3+ pages:
    const chunks: T[][] = [];
    let remaining = [...items];

    // Total pages estimate
    const estRemainingPages = Math.ceil((items.length - lastPageLimit) / middlePageLimit);
    const avgPerPage = Math.max(4, Math.ceil((items.length - lastPageLimit) / Math.max(1, estRemainingPages)));
    const p1Limit = Math.min(firstPageLimit, avgPerPage);

    // Page 1
    chunks.push(remaining.slice(0, p1Limit));
    remaining = remaining.slice(p1Limit);

    while (remaining.length > 0) {
        if (remaining.length <= lastPageLimit) {
            chunks.push(remaining);
            break;
        }

        if (remaining.length <= middlePageLimit + lastPageLimit) {
            const pMidCount = Math.min(middlePageLimit, Math.max(2, remaining.length - lastPageLimit));
            chunks.push(remaining.slice(0, pMidCount));
            chunks.push(remaining.slice(pMidCount));
            break;
        }

        chunks.push(remaining.slice(0, middlePageLimit));
        remaining = remaining.slice(middlePageLimit);
    }

    // Post-balancing: if the last page has only 1 item and previous page has plenty, move 1-2 items over
    if (chunks.length > 1) {
        const lastChunk = chunks[chunks.length - 1];
        const prevChunk = chunks[chunks.length - 2];
        if (lastChunk.length === 1 && prevChunk.length > 3) {
            const moved = prevChunk.pop()!;
            lastChunk.unshift(moved);
        }
    }

    return chunks;
}