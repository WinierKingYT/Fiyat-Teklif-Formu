/**
 * Measurement-authority page packing.
 *
 * The legacy greedy fallback (340/420/250px budgets + 50px image row floor +
 * character/config guards) is NO LONGER the pagination decision maker. Instead
 * the DOM is rendered and measured first; the measured per-row heights and the
 * measured per-page-type budgets below are the ONLY numbers that decide where
 * pages break. See useMeasuredPagination for the render → measure → adjust loop.
 */

export interface PageCaps {
    /** Row budget (px) of the first page (big header, no totals). */
    first: number;
    /** Row budget (px) of continuation pages (mini header, no totals). */
    continuation: number;
    /** Row budget (px) of the final page (mini header + totals/signatures). */
    last: number;
}

/**
 * Packs MEASURED row heights into pages bounded by MEASURED budgets.
 * Returns the item count per page.
 *
 * - The first page is filled greedily against `first`.
 * - The remainder is absorbed into a single final page whenever it fits `last`
 *   (final rows carry the totals overhead, so their budget is the smallest).
 * - Otherwise a continuation page is packed against `continuation`.
 * - A lone final row is absorbed into the preceding page when the merge still
 *   fits that page's measured budget (orphan prevention, measured not guessed).
 */
export function planChunkRowCounts(rowHeights: number[], caps: PageCaps): number[] {
    const n = rowHeights.length;
    if (n <= 0) return [0];
    const sumFrom = (from: number): number => {
        let s = 0;
        for (let k = from; k < n; k++) s += rowHeights[k];
        return s;
    };

    const counts: number[] = [];

    // First page.
    let i = 0;
    let used = 0;
    while (i < n && used + rowHeights[i] <= caps.first) {
        used += rowHeights[i];
        i++;
    }
    if (i === 0) i = 1; // even a single tall row gets a page
    counts.push(i);
    if (i >= n) return counts;

    // Middle + final pages.
    let start = i;
    while (start < n) {
        if (sumFrom(start) <= caps.last) {
            counts.push(n - start);
            start = n;
            break;
        }
        let usedC = 0;
        let k = start;
        while (k < n && usedC + rowHeights[k] <= caps.continuation) {
            usedC += rowHeights[k];
            k++;
        }
        if (k === start) k = start + 1;
        counts.push(k - start);
        start = k;
    }

    // Orphan prevention: absorb a lone final row into the preceding page when
    // the merge still fits that page's budget.
    if (counts.length >= 2 && counts[counts.length - 1] === 1 && n > 2) {
        const lastPageCount = counts.length;
        const prevCount = counts[lastPageCount - 2];
        const prevStart = n - 1 - prevCount;
        const prevUsed = sumFrom(prevStart) - rowHeights[n - 1];
        const prevCap = prevStart === 0 ? caps.first : caps.continuation;
        if (prevUsed + rowHeights[n - 1] <= prevCap) {
            counts[lastPageCount - 2] += 1;
            counts[lastPageCount - 1] = 0;
        }
    }

    const result = counts.filter((c) => c > 0);
    return result.length > 0 ? result : [n];
}

/**
 * Splits `items` into page chunks whose sizes are `planChunkRowCounts`-sized.
 */
export function chunkByCounts<T>(items: T[], counts: number[]): T[][] {
    const chunks: T[][] = [];
    let offset = 0;
    for (const c of counts) {
        chunks.push(items.slice(offset, offset + c));
        offset += c;
    }
    if (chunks.length === 0) chunks.push(items.slice());
    return chunks;
}

/**
 * Moves trailing rows off pages that measured overflow (real scrollHeight past
 * the A4 box). Only moves rows FORWARD (never backward), so the process is
 * monotone and terminates: a re-measure after each move confirms stability.
 * Returns the new chunks plus whether anything changed.
 */
export function moveOverflowRows<T>(chunks: T[][], rowHeightsByPage: number[][], overflowPxByPage: number[]): { chunks: T[][]; changed: boolean } {
    const out = chunks.map((c) => c.slice());
    let changed = false;
    for (let i = 0; i < out.length; i++) {
        const heights = rowHeightsByPage[i] || [];
        const needed = overflowPxByPage[i] || 0;
        if (heights.length === 0 || needed <= 0) continue;
        let removed = 0;
        let cut = heights.length;
        while (cut > 0 && removed < needed) {
            cut--;
            removed += heights[cut];
        }
        if (cut === 0) cut = 1; // never empty a page entirely
        if (cut >= out[i].length) continue;
        const rest = out[i].splice(cut);
        if (rest.length === 0) continue;
        if (i + 1 < out.length) {
            out[i + 1] = rest.concat(out[i + 1]);
        } else {
            out.push(rest);
        }
        changed = true;
    }
    return { chunks: out, changed };
}