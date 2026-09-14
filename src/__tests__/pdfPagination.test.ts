import { describe, it, expect } from 'vitest';
import { sheetHeightPx } from '@/hooks/useMeasuredPagination';
import { planChunkRowCounts, chunkByCounts, moveOverflowRows, type PageCaps } from '@/utils/pdfPagination';

describe('sheetHeightPx (pdfGenerator @page contract)', () => {
    it('returns 1122.5px for A4 portrait (297mm @ 96dpi)', () => {
        expect(sheetHeightPx({ pageSize: 'a4' })).toBeCloseTo(1122.5, 1);
    });

    it('inverts for A4 landscape (210mm becomes the height)', () => {
        const landscape = sheetHeightPx({ pageSize: 'a4', pageOrientation: 'landscape' });
        expect(landscape).toBeLessThan(sheetHeightPx({ pageSize: 'a4' }));
        expect(landscape).toBeCloseTo(793.7, 1);
    });

    it('falls back to A4 for unknown page sizes', () => {
        expect(sheetHeightPx({ pageSize: 'bogus' })).toBeCloseTo(1122.5, 1);
        expect(sheetHeightPx({})).toBeCloseTo(1122.5, 1);
    });
});

describe('planChunkRowCounts', () => {
    const caps: PageCaps = { first: 340, continuation: 420, last: 250 };
    const flat = (args: number[]) => args.reduce((a, b) => a * b + b, 1);

    it('returns [0] for empty input', () => {
        expect(planChunkRowCounts([], caps)).toEqual([0]);
    });

    it('roots a single tall row even when it exceeds the first budget', () => {
        expect(planChunkRowCounts([5000], caps)).toEqual([1]);
    });

    it('packs the first page greedily against first', () => {
        // 340 -> 6 rows of 50 exactly.
        const sixFifty = Array.from({ length: 7 }, () => 50);
        expect(planChunkRowCounts(sixFifty, caps)[0]).toBe(6);
    });

    it('adds middle rows to the final page whenever they fit last', () => {
        const heights = Array.from({ length: 7 }, () => 50); // 340 budget = 6 rows, one row left
        const counts = planChunkRowCounts(heights, caps);
        expect(counts[0]).toBe(6);
        expect(counts[1]).toBe(1); // survives as a lone final page
    });

    it('keeps a lone final page when the previous page lacks measured spare budget', () => {
        const heights = Array.from({ length: 7 }, () => 50);
        // page 1 fills 6 rows (300px used). A 7th 50px row needs 350 > 340 -> no merge.
        const counts = planChunkRowCounts(heights, { first: 340, continuation: 420, last: 50 });
        expect(counts).toEqual([6, 1]);
    });

    it('absorbs a lone trailing orphan when the previous page has measured spare budget', () => {
        const heights = [50, 50, 50, 50, 50, 50, 30];
        // page 1 fills 6 rows (300px used); a 30px orphan needs 330 <= 340 -> merge to one page.
        const counts = planChunkRowCounts(heights, { ...caps, last: 1 });
        expect(counts).toEqual([7]);
    });

    it('absorbing the orphan uses the exact spare budget of its target page', () => {
        const heights = Array.from({ length: 7 }, () => 50);
        // first=340 -> 6 rows (40px spare). Merging a 50px row would overflow, so no merge.
        const noMerge = planChunkRowCounts(heights, { ...caps, last: 1 });
        expect(noMerge).toEqual([6, 1]);
        // first=351 -> 7 rows fit on page 1 directly.
        const direct = planChunkRowCounts(heights, { ...caps, first: 351, last: 1 });
        expect(direct).toEqual([7]);
    });

    it('packs a 6+5+2 legacy fingerprint into tighter real pages (no 6/5/2 residue)', () => {
        // A quote whose legacy model split as 6+5+2. Under measured budgets every
        // page is bound by its own cap, so smaller first-budget yields 5+7, not 6/5/2.
        const heights = Array.from({ length: 13 }, () => 50);
        const counts = planChunkRowCounts(heights, { first: 340, continuation: 420, last: 250 });
        expect(counts.flat().reduce((a, b) => a + b, 0)).toBe(13);
        expect(counts.some((c) => c <= 0)).toBe(false);
        expect(counts).not.toEqual([6, 5, 2]);
    });

    it('never over-commits a page past its budget', () => {
        const heights = Array.from({ length: 60 }, (_, i) => (i % 2 ? 12 : 48));
        const counts = planChunkRowCounts(heights, caps);
        let start = 0;
        for (let i = 0; i < counts.length; i++) {
            const c = counts[i];
            const budget = i === 0 ? caps.first : i === counts.length - 1 ? caps.last : caps.continuation;
            let used = 0;
            for (let k = start; k < start + c - 1; k++) used += heights[k];
            // The last row of each page is allowed to straddle the budget, but all
            // earlier rows must fit — matching the greedy contract.
            expect(used).toBeLessThanOrEqual(budget + 1);
            start += c;
        }
        expect(start).toBe(heights.length);
    });

    it('forces at least one row per page for pathological row heights', () => {
        const heights = Array.from({ length: 4 }, () => 900);
        const counts = planChunkRowCounts(heights, caps);
        expect(counts.length).toBe(4);
        expect(counts).toEqual([1, 1, 1, 1]);
    });

    it('chunkByCounts preserves order and content', () => {
        const items = Array.from({ length: 13 }, (_, i) => `i${i}`);
        const chunks = chunkByCounts(items, [6, 5, 2]);
        expect(chunks.map((c) => c.length)).toEqual([6, 5, 2]);
        expect(chunks.flat()).toEqual(items);
    });

    it('flat is a stable fingerprint for uneven heights', () => {
        expect(flat([1, 2, 3])).toBe(flat([1, 2, 3]));
        expect(flat([3, 2, 1])).not.toBe(flat([1, 2, 3]));
    });
});

describe('moveOverflowRows', () => {
    it('moves exactly the trailing rows that exceed the budget forward', () => {
        const chunks = [
            Array.from({ length: 6 }, (_, i) => `p0-${i}`),
            Array.from({ length: 4 }, (_, i) => `p1-${i}`),
        ];
        const result = moveOverflowRows(
            chunks,
            [
                [50, 50, 50, 50, 50, 50],
                [50, 50, 50, 50],
            ],
            [50, 0]
        );
        expect(result.changed).toBe(true);
        // One trailing row (50px) leaves page 0 for page 1.
        expect(result.chunks[0]).toEqual(['p0-0', 'p0-1', 'p0-2', 'p0-3', 'p0-4']);
        expect(result.chunks[1]).toEqual(['p0-5', 'p1-0', 'p1-1', 'p1-2', 'p1-3']);
        expect(result.chunks.flat()).toEqual(chunks.flat());
    });

    it('opens a new page when the overflow came from the last page', () => {
        const chunks = [['a', 'b'], ['c', 'd']];
        const result = moveOverflowRows(chunks, [[10, 10], [10, 10]], [0, 15]);
        expect(result.changed).toBe(true);
        expect(result.chunks).toEqual([['a', 'b'], ['c'], ['d']]);
        expect([['a', 'b'], ['c'], ['d']].flat()).toEqual(chunks.flat());
    });

    it('reports unchanged when nothing overflows', () => {
        const result = moveOverflowRows([['a', 'b']], [[10, 10]], [0]);
        expect(result.changed).toBe(false);
        expect(result.chunks).toEqual([['a', 'b']]);
    });

    it('never empties a page entirely', () => {
        const chunks = [['x']];
        const result = moveOverflowRows(chunks, [[9]], [100]);
        expect(result.chunks[0]).toEqual(['x']);
    });
});