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

export type TableDensity = 'compact' | 'comfortable' | 'spacious';

export function resolveTableDensity(value: unknown): TableDensity {
    if (value === 'compact' || value === 'comfortable' || value === 'spacious') return value as TableDensity;
    return 'comfortable';
}

export function getCellPaddingForRowHeight(rowHeight?: number): string {
    const h = typeof rowHeight === 'number' && rowHeight > 0 ? rowHeight : 35;
    if (h <= 32) return '4px 6px';
    if (h <= 36) return '6px 6px';
    if (h <= 42) return '8px 6px';
    return '8px 8px';
}

export function getDensityTableHeaderPadding(density?: unknown): string {
    const d = resolveTableDensity(density);
    if (d === 'compact') return '5px 6px';
    if (d === 'spacious') return '9px 6px';
    return '7px 6px';
}

export function getDensityHeaderFontSize(density?: unknown): string {
    const d = resolveTableDensity(density);
    if (d === 'compact') return '7.5pt';
    if (d === 'spacious') return '8.5pt';
    return '8pt';
}

export function getSectionSpacing(density?: unknown): string {
    const d = resolveTableDensity(density);
    if (d === 'compact') return '0.4rem';
    if (d === 'spacious') return '0.8rem';
    return '0.6rem';
}

export const SQUEEZE_MIN_ITEMS = 8;
export const SQUEEZE_MAX_ITEMS = 14;

/**
 * Squeeze-to-single-page eligibility: 8-14 plain portrait items are auto-compacted
 * (existing compact tier) so the summary never ends up orphaned on page 2.
 * Pure eligibility check — the chunker independently re-verifies the height budget,
 * so enabling squeeze can never cause overflow.
 */
export function shouldSqueezeSinglePage<T>(rawItems: T[], options: ChunkOptions = {}): boolean {
    const items = (rawItems || []).filter(hasValidItemContent);
    if (items.length < SQUEEZE_MIN_ITEMS || items.length > SQUEEZE_MAX_ITEMS) return false;
    if (options.isLandscape) return false;
    const optRecord = options as Record<string, unknown>;
    if (optRecord.tableDensity === 'spacious') return false;
    const margins = options.margins;
    if (margins === 'spacious' || margins === 'wide') return false;
    if (typeof optRecord.sectionSpacing === 'number') return false;
    if (optRecord.tableCellPadding != null && String(optRecord.tableCellPadding).trim() !== '') return false;
    const rh = typeof options.tableRowHeight === 'number' && options.tableRowHeight > 0 ? options.tableRowHeight : 35;
    if (rh > 36) return false;
    for (const it of items) {
        const o = it as Record<string, unknown>;
        if (o && typeof o === 'object') {
            if (o.image) return false;
            if (typeof o.name === 'string' && o.name.length > 50) return false;
            if (typeof o.description === 'string' && o.description.length > 120) return false;
        }
    }
    return true;
}

export function estimateAutoItemsPerPage(availableHeightPx: number, rowHeight?: number): number {
    const h = typeof rowHeight === 'number' && rowHeight > 0 ? rowHeight : 35;
    const raw = Math.floor(availableHeightPx / h);
    return Math.min(20, Math.max(4, raw));
}

export interface ChunkOptions {
    itemsPerPage?: number | string;
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
    tableDensity?: string;
    sectionSpacing?: number;
    tableCellPadding?: string;
    measuredContentHeight?: number;
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
 * A quote item is considered valid if it has a non-empty name.
 */
export function hasValidItemContent(item: unknown): boolean {
    if (item === null || item === undefined) return false;
    if (typeof item === 'number' || typeof item === 'string') return true;
    if (typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        if ('name' in obj) {
            return typeof obj.name === 'string' && obj.name.trim().length > 0;
        }
        return true;
    }
    return false;
}

export interface ExportBlockReasonParams {
    items?: unknown[] | null;
    customerName?: string | null;
    customerCompany?: string | null;
}

/**
 * Pure export guard — kalem + müşteri yoksa bozuk PDF üretme.
 * Dönen string hata mesajıdır; null ise export serbest.
 * t: çeviri fonksiyonu (yoksa TR varsayılan).
 */
export function getExportBlockReason(
    { items, customerName, customerCompany }: ExportBlockReasonParams,
    t?: (key: string) => string
): string | null {
    const fallback = (key: string, def: string) => {
        try { return t?.(key) || def; } catch { return def; }
    };
    const validItems = (items || []).filter(hasValidItemContent);
    if (validItems.length === 0) {
        return fallback('addAtLeastOneProduct', 'Lütfen PDF indirmeden önce en az bir geçerli ürün ekleyin.');
    }
    if (!customerName?.trim() && !customerCompany?.trim()) {
        return fallback('validationCustomerRequired', 'Lütfen önce müşteri bilgisi girin.');
    }
    return null;
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

    // Manual override if explicitly set (numeric). 'auto' falls through to height-based pagination with max 20 cap.
    const ippRaw = options.itemsPerPage;
    const ippNum = typeof ippRaw === 'number' ? ippRaw : (typeof ippRaw === 'string' && ippRaw !== 'auto' ? Number(ippRaw) : NaN);
    if (!Number.isNaN(ippNum) && ippNum !== 14 && ippNum > 0 && ippNum < 50) {
        const capped = Math.min(20, Math.max(1, Math.floor(ippNum)));
        const chunks: T[][] = [];
        for (let i = 0; i < items.length; i += capped) {
            chunks.push(items.slice(i, i + capped));
        }
        return chunks;
    }
    // Auto: if measuredContentHeight provided, derive itemsPerPage with max 20 cap via estimateAutoItemsPerPage
    if (ippRaw === 'auto' && typeof options.measuredContentHeight === 'number' && options.measuredContentHeight > 0) {
        const auto = estimateAutoItemsPerPage(options.measuredContentHeight, options.tableRowHeight);
        const chunks: T[][] = [];
        for (let i = 0; i < items.length; i += auto) {
            chunks.push(items.slice(i, i + auto));
        }
        return chunks;
    }

    const isLandscape = !!options.isLandscape;
    const rawDensity = (options as Record<string, unknown>).tableDensity as unknown;
    const fallbackDensity = options.margins === 'compact' ? 'compact' : (options.margins === 'spacious' || options.margins === 'wide' ? 'spacious' : undefined);
    const density = resolveTableDensity(rawDensity ?? fallbackDensity);
    // isCompact logic considers both margins and tableDensity
    const isCompact = options.margins === 'compact' || density === 'compact';
    const isSpacious = options.margins === 'spacious' || options.margins === 'wide' || density === 'spacious';

    // Base available height per page in model units. A4 portrait is 1122px tall;
    // 1060 keeps ~60px slack for rounding/epsilon overflow (the old 1000 rejected
    // small quotes like 7 described rows that genuinely fit one physical sheet).
    const pageCapacity = isLandscape ? 760 : 1060;
    // Squeeze: measure 8-14 plain items with the compact tier so they + summary fit one page.
    // The single-page budget gate below still enforces the fit — squeeze never overflows.
    const squeeze = shouldSqueezeSinglePage(items, options);
    let scaleFactor = isCompact ? 1.08 : (isSpacious ? 0.92 : 1.0);
    let rowFactor = 1;
    if (squeeze) {
        scaleFactor = Math.max(scaleFactor, 1.08);
        // Compact tier rows are genuinely shorter (4px vs 8px vertical padding):
        // calibrated against rendered output (10 described rows + summary fit one A4).
        rowFactor = 0.78;
    }

    // Measure Item Heights.
    // Text extras stack on the base row, but the image floor does NOT stack:
    // when the image is taller than the text block, a short description costs 0.
    const itemHeights = items.map(item => {
        const itemObj = item as Record<string, unknown>;
        const base = typeof options.tableRowHeight === 'number' && options.tableRowHeight > 0
            ? options.tableRowHeight
            : 34; // standard row height

        let textH = base;
        if (typeof itemObj.description === 'string' && itemObj.description.trim().length > 0) {
            const lines = itemObj.description.split('\n').length;
            const wrapLines = Math.floor(itemObj.description.length / 65);
            // Any description renders as (at least) a second row line — never cost 0.
            const extraLines = Math.max(1, lines - 1, wrapLines);
            textH += extraLines * 16;
        }
        if (typeof itemObj.name === 'string' && itemObj.name.length > 50) {
            textH += Math.floor(itemObj.name.length / 50) * 14;
        }
        const imageH = itemObj.image ? Math.max(base, 56) : 0;
        return Math.max(textH, imageH) * rowFactor;
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

    // Calibrate maximum row capacities based on visual layout.
    // Squeezed single page (compact tier): 14 plain rows x ~27 units fit 1000 with header/customer/summary.
    // Portrait cap 360: small quotes (<=7 rows, even described) genuinely fit one physical
    // A4 (~1040px incl. sections) — a tighter cap forces absurd [3,2]/[4,2] orphan splits.
    // The computed budget above still enforces the true physical fit.
    const maxSinglePageRowBudget = isLandscape
        ? (hasBottomSections ? 180 : 500)
        : squeeze ? 430 : (hasBottomSections ? 360 : 550);
    const maxPage1RowBudget = isLandscape ? 260 : 340;
    const maxMiddlePageRowBudget = isLandscape ? 320 : 420;
    const maxFinalPageRowBudget = isLandscape ? 280 : 250;

    const singlePageRowBudget = Math.min(maxSinglePageRowBudget, (pageCapacity - page1TopBudget - tableHeaderHeight - finalBottomHeight));
    const totalItemsHeight = itemHeights.reduce((sum, h) => sum + h, 0);

    // 1. Single Page Test (squeezed 8-14 items included — budget gate still enforced)
    if (totalItemsHeight <= singlePageRowBudget && (!hasBottomSections || items.length <= 7 || squeeze)) {
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

    // Enforce max 20 cap per page (auto pagination guard)
    const capped: T[][] = [];
    for (const ch of chunks) {
        if (ch.length <= 20) { capped.push(ch); continue; }
        for (let i = 0; i < ch.length; i += 20) capped.push(ch.slice(i, i + 20));
    }
    return capped;
}
