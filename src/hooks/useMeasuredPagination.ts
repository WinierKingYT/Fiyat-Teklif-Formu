import { useMemo, useRef, useLayoutEffect, useState } from 'react';
import { PAGE_SIZES } from '@/utils/pdfGenerator';
import { OVERFLOW_TOLERANCE_PX, measurePdfPageGeometries, type PdfPageGeometry } from '@/utils/pdfLayoutMeasurement';
import { chunkByCounts, moveOverflowRows, planChunkRowCounts, type PageCaps } from '@/utils/pdfPagination';
import { buildDensityChunkOptions, chunkQuoteItems, DENSE_IMAGE_THEMES, hasValidItemContent, type DensitySource } from '@/utils/themeHelpers';

/**
 * AUTO-FIT MEASUREMENT AUTHORITY — render, measure, and let the DOM decide.
 *
 * 1. Render EVERYTHING on one page as configured (density normal) → measure.
 *    Fits the physical sheet?  Keep it. This is the single-page acceptance the
 *    old heuristic pre-judged with 340/420/250 budgets + a 50px image row floor.
 * 2. Overflows? Re-render one page with the dense tier (compact rows, compact
 *    image boxes) → measure. Fits?  Keep one dense page.
 * 3. Still overflows? Split — but with MEASURED row heights and MEASURED
 *    per-page budgets (real big/mini headers, real totals block). Every page is
 *    then re-measured against the physical sheet and trailing rows move forward
 *    until nothing overflows. The DOM is the only authority for "fits".
 *
 * The preview page boxes grow with their content (no max-height), so a page
 * "fits" exactly when its CONTENT height (scrollHeight) fits the physical sheet
 * height (e.g. A4 portrait = 297mm = 1122.5px), the same @page rule pdfGenerator
 * applies for export. clientHeight is never used as a budget.
 */

export type PaginationDensity = 'normal' | 'dense';

export interface MeasuredPaginationResult<T> {
    itemChunks: T[][];
    density: PaginationDensity;
    /** True when dense applies the smaller image-box profile. */
    denseImage: boolean;
    /** Row height themes use to derive paddings (dense clamps it <= 30). */
    effectiveRowHeight: number;
}

interface PlanState<T> {
    stage: 'fit-normal' | 'fit-dense' | 'split' | 'done';
    chunks: T[][];
    density: PaginationDensity;
    pass: number;
}

const MINI_HEADER_EST = 46;
const NOTE_EST = 46;
const MAX_PASSES = 8;
/**
 * Headroom a single page must keep below the physical sheet to be accepted.
 * Empirically (E2E vs download parity): a page at scrollHeight 1111px exported
 * as 2 physical pages while 1058px exported as 1, so the exported sheet is
 * smaller than the raw 297mm box (font/html2canvas rounding). A single page is
 * only "measured fit" when it clears the sheet by at least this margin.
 */
const SINGLE_PAGE_SAFETY_PX = 56;

/** Physical sheet height in px for the configured page size/orientation. */
export function sheetHeightPx(config: Record<string, unknown>): number {
    const key = typeof config.pageSize === 'string' ? (config.pageSize as keyof typeof PAGE_SIZES) : 'a4';
    const size = PAGE_SIZES[key] || PAGE_SIZES.a4;
    const portraitHeight = config.pageOrientation === 'landscape' ? size.width : size.height;
    return (portraitHeight * 96) / 25.4;
}

function contentFits(g: PdfPageGeometry, sheet: number, tol: number): boolean {
    return g.scrollHeight <= sheet + tol;
}

function contentOverflow(g: PdfPageGeometry, sheet: number): number {
    return g.scrollHeight - sheet - OVERFLOW_TOLERANCE_PX;
}

/** Content consumed below the item rows (totals on the single page). */
function belowContent(g: PdfPageGeometry): number {
    if (g.lastRowBottom == null || g.theadHeight == null) return NOTE_EST;
    return Math.max(0, g.scrollHeight - g.lastRowBottom);
}

function capsFromSinglePage(g: PdfPageGeometry, sheet: number): PageCaps {
    const above = Math.max(0, g.aboveTable ?? 0);
    const thead = g.theadHeight ?? 0;
    return {
        first: sheet - above - NOTE_EST,
        continuation: sheet - MINI_HEADER_EST - thead - NOTE_EST,
        last: sheet - above - Math.max(NOTE_EST, belowContent(g)),
    };
}

/** Real budgets: first/last reuse the (tall) single page, continuation uses the
 *  real mini-header from the freshly rendered multi-page DOM. */
function capsFromPages(pages: PdfPageGeometry[], seed: PdfPageGeometry, sheet: number): PageCaps {
    const above0 = Math.max(0, seed.aboveTable ?? 0);
    const cont = pages.length > 1 ? pages[1] : pages[0];
    const aboveCont = Math.max(0, cont.aboveTable ?? 0);
    return {
        first: sheet - above0 - NOTE_EST,
        continuation: sheet - aboveCont - NOTE_EST,
        last: sheet - above0 - Math.max(NOTE_EST, belowContent(seed)),
    };
}

/** Absorb a lone trailing row into the previous page ONLY when that page has
 *  measured free sheet space for it (real rows + safe header/note estimates).
 *  Free space is asserted before merging, so the result cannot re-overflow. */
function maybeMergeLoneTail<T>(pages: PdfPageGeometry[], chunks: T[][], sheet: number): T[][] {
    if (chunks.length < 2) return chunks;
    const lastIdx = chunks.length - 1;
    if (chunks[lastIdx].length !== 1) return chunks;
    const prev = pages[lastIdx - 1];
    if (!prev || !prev.rows) return chunks;
    const tailRowH = pages[lastIdx]?.rows?.[0]?.height ?? 0;
    const above = Math.max(0, prev.aboveTable ?? 0);
    const used = prev.rows.reduce((s, r) => s + r.height, 0);
    const free = sheet - above - NOTE_EST - used;
    if (free - tailRowH >= OVERFLOW_TOLERANCE_PX) {
        const out = chunks.map((c) => c.slice());
        out[lastIdx - 1] = out[lastIdx - 1].concat(out[lastIdx]);
        out.pop();
        return out;
    }
    return chunks;
}

type ItemFingerprint = { name?: string; description?: string; image?: unknown };

export function useMeasuredPagination<T>(
    rawItems: T[],
    source: DensitySource,
    containerId?: string
): MeasuredPaginationResult<T> {
    const items = useMemo<T[]>(() => (rawItems || []).filter(hasValidItemContent) as T[], [rawItems]);

    const options = useMemo(() => buildDensityChunkOptions(source), [source]);
    const theme = useMemo(() => (typeof options.theme === 'string' && options.theme ? options.theme : 'modern'), [options.theme]);
    const sheet = useMemo(() => sheetHeightPx(source.config), [source.config]);

    const isManual = useMemo(() => {
        if (options.paginationMode !== 'manual') return false;
        const v = options.itemsPerPage;
        const n = typeof v === 'number' ? v : (typeof v === 'string' && v !== 'auto' ? Number(v) : NaN);
        return !Number.isNaN(n) && n > 0 && n < 50;
    }, [options.paginationMode, options.itemsPerPage]);

    const manualChunks = useMemo<T[][] | null>(() => {
        if (!isManual) return null;
        return chunkQuoteItems(items, { ...options, paginationMode: 'manual' });
    }, [isManual, items, options]);

    const denseImage = useMemo(() => {
        if (options.showTableImages === false) return false;
        return items.some((it) => {
            const o = it as Record<string, unknown>;
            return !!o && typeof o === 'object' && !!o.image;
        });
    }, [items, options.showTableImages]);

    const canTryDense = useMemo(() => DENSE_IMAGE_THEMES.includes(theme), [theme]);

    // Anything that changes rendered geometry invalidates the fitted plan.
    const planKey = useMemo(
        () =>
            JSON.stringify({
                theme,
                items: items
                    .map((it) => {
                        const o = (it as ItemFingerprint) || {};
                        return `${String(o.name ?? '').length}:${String(o.description ?? '').length}:${o.image ? 1 : 0}`;
                    })
                    .join('|'),
                options,
            }),
        [theme, items, options]
    );

    const initialChunks = useMemo<T[][]>(() => {
        if (isManual && manualChunks) return manualChunks;
        return items.length > 0 ? [items] : [[]];
    }, [isManual, manualChunks, items]);

    const [plan, setPlan] = useState<PlanState<T>>({
        stage: isManual ? 'done' : 'fit-normal',
        chunks: initialChunks,
        density: 'normal',
        pass: 0,
    });
    const planKeyRef = useRef<string>(planKey);
    const itemsRef = useRef<T[]>(items);

    useLayoutEffect(() => {
        itemsRef.current = items;
        if (isManual || plan.stage === 'done') return;
        if (!containerId) return;
        const el = document.getElementById(containerId);
        if (!el) return;

        if (planKeyRef.current !== planKey) {
            planKeyRef.current = planKey;
            setPlan({ stage: 'fit-normal', chunks: itemsRef.current.length > 0 ? [itemsRef.current] : [[]], density: 'normal', pass: 0 });
            return;
        }

        const pages = measurePdfPageGeometries(el);
        if (pages.length === 0) return;
        const currentItems = itemsRef.current;

        if (plan.stage === 'fit-normal' || plan.stage === 'fit-dense') {
            // Strict single-page acceptance: the export sheet is EXACTLY the
            // page size (297mm) AND falls slightly short of the raw preview box
            // (font/html2canvas rounding), so "fits one page" must hold with real
            // headroom (SINGLE_PAGE_SAFETY_PX), never on the 24px preview-marker
            // tolerance that only exists for non-last pages.
            if (contentFits(pages[0], sheet, -SINGLE_PAGE_SAFETY_PX)) {
                setPlan({ stage: 'done', chunks: [currentItems], density: plan.density, pass: 0 });
                return;
            }
            if (plan.stage === 'fit-normal' && canTryDense) {
                setPlan({ stage: 'fit-dense', chunks: [currentItems], density: 'dense', pass: 0 });
                return;
            }
            // A single sheet is genuinely impossible — split by MEASURED geometry.
            const caps = capsFromSinglePage(pages[0], sheet);
            const counts = planChunkRowCounts(pages[0].rows.map((r) => r.height), caps);
            setPlan({ stage: 'split', chunks: chunkByCounts(currentItems, counts), density: plan.density, pass: 0 });
            return;
        }

        // stage === 'split'
        if (plan.pass === 0) {
            // The seed just rendered with real mini headers + totals — derive REAL
            // budgets from that DOM and re-pack tightly across ALL pages (single-row
            // heights never carry the whole list, so never derive counts from page 0
            // alone — that silently dropped trailing items).
            const caps = capsFromPages(pages, pages[0], sheet);
            const heights = pages.flatMap((p) => p.rows.map((r) => r.height));
            const counts = planChunkRowCounts(heights, caps);
            setPlan({ stage: 'split', chunks: chunkByCounts(currentItems, counts), density: plan.density, pass: 1 });
            return;
        }

        if (plan.pass >= MAX_PASSES) {
            // Terminal safety: budgets and row heights are real measurements, so
            // the re-pack cannot overflow the physical sheet.
            const caps = capsFromPages(pages, pages[0], sheet);
            const heights = pages.flatMap((p) => p.rows.map((r) => r.height));
            const counts = planChunkRowCounts(heights, caps);
            setPlan({ stage: 'done', chunks: chunkByCounts(currentItems, counts), density: plan.density, pass: plan.pass });
            return;
        }

        // Verify & adjust: every real sheet overflow moves trailing rows forward.
        const heightsByPage = pages.map((p) => p.rows.map((r) => r.height));
        const overflowByPage = pages.map((p) => Math.max(0, contentOverflow(p, sheet)));
        const { chunks: moved, changed } = moveOverflowRows(plan.chunks, heightsByPage, overflowByPage);
        if (!changed) {
            setPlan({
                stage: 'done',
                chunks: maybeMergeLoneTail(pages, plan.chunks, sheet),
                density: plan.density,
                pass: plan.pass + 1,
            });
            return;
        }
        setPlan({ stage: 'split', chunks: moved, density: plan.density, pass: plan.pass + 1 });
    }, [plan, planKey, isManual, containerId, canTryDense, sheet]);

    const effectiveRowHeight = useMemo(() => {
        const raw =
            typeof (source.config as Record<string, unknown>)?.tableRowHeight === 'number'
                ? ((source.config as Record<string, unknown>).tableRowHeight as number)
                : 35;
        return plan.density === 'dense' ? Math.min(raw, 30) : raw;
    }, [source, plan.density]);

    if (isManual && manualChunks) {
        return { itemChunks: manualChunks, density: 'normal', denseImage: false, effectiveRowHeight };
    }

    return {
        itemChunks: plan.chunks,
        density: plan.density,
        denseImage: plan.density === 'dense' && denseImage,
        effectiveRowHeight,
    };
}