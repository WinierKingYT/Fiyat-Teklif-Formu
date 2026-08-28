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
 * Uppercases visible PDF titles with the locale-aware rules required by
 * Turkish dotted/dotless I characters (and the other supported quote
 * languages). The stored value remains unchanged for editing.
 */
export function formatPdfTitle(value: unknown, language = 'tr'): string {
    const text = String(value ?? '');
    const locale = language.toLowerCase().startsWith('tr')
        ? 'tr-TR'
        : language.toLowerCase().startsWith('de')
            ? 'de-DE'
            : 'en-US';
    try {
        return text.toLocaleUpperCase(locale);
    } catch {
        return text.toUpperCase();
    }
}

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
    if (options.showSummary !== false) bottomSectionWeight += 4.0;
    if (options.showBankInfo !== false && options.hasBankData !== false) bottomSectionWeight += 3.0;
    if (options.showTerms !== false && options.hasTerms !== false) bottomSectionWeight += 3.0;
    if (options.showNotes !== false && options.hasNotes !== false) {
        bottomSectionWeight += 2.0;
        if (options.notesLength && options.notesLength > 100) bottomSectionWeight += 1.5;
    }
    if (options.showSignatures !== false) {
        bottomSectionWeight += 3.0;
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
    // In our 2-column layout, bottom sections are side-by-side, so a single page comfortably fits up to 10-12 items.
    const rawSingleLimit = Math.max(8, Math.floor((isLandscape ? (isCompact ? 10 : 8) : (isCompact ? 13 : 11)) / heightFactor));
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

    // For 3+ pages, choose the smallest page count that fits and distribute
    // rows across the available pages. The previous greedy split could leave a
    // middle page with only 1-2 rows (especially in landscape mode), wasting a
    // full sheet and making the final PDF look unfinished.
    let pageCount = 3;
    while (firstPageLimit + ((pageCount - 2) * middlePageLimit) + lastPageLimit < items.length) {
        pageCount += 1;
    }

    // Keep the final page within its stricter bottom-section limit while using
    // an approximately even target for the other pages.
    const lastCount = Math.min(lastPageLimit, Math.max(1, Math.ceil(items.length / pageCount)));
    let remainingCount = items.length - lastCount;
    let offset = 0;
    const chunks: T[][] = [];

    for (let pageIndex = 0; pageIndex < pageCount - 1; pageIndex += 1) {
        const pagesLeft = pageCount - 1 - pageIndex;
        const pageLimit = pageIndex === 0 ? firstPageLimit : middlePageLimit;
        const targetCount = Math.ceil(remainingCount / pagesLeft);
        const count = Math.min(pageLimit, Math.max(1, targetCount));
        chunks.push(items.slice(offset, offset + count));
        offset += count;
        remainingCount -= count;
    }

    chunks.push(items.slice(offset));
    return chunks;
}
