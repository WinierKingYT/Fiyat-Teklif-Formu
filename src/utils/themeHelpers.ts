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
    hasCustomer?: boolean;
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
 * Returns true if an item has valid content (not an empty placeholder row).
 */
export function hasValidItemContent(item: unknown): boolean {
    if (item === null || item === undefined) return false;
    if (typeof item === 'number' || typeof item === 'string') return true;
    if (typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const name = typeof obj.name === 'string' ? obj.name.trim() : '';
        const desc = typeof obj.description === 'string' ? obj.description.trim() : '';
        const price = typeof obj.price === 'number' ? obj.price : (typeof obj.price === 'string' ? parseFloat(obj.price) || 0 : 0);
        const qty = typeof obj.quantity === 'number' ? obj.quantity : (typeof obj.quantity === 'string' ? parseFloat(obj.quantity) || 0 : 0);
        if ('name' in obj || 'price' in obj || 'description' in obj || 'quantity' in obj) {
            return name.length > 0 || desc.length > 0 || (price > 0 && qty > 0);
        }
        return true;
    }
    return false;
}

/**
 * Intelligently chunks quote items across pages based on measured A4 page budget
 * (single-page quote vs multi-page: first page, middle pages, and last page with summary & signatures)
 * to strictly prevent page height overflow.
 */
export function chunkQuoteItems<T>(rawItems: T[], options: ChunkOptions = {}): T[][] {
    const items = (rawItems || []).filter(hasValidItemContent);
    if (!items || items.length === 0) {
        return [[]];
    }

    // Manual override if explicitly set
    if (options.itemsPerPage && options.itemsPerPage !== 14 && options.itemsPerPage < 50) {
        const chunks: T[][] = [];
        for (let i = 0; i < items.length; i += options.itemsPerPage) {
            chunks.push(items.slice(i, i + options.itemsPerPage));
        }
        return chunks;
    }

    const isLandscape = !!options.isLandscape;
    const isCompact = options.margins === 'compact';
    const isSpacious = options.margins === 'spacious' || options.margins === 'wide';

    // Base available height per page (in units, where 1 A4 portrait page has ~1000 usable height units)
    const pageCapacity = isLandscape ? 760 : 1000;
    const scaleFactor = isCompact ? 1.08 : (isSpacious ? 0.92 : 1.0);

    // Measure Item Heights
    const itemHeights = items.map(item => {
        const itemObj = item as Record<string, unknown>;
        let h = typeof options.tableRowHeight === 'number' && options.tableRowHeight > 0
            ? options.tableRowHeight
            : 34; // standard row height

        if (itemObj.image) {
            h = Math.max(h, 56);
        }
        if (typeof itemObj.description === 'string' && itemObj.description.trim().length > 0) {
            const lines = itemObj.description.split('\n').length;
            const wrapLines = Math.floor(itemObj.description.length / 65);
            const extraLines = Math.max(lines - 1, wrapLines);
            h += extraLines * 16;
        }
        if (typeof itemObj.name === 'string' && itemObj.name.length > 50) {
            h += Math.floor(itemObj.name.length / 50) * 14;
        }
        return h;
    });

    // Measure Fixed Page Sections
    const page1HeaderHeight = (isLandscape ? 120 : 180);
    const page1CustomerHeight = options.hasCustomer !== false ? (isLandscape ? 60 : 95) : 0;
    const page1TopBudget = (page1HeaderHeight + page1CustomerHeight) / scaleFactor;

    const continuationHeaderHeight = 40 / scaleFactor;
    const tableHeaderHeight = 36 / scaleFactor;

    // Bottom sections on final page
    let finalBottomHeight = 0;
    if (options.showSummary !== false) finalBottomHeight += 175;
    if (options.showBankInfo !== false && options.hasBankData !== false) finalBottomHeight += 20; // in 2-col layout it shares row with summary
    if (options.showSignatures !== false) {
        finalBottomHeight += options.showCustomerSignature ? 100 : 85;
    }
    if (options.showTerms !== false && options.hasTerms) finalBottomHeight += 65;
    if (options.showNotes !== false && options.hasNotes) {
        finalBottomHeight += 45 + Math.min(60, Math.floor((options.notesLength || 0) / 60) * 14);
    }
    if (options.customFooter) finalBottomHeight += 25;
    finalBottomHeight = finalBottomHeight / scaleFactor;

    const hasBottomSections = finalBottomHeight > 30;

    // Calibrate maximum row capacities based on visual layout
    const maxSinglePageRowBudget = isLandscape ? (hasBottomSections ? 180 : 500) : (hasBottomSections ? 230 : 550);
    const maxPage1RowBudget = isLandscape ? 260 : 340;
    const maxMiddlePageRowBudget = isLandscape ? 320 : 420;
    const maxFinalPageRowBudget = isLandscape ? 280 : 250;

    const singlePageRowBudget = Math.min(maxSinglePageRowBudget, (pageCapacity - page1TopBudget - tableHeaderHeight - finalBottomHeight));
    const totalItemsHeight = itemHeights.reduce((sum, h) => sum + h, 0);

    // 1. Single Page Test
    if (totalItemsHeight <= singlePageRowBudget && (!hasBottomSections || items.length <= 7)) {
        return [items];
    }

    // 2. Multi-Page Distribution with greedy packing and orphan prevention
    const page1RowBudget = Math.min(maxPage1RowBudget, pageCapacity - page1TopBudget - tableHeaderHeight);
    const continuationRowBudget = Math.min(maxMiddlePageRowBudget, pageCapacity - continuationHeaderHeight - tableHeaderHeight);
    const finalPageRowBudget = Math.min(maxFinalPageRowBudget, pageCapacity - continuationHeaderHeight - tableHeaderHeight - finalBottomHeight);

    // For landscape 3-page quotes, distribute evenly to keep middle and final pages well proportioned
    if (isLandscape && items.length > 18 && items.length <= 26) {
        const p1Count = Math.min(Math.floor(page1RowBudget / 34), Math.floor(items.length / 3));
        const p2Count = Math.min(Math.floor(continuationRowBudget / 34), Math.floor((items.length - p1Count) / 2));
        return [
            items.slice(0, p1Count),
            items.slice(p1Count, p1Count + p2Count),
            items.slice(p1Count + p2Count)
        ];
    }

    const chunks: T[][] = [];
    let currentIndex = 0;

    // Page 1: Pack as many items as possible without overflowing, avoiding orphan 1-item final page
    let p1Height = 0;
    const p1Items: T[] = [];
    while (currentIndex < items.length) {
        const nextH = itemHeights[currentIndex];
        const remainingItemsAfterThis = items.length - (currentIndex + 1);
        
        // Prevent leaving an orphan single row on the final page when 2+ items could share it
        const wouldLeaveOrphanOnFinalPage = remainingItemsAfterThis === 1 && items.length >= 4;

        if (p1Height + nextH <= page1RowBudget && !wouldLeaveOrphanOnFinalPage && remainingItemsAfterThis >= 1) {
            p1Height += nextH;
            p1Items.push(items[currentIndex]);
            currentIndex++;
        } else if (p1Items.length === 0) {
            p1Height += nextH;
            p1Items.push(items[currentIndex]);
            currentIndex++;
            break;
        } else {
            break;
        }
    }
    chunks.push(p1Items);

    // Subsequent pages
    while (currentIndex < items.length) {
        const remainingHeight = itemHeights.slice(currentIndex).reduce((s, h) => s + h, 0);
        
        // Can all remaining fit on this page as the FINAL page (with bottom sections)?
        if (remainingHeight <= finalPageRowBudget) {
            chunks.push(items.slice(currentIndex));
            break;
        }

        // Otherwise pack this continuation page
        let pageH = 0;
        const pageItems: T[] = [];
        while (currentIndex < items.length) {
            const nextH = itemHeights[currentIndex];
            const remainingItemsAfterThis = items.length - (currentIndex + 1);
            const wouldLeaveOrphan = remainingItemsAfterThis === 1 && items.length >= 4;
            
            if (pageH + nextH <= continuationRowBudget && !wouldLeaveOrphan && remainingItemsAfterThis >= 1) {
                pageH += nextH;
                pageItems.push(items[currentIndex]);
                currentIndex++;
            } else if (pageItems.length === 0) {
                pageH += nextH;
                pageItems.push(items[currentIndex]);
                currentIndex++;
                break;
            } else {
                break;
            }
        }
        chunks.push(pageItems);
    }

    return chunks;
}
