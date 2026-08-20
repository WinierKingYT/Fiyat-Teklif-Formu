import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getExchangeRates, convertCurrency, CURRENCIES } from '@/utils/exchangeRates';

vi.mock('@/utils/logger', () => ({
    default: { error: vi.fn(), log: vi.fn(), warn: vi.fn() },
}));

const CACHE_KEY = 'exchange_rates_cache';
const RATES = { TRY: 1, USD: 33.5, EUR: 36.2 };

describe('exchangeRates', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('fetches rates from the API and caches them', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ rates: RATES }),
        }));

        const result = await getExchangeRates();

        expect(result).toEqual(RATES);
        expect(fetch).toHaveBeenCalledWith('https://api.exchangerate-api.com/v4/latest/TRY');
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        expect(cached.data).toEqual(RATES);
    });

    it('returns cached rates when the cache is fresh', async () => {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: RATES, timestamp: Date.now() }));
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        const result = await getExchangeRates();

        expect(result).toEqual(RATES);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refetches when the cache is stale', async () => {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: { TRY: 1 },
            timestamp: Date.now() - 2 * 60 * 60 * 1000,
        }));
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ rates: RATES }),
        }));

        const result = await getExchangeRates();

        expect(result).toEqual(RATES);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('falls back to the stale cache when the fetch fails', async () => {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: RATES,
            timestamp: Date.now() - 2 * 60 * 60 * 1000,
        }));
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

        const result = await getExchangeRates();

        expect(result).toEqual(RATES);
    });

    it('returns null when the fetch fails and there is no cache', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

        const result = await getExchangeRates();

        expect(result).toBeNull();
    });

    it('converts an amount between two currencies via TRY', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ rates: RATES }),
        }));

        const result = await convertCurrency(100, 'USD', 'EUR');

        expect(result).toBeCloseTo((100 / 33.5) * 36.2, 5);
    });

    it('returns the same amount when converting to the same currency', async () => {
        const result = await convertCurrency(100, 'TRY', 'TRY');
        expect(result).toBe(100);
    });

    it('returns null when rates are unavailable', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

        const result = await convertCurrency(100, 'USD', 'EUR');

        expect(result).toBeNull();
    });

    it('returns null for unknown currency codes', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ rates: { TRY: 1 } }),
        }));

        const result = await convertCurrency(100, 'XXX', 'YYY');

        expect(result).toBeNull();
    });

    it('exposes a supported currency list', () => {
        expect(CURRENCIES).toContainEqual(expect.objectContaining({ code: 'TRY' }));
        expect(CURRENCIES).toContainEqual(expect.objectContaining({ code: 'USD' }));
        expect(CURRENCIES.length).toBeGreaterThanOrEqual(6);
    });
});