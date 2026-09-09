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

/**
 * Unified single-page density model.
 *
 * NORMAL      — content fits as-is; render is untouched.
 * DENSE_PLAIN — 8-14 plain rows render with the existing compact tier
 *               (tableDensity compact, rowHeight <= 30). No images.
 * DENSE_IMAGE — 8-14 rows with product images render with the dense-image
 *               profile (compact tier + compact image boxes + section compaction).
 *
 * Exactly ONE function decides; pagination and rendering both consume it,
 * so the model can never claim a fit the DOM does not render.
 */
export type SinglePageDensity = 'normal' | 'dense-plain' | 'dense-image';

/**
 * Themes whose DOM implements the dense-image profile (compact image boxes +
 * section compaction keyed on the pdf-dense-profile container class).
 * Every theme listed here must honestly render the profile — verified per
 * theme by e2e/pdf-density.spec.ts, never by assumption.
 */
export const DENSE_IMAGE_THEMES = ['modern', 'corporate', 'classic', 'minimal', 'pro', 'bold', 'invoice'];

export interface DensitySource {
    config: Record<string, unknown>;
    layout?: Array<{ id: string; enabled?: boolean }>;
    bankData?: { bankName?: unknown; iban?: unknown; accountNumber?: unknown } | null;
    quoteData?: { deliveryTerms?: unknown; warrantyTerms?: unknown; terms?: unknown; notes?: unknown } | null;
    customerData?: Record<string, unknown> | null;
}

/**
 * Builds chunk options from quote state. Single source used by BOTH the
 * pagination engine and the render override, so the two can never disagree
 * about section visibility, theme, density or table settings.
 */
export function buildDensityChunkOptions(source: DensitySource): ChunkOptions & { theme?: string } {
    const { config } = source;
    const layoutMap: Record<string, boolean> = {};
    (source.layout || []).forEach((l) => { layoutMap[l.id] = l.enabled !== false; });
    const bank = (source.bankData || {}) as Record<string, unknown>;
    const quote = (source.quoteData || {}) as Record<string, unknown>;
    const customer = (source.customerData || {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === 'string' ? v : '');
    const notes = str(quote.notes);
    const hasCustomer = ['name', 'company', 'phone', 'email', 'address', 'taxOffice', 'taxNumber']
        .some((f) => str(customer[f]).trim().length > 0);
    return {
        itemsPerPage: (config.itemsPerPage as number | string | undefined) ?? 14,
        showSummary: config.showSummary !== false && layoutMap['summary'] !== false,
        showBankInfo: config.showBankInfo !== false && layoutMap['bankInfo'] !== false,
        hasBankData: !!(bank.bankName || bank.iban || bank.accountNumber),
        showSignatures: config.showSignatures !== false && layoutMap['signatures'] !== false,
        showCustomerSignature: !!config.showCustomerSignature,
        showTerms: config.showTerms !== false && layoutMap['notes'] !== false,
        hasTerms: !!(quote.deliveryTerms || quote.warrantyTerms || quote.terms),
        showNotes: config.showNotes !== false && layoutMap['notes'] !== false,
        hasNotes: notes.trim().length > 0,
        notesLength: notes.length,
        hasCustomer,
        customFooter: config.customFooter as string | undefined,
        isLandscape: config.pageOrientation === 'landscape',
        margins: config.margins as string | undefined,
        tableRowHeight: typeof config.tableRowHeight === 'number' ? config.tableRowHeight : undefined,
        tableDensity: config.tableDensity as string | undefined,
        sectionSpacing: typeof config.sectionSpacing === 'number' ? config.sectionSpacing as number : undefined,
        showTableImages: config.showTableImages !== false,
        theme: typeof config.theme === 'string' ? config.theme : undefined,
        paginationMode: typeof config.paginationMode === 'string' ? config.paginationMode : undefined,
    };
}

interface RowSpec {
    base: number;
    descPerLine: number;
    namePerChunk: number;
    imageFloor: number;
    factor: number;
}

function measureRow(itemObj: Record<string, unknown>, showImages: boolean, spec: RowSpec): number {
    let textH = spec.base;
    if (typeof itemObj.description === 'string' && itemObj.description.trim().length > 0) {
        const lines = itemObj.description.split('\n').length;
        const wrapLines = Math.floor(itemObj.description.length / 65);
        // Any description renders as (at least) a second row line — never cost 0.
        const extraLines = Math.max(1, lines - 1, wrapLines);
        textH += extraLines * spec.descPerLine;
    }
    if (typeof itemObj.name === 'string' && itemObj.name.length > 50) {
        textH += Math.floor(itemObj.name.length / 50) * spec.namePerChunk;
    }
    // Text extras stack on the base row, but the image floor does NOT stack:
    // when the image is taller than the text block, a short description costs 0.
    const imageH = (showImages && itemObj.image) ? Math.max(spec.base, spec.imageFloor) : 0;
    return Math.max(textH, imageH) * spec.factor;
}

interface SectionGeometry {
    top: number;
    thead: number;
    bottom: number;
    hasBottom: boolean;
    continuation: number;
}

function sectionGeometry(options: ChunkOptions, scale: number): SectionGeometry {
    const isLandscape = !!options.isLandscape;
    const top = (((isLandscape ? 120 : 180) + (options.hasCustomer !== false ? (isLandscape ? 60 : 95) : 0))) / scale;
    const thead = 36 / scale;
    let bottom = 0;
    if (options.showSummary !== false) bottom += 175;
    if (options.showBankInfo !== false && options.hasBankData !== false) bottom += 20; // in 2-col layout it shares row with summary
    if (options.showSignatures !== false) {
        bottom += options.showCustomerSignature ? 100 : 85;
    }
    if (options.showTerms !== false && options.hasTerms) bottom += 65;
    if (options.showNotes !== false && options.hasNotes) {
        bottom += 45 + Math.min(60, Math.floor((options.notesLength || 0) / 60) * 14);
    }
    if (options.customFooter) bottom += 25;
    const bottomScaled = bottom / scale;
    return { top, thead, bottom: bottomScaled, hasBottom: bottom > 30, continuation: 40 / scale };
}

function densityScale(options: ChunkOptions): number {
    const rawDensity = (options as Record<string, unknown>).tableDensity as unknown;
    const fallbackDensity = options.margins === 'compact' ? 'compact' : (options.margins === 'spacious' || options.margins === 'wide' ? 'spacious' : undefined);
    const density = resolveTableDensity(rawDensity ?? fallbackDensity);
    const isCompact = options.margins === 'compact' || density === 'compact';
    const isSpacious = options.margins === 'spacious' || options.margins === 'wide' || density === 'spacious';
    return isCompact ? 1.08 : (isSpacious ? 0.92 : 1.0);
}

function pageCapacityFor(options: ChunkOptions): number {
    return options.isLandscape ? 760 : 1100;
}

function hasEffectiveImages<T>(items: T[], options: ChunkOptions): boolean {
    if (options.showTableImages === false) return false;
    return items.some((it) => {
        const o = it as Record<string, unknown>;
        return !!o && typeof o === 'object' && !!o.image;
    });
}

/**
 * Shared compact-content guards with machine-readable rejection reason.
 * Long-content safety: pathological content paginates, never clips.
 * Returns null when all guards pass.
 */
function compactGuardRejection<T>(items: T[], options: ChunkOptions): DensityReason | null {
    if (options.isLandscape) return 'insufficient-a4-budget';
    const optRecord = options as Record<string, unknown>;
    if (optRecord.tableDensity === 'spacious') return 'spacious-layout';
    const margins = options.margins;
    if (margins === 'spacious' || margins === 'wide') return 'spacious-layout';
    if (typeof optRecord.sectionSpacing === 'number') return 'custom-spacing';
    if (optRecord.tableCellPadding != null && String(optRecord.tableCellPadding).trim() !== '') return 'custom-cell-padding';
    const rh = typeof options.tableRowHeight === 'number' && options.tableRowHeight > 0 ? options.tableRowHeight : 35;
    if (rh > 36) return 'custom-row-height';
    for (const it of items) {
        const o = it as Record<string, unknown>;
        if (o && typeof o === 'object') {
            if (typeof o.name === 'string' && o.name.length > 50) return 'long-content';
            if (typeof o.description === 'string' && o.description.length > 120) return 'long-content';
        }
    }
    return null;
}

/**
 * Canonical single-page decision. Returns the density the quote must render
 * with to fit one A4 portrait sheet, or null when it must paginate.
 * Pagination (chunkQuoteItems) and rendering (PrintableQuoteV2 override)
 * both consume this — one decision, no model/render drift.
 */
export function resolveSinglePageDensity<T>(rawItems: T[], options: ChunkOptions & { theme?: string } = {}): SinglePageDensity | null {
    return diagnoseSinglePageDensity(rawItems, options).density;
}

export type DensityReason =
    | 'fits-normal'
    | 'dense-plain'
    | 'dense-image'
    | 'manual-pagination'
    | 'unsupported-theme'
    | 'long-content'
    | 'spacious-layout'
    | 'custom-row-height'
    | 'custom-cell-padding'
    | 'custom-spacing'
    | 'insufficient-a4-budget';

export interface DensityPrediction {
    /** Modeled content height in layout units. */
    usedHeight: number;
    /** Modeled usable height (budget incl. caps) in layout units. */
    availableHeight: number;
    /** usedHeight - availableHeight; <= 0 fits. */
    overflowPx: number;
}

export interface DensityDiagnosis {
    density: SinglePageDensity | null;
    reason: DensityReason;
    /**
     * Model-predicted geometry per evaluated profile (dev/test diagnostics only,
     * never shown in normal UI). Profiles that were not evaluated are absent.
     */
    predicted: Partial<Record<'normal' | 'dense-plain' | 'dense-image', DensityPrediction>>;
}

function isManualPagination(options: ChunkOptions): boolean {
    if (options.paginationMode !== 'manual') return false;
    const v = options.itemsPerPage;
    const n = typeof v === 'number' ? v : (typeof v === 'string' && v !== 'auto' ? Number(v) : NaN);
    return !Number.isNaN(n) && n > 0 && n < 50;
}

/**
 * Canonical single-page decision WITH machine-readable reason. Pagination
 * (chunkQuoteItems) and rendering (PrintableQuoteV2 override) both consume
 * this — one decision, no model/render drift.
 */
export function diagnoseSinglePageDensity<T>(rawItems: T[], options: ChunkOptions & { theme?: string } = {}): DensityDiagnosis {
    const items = (rawItems || []).filter(hasValidItemContent);
    const predicted: DensityDiagnosis['predicted'] = {};
    if (isManualPagination(options)) return { density: null, reason: 'manual-pagination', predicted };
    const capacity = pageCapacityFor(options);

    // 1) NORMAL — fits as-is, render untouched (includes the comfortable 8-11 path).
    {
        const scale = densityScale(options);
        const base = typeof options.tableRowHeight === 'number' && options.tableRowHeight > 0 ? options.tableRowHeight : 34;
        const showImages = options.showTableImages !== false;
        const total = items.reduce((sum, it) => sum + measureRow(it as Record<string, unknown>, showImages, {
            base, descPerLine: 16, namePerChunk: 14, imageFloor: 50, factor: 1,
        }), 0);
        const geo = sectionGeometry(options, scale);
        const isLandscape = !!options.isLandscape;
        const cap = isLandscape ? 500 : 550;
        const normalCap = isLandscape ? cap : (geo.hasBottom ? 360 : 550);
        const budget = Math.min(normalCap, capacity - geo.top - geo.thead - geo.bottom);
        const optRecord = options as Record<string, unknown>;
        const avgRow = items.length > 0 ? total / items.length : 0;
        const fitsTwelve = !isLandscape && scale >= 1.0
            && typeof optRecord.sectionSpacing !== 'number'
            && (optRecord.tableCellPadding == null || String(optRecord.tableCellPadding).trim() === '')
            && items.length >= 8 && items.length <= 11 && avgRow <= 52
            && total <= Math.min(510, capacity - geo.top - geo.thead - geo.bottom);
        predicted.normal = { usedHeight: total, availableHeight: budget, overflowPx: total - budget };
        if (total <= budget && (!geo.hasBottom || items.length <= 7)) {
            return { density: 'normal', reason: 'fits-normal', predicted };
        }
        if (fitsTwelve) return { density: 'normal', reason: 'fits-normal', predicted };
    }

    if (items.length < 8 || items.length > 14) {
        return { density: null, reason: 'insufficient-a4-budget', predicted };
    }

    // Shared guard diagnostics — one implementation, used by both dense tracks.
    const guardRejection = compactGuardRejection(items, options);
    if (guardRejection) return { density: null, reason: guardRejection, predicted };

    // 2) DENSE_PLAIN — existing compact tier (tableDensity compact, rowHeight <= 30).
    // Cap 510 admits uniform short-desc rows (14 x ~36); the computed budget below
    // still rejects genuinely tall content. E2E-measured, see e2e/pdf-density.spec.ts.
    if (!hasEffectiveImages(items, options)) {
        const total = items.reduce((sum, it) => sum + measureRow(it as Record<string, unknown>, false, {
            base: 30, descPerLine: 16, namePerChunk: 14, imageFloor: 0, factor: 0.78,
        }), 0);
        const geo = sectionGeometry(options, Math.max(densityScale(options), 1.08));
        const budget = Math.min(510, capacity - geo.top - geo.thead - geo.bottom);
        predicted['dense-plain'] = { usedHeight: total, availableHeight: budget, overflowPx: total - budget };
        if (total <= budget) return { density: 'dense-plain', reason: 'dense-plain', predicted };
        return { density: null, reason: 'insufficient-a4-budget', predicted };
    }

    // 3) DENSE_IMAGE — compact tier + compact image boxes + section compaction.
    // Capability is theme-aware: only themes whose DOM implements the profile
    // may claim the fit (see DENSE_IMAGE_THEMES).
    {
        const theme = typeof options.theme === 'string' && options.theme ? options.theme : 'modern';
        if (!DENSE_IMAGE_THEMES.includes(theme)) return { density: null, reason: 'unsupported-theme', predicted };
        const total = items.reduce((sum, it) => sum + measureRow(it as Record<string, unknown>, true, {
            base: 26, descPerLine: 9, namePerChunk: 7, imageFloor: 36, factor: 1,
        }), 0);
        const geo = sectionGeometry(options, 1.2);
        const budget = Math.min(520, capacity - geo.top - geo.thead - geo.bottom);
        predicted['dense-image'] = { usedHeight: total, availableHeight: budget, overflowPx: total - budget };
        if (total <= budget) return { density: 'dense-image', reason: 'dense-image', predicted };
    }

    return { density: null, reason: 'insufficient-a4-budget', predicted };
}

export function estimateAutoItemsPerPage(availableHeightPx: number, rowHeight?: number): number {
    const h = typeof rowHeight === 'number' && rowHeight > 0 ? rowHeight : 35;
    const raw = Math.floor(availableHeightPx / h);
    return Math.min(20, Math.max(4, raw));
}

export interface ChunkOptions {
    itemsPerPage?: number | string;
    /**
     * Explicit pagination semantics. Only 'manual' honors numeric itemsPerPage
     * as a hard override. Anything else (including legacy stored numbers
     * without this key) enters auto-fit via the density resolver.
     */
    paginationMode?: string;
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
    showTableImages?: boolean;
    measuredContentHeight?: number;
    /** Rendering theme name — gates theme-specific dense profiles (see DENSE_IMAGE_THEMES). */
    theme?: string;
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

    // Explicit MANUAL mode only: numeric itemsPerPage is an intentional user
    // instruction and bypasses the density resolver. Anything else (including a
    // legacy stored number without paginationMode) enters auto-fit below.
    const paginationMode = options.paginationMode === 'manual' ? 'manual' : 'auto-fit';
    const ippRaw = options.itemsPerPage;
    const ippNum = typeof ippRaw === 'number' ? ippRaw : (typeof ippRaw === 'string' && ippRaw !== 'auto' ? Number(ippRaw) : NaN);
    if (paginationMode === 'manual' && !Number.isNaN(ippNum) && ippNum > 0 && ippNum < 50) {
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

    // One canonical density decision drives BOTH pagination here and the render
    // override in PrintableQuoteV2 — they can never disagree.
    const density = resolveSinglePageDensity(items, options);
    if (density) {
        return [items];
    }

    // 2. Multi-Page Distribution with greedy packing and orphan prevention.
    // Packing always uses the NORMAL (non-override) measurement: if content did not
    // qualify for a dense profile above, it must paginate as rendered by default.
    const isLandscape = !!options.isLandscape;
    const st = { scale: densityScale(options) };
    const pageCapacity = pageCapacityFor(options);
    const showImages = options.showTableImages !== false;
    const baseRow = typeof options.tableRowHeight === 'number' && options.tableRowHeight > 0 ? options.tableRowHeight : 34;
    const itemHeights = items.map(item => measureRow(item as Record<string, unknown>, showImages, {
        base: baseRow, descPerLine: 16, namePerChunk: 14, imageFloor: 50, factor: 1,
    }));
    const geo = sectionGeometry(options, st.scale);
    const maxPage1RowBudget = isLandscape ? 260 : 340;
    const maxMiddlePageRowBudget = isLandscape ? 320 : 420;
    const maxFinalPageRowBudget = isLandscape ? 280 : 250;
    const page1RowBudget = Math.min(maxPage1RowBudget, pageCapacity - geo.top - geo.thead);
    const continuationRowBudget = Math.min(maxMiddlePageRowBudget, pageCapacity - geo.continuation - geo.thead);
    const finalPageRowBudget = Math.min(maxFinalPageRowBudget, pageCapacity - geo.continuation - geo.thead - geo.bottom);

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

        // Otherwise pack this continuation page.
        // A fitting LAST item is always taken (no final page needed for it) —
        // otherwise packing degrades into [6,6,1]-style orphan tails.
        let pageH = 0;
        const pageItems: T[] = [];
        while (currentIndex < items.length) {
            const nextH = itemHeights[currentIndex];
            const remainingItemsAfterThis = items.length - (currentIndex + 1);
            const wouldLeaveOrphan = remainingItemsAfterThis === 1 && items.length >= 4;
            const isLastItem = remainingItemsAfterThis === 0;

            if (pageH + nextH <= continuationRowBudget && (!wouldLeaveOrphan || isLastItem)) {
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
