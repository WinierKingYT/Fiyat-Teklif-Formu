import { useMemo, useRef, useLayoutEffect, useState, useCallback } from 'react';
import { PAGE_SIZES } from '@/utils/pdfGenerator';
import { OVERFLOW_TOLERANCE_PX, measurePdfPageGeometries, type PdfPageGeometry } from '@/utils/pdfLayoutMeasurement';import { chunkByCounts, moveOverflowRows, planChunkRowCounts, type PageCaps } from '@/utils/pdfPagination';
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
 * Final 'done' plans shared across containers with the same planKey.  The
 * canonical export surface mounts fresh at download time; if it had to re-derive
 * the split from scratch, the exporter snapshot races the (slow) split render and
 * a 2-page preview can capture as 1 page.  Seeding it with the plan the preview
 * already converged on makes the first paint WYSIWYG.  Keyed by planKey (theme +
 * item fingerprints + density options), bounded LRU-style; re-measuring is always
 * the fallback when the key is absent (e.g. download without opening a preview).
 */
const PLAN_CACHE_LIMIT = 20;
const donePlanCache = new Map<string, { chunks: unknown[][]; density: PaginationDensity }>();
/**
 * Headroom a single page must keep below the physical sheet to be accepted.
 * With the export parity fix (manual rasterize-per-page for all quotes),
 * preview and export geometry now agree.  This 2px margin only covers
 * sub-pixel rounding in html2canvas.
 */
const SINGLE_PAGE_SAFETY_PX = 2;

/** Physical sheet size in mm for the configured page size/orientation. */
export function sheetSizeMm(config: Record<string, unknown>): { widthMm: number; heightMm: number } {
    const key = typeof config.pageSize === 'string' ? (config.pageSize as keyof typeof PAGE_SIZES) : 'a4';
    const size = PAGE_SIZES[key] || PAGE_SIZES.a4;
    const landscape = config.pageOrientation === 'landscape';
    return {
        widthMm: landscape ? size.height : size.width,
        heightMm: landscape ? size.width : size.height,
    };
}

/** Physical sheet height in px for the configured page size/orientation. */
export function sheetHeightPx(config: Record<string, unknown>): number {
    const { heightMm } = sheetSizeMm(config);
    return (heightMm * 96) / 25.4;
}

function contentFits(g: PdfPageGeometry, sheet: number, tol: number): boolean {
    return g.scrollHeight <= sheet + tol;
}

function contentOverflow(g: PdfPageGeometry, sheet: number): number {
    return g.scrollHeight - sheet - OVERFLOW_TOLERANCE_PX;
}

/** Bootstrap budgets derived from the single (overflowing) dense page, used only
 *  until the split stage has real first/continuation/final pages to measure.
 *  `belowTable` is already measured (real bottom-section / note block), so no
 *  theme guesses are baked in here beyond the continuation-note fallbacks. */
function capsFromSinglePage(g: PdfPageGeometry, sheet: number): PageCaps {
    const above = Math.max(0, g.aboveTable ?? 0);
    const thead = g.theadHeight ?? 0;
    const below = g.belowTable ?? NOTE_EST;
    return {
        first: sheet - above - NOTE_EST,
        continuation: sheet - MINI_HEADER_EST - thead - NOTE_EST,
        last: sheet - above - below,
    };
}

/** Real budgets measured from the freshly rendered split DOM:
 *  - `first` from the real first page (big header + real continuation note),
 *  - `continuation` from a real middle page when one exists (mini header + real
 *    note); for a 2-page quote there is no middle page, so the mini header is
 *    measured from the last page while the note keeps the NOTE_EST fallback,
 *  - `last` from the real last page (mini header + real bottom-section).
 *  Every number is page-relative (same coordinate space as the sheet). */
function capsFromPages(pages: PdfPageGeometry[], sheet: number): PageCaps {
    const first = pages[0];
    const lastPage = pages[pages.length - 1];
    const hasMiddle = pages.length > 2;
    const cont = hasMiddle ? pages[1] : lastPage;
    const aboveFirst = Math.max(0, first.aboveTable ?? 0);
    const aboveCont = Math.max(0, cont.aboveTable ?? 0);
    const aboveLast = Math.max(0, lastPage.aboveTable ?? 0);
    return {
        first: sheet - aboveFirst - (first.belowTable ?? NOTE_EST),
        continuation: sheet - aboveCont - (hasMiddle ? (cont.belowTable ?? NOTE_EST) : NOTE_EST),
        last: sheet - aboveLast - (lastPage.belowTable ?? NOTE_EST),
    };
}

/** Prevents a 1-item orphan final page WITHOUT changing the page count or the
 *  header types involved: move one row BACK from the penultimate page into the
 *  lone final page so it ends with 2 rows (14+1 → 13+2). Both the losing page
 *  (keeps its continuation budget) and the gaining final page (its real
 *  bottom-section budget) are re-checked against MEASURED free space, so the
 *  move can never re-overflow a page. The penultimate page must be thick enough
 *  (≥ 4 rows) that losing one row does not create a new orphan. */
function maybeMergeLoneTail<T>(pages: PdfPageGeometry[], chunks: T[][], sheet: number): T[][] {
    if (chunks.length < 2) return chunks;
    const lastIdx = chunks.length - 1;
    if (chunks[lastIdx].length !== 1) return chunks;
    const prevIdx = lastIdx - 1;
    const prevCount = chunks[prevIdx].length;
    if (prevCount < 4) return chunks;
    const prev = pages[prevIdx];
    const tail = pages[lastIdx];
    if (!prev || !tail || prev.rows.length < prevCount || tail.rows.length < 1) return chunks;
    const moveH = prev.rows[prevCount - 1].height;
    const tailH = tail.rows[0].height;
    const prevUsedAfter = prev.rows.slice(0, prevCount - 1).reduce((s, r) => s + r.height, 0);
    const prevFits = sheet - Math.max(0, prev.aboveTable ?? 0) - (prev.belowTable ?? 0) - prevUsedAfter >= OVERFLOW_TOLERANCE_PX;
    const tailFits = sheet - Math.max(0, tail.aboveTable ?? 0) - (tail.belowTable ?? 0) - (tailH + moveH) >= 1;
    if (prevFits && tailFits) {
        const out = chunks.map((c) => c.slice());
        out[prevIdx] = chunks[prevIdx].slice(0, prevCount - 1);
        out[lastIdx] = [chunks[prevIdx][prevCount - 1]].concat(chunks[lastIdx]);
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

    const [plan, setPlan] = useState<PlanState<T>>(() => {
        if (isManual) {
            return { stage: 'done', chunks: initialChunks, density: 'normal', pass: 0 };
        }
        const cached = donePlanCache.get(planKey);
        if (cached) {
            return { stage: 'done', chunks: cached.chunks as T[][], density: cached.density, pass: 0 };
        }
        return { stage: 'fit-normal', chunks: initialChunks, density: 'normal', pass: 0 };
    });
    const planKeyRef = useRef<string>(planKey);
    const itemsRef = useRef<T[]>(items);

    const persistDone = useCallback((next: PlanState<T>) => {
        if (next.stage === 'done' && planKeyRef.current) {
            donePlanCache.set(planKeyRef.current, { chunks: next.chunks, density: next.density });
            if (donePlanCache.size > PLAN_CACHE_LIMIT) {
                const oldest = donePlanCache.keys().next().value;
                if (oldest !== undefined) donePlanCache.delete(oldest);
            }
        }
        setPlan(next);
    }, []);

    useLayoutEffect(() => {
        itemsRef.current = items;
        if (isManual) return;
        if (!containerId) return;

        if (planKeyRef.current !== planKey) {
            planKeyRef.current = planKey;
            setPlan({ stage: 'fit-normal', chunks: itemsRef.current.length > 0 ? [itemsRef.current] : [[]], density: 'normal', pass: 0 });
            return;
        }

        if (plan.stage === 'done') return;

        const el = document.getElementById(containerId);
        if (!el) return;

        const pages = measurePdfPageGeometries(el);
        if (pages.length === 0) return;
        const currentItems = itemsRef.current;
        // Budget is the physical SHEET height, never derived from the page's live
        // width: the preview panel can render the page at 517px or 746px depending
        // on the split layout, and a width-derived budget would make the preview
        // pack a different number of rows than the export surface does.
        const budget = sheet;

        if (plan.stage === 'fit-normal' || plan.stage === 'fit-dense') {
            // Strict single-page acceptance: the export sheet is EXACTLY the
            // page size (297mm) AND falls slightly short of the raw preview box
            // (font/html2canvas rounding), so "fits one page" must hold with real
            // headroom (SINGLE_PAGE_SAFETY_PX), never on the 24px preview-marker
            // tolerance that only exists for non-last pages.
            if (contentFits(pages[0], budget, -SINGLE_PAGE_SAFETY_PX)) {
                persistDone({ stage: 'done', chunks: [currentItems], density: plan.density, pass: 0 });
                return;
            }
            if (plan.stage === 'fit-normal' && canTryDense) {
                setPlan({ stage: 'fit-dense', chunks: [currentItems], density: 'dense', pass: 0 });
                return;
            }
            // A single sheet is genuinely impossible — split by MEASURED geometry.
            const caps = capsFromSinglePage(pages[0], budget);
            const counts = planChunkRowCounts(pages[0].rows.map((r) => r.height), caps, 2);
            setPlan({ stage: 'split', chunks: chunkByCounts(currentItems, counts), density: plan.density, pass: 0 });
            return;
        }

        // stage === 'split'
        if (plan.pass === 0) {
            // The seed just rendered with real mini headers + totals — derive REAL
            // budgets from that DOM and re-pack tightly across ALL pages (single-row
            // heights never carry the whole list, so never derive counts from page 0
            // alone — that silently dropped trailing items).
            const caps = capsFromPages(pages, budget);
            const heights = pages.flatMap((p) => p.rows.map((r) => r.height));
            const counts = planChunkRowCounts(heights, caps, 2);
            setPlan({ stage: 'split', chunks: chunkByCounts(currentItems, counts), density: plan.density, pass: 1 });
            return;
        }

        if (plan.pass >= MAX_PASSES) {
            // Terminal safety: budgets and row heights are real measurements, so
            // the re-pack cannot overflow the physical sheet.
            const caps = capsFromPages(pages, budget);
            const heights = pages.flatMap((p) => p.rows.map((r) => r.height));
            const counts = planChunkRowCounts(heights, caps, 2);
            persistDone({ stage: 'done', chunks: chunkByCounts(currentItems, counts), density: plan.density, pass: plan.pass });
            return;
        }

        // Verify & adjust: every real sheet overflow moves trailing rows forward.
        const heightsByPage = pages.map((p) => p.rows.map((r) => r.height));
        const overflowByPage = pages.map((p) => Math.max(0, contentOverflow(p, budget)));
        const { chunks: moved, changed } = moveOverflowRows(plan.chunks, heightsByPage, overflowByPage);
        if (!changed) {
            persistDone({
                stage: 'done',
                chunks: maybeMergeLoneTail(pages, plan.chunks, budget),
                density: plan.density,
                pass: plan.pass + 1,
            });
            return;
        }
        setPlan({ stage: 'split', chunks: moved, density: plan.density, pass: plan.pass + 1 });
    }, [plan, planKey, isManual, containerId, canTryDense, sheet, persistDone]);

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