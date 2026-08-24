import type { QuoteNumberConfig, QuoteNumberSeries } from '@/context/quote/types';

export interface NumberPreset {
    id: string;
    label: string;
    template: string;
    description: string;
}

export const NUMBER_PRESETS: NumberPreset[] = [
    {
        id: 'standard',
        label: 'Standart (TK-202608-0001)',
        template: '{PREFIX}-{YYYY}{MM}-{INDEX:4}',
        description: 'Önek + Yıl ve Ay + 4 basamaklı sayaç'
    },
    {
        id: 'yearly',
        label: 'Yıllık Taksimli (TK/2026/001)',
        template: '{PREFIX}/{YYYY}/{INDEX:3}',
        description: 'Önek / Yıl / 3 basamaklı sayaç'
    },
    {
        id: 'simple',
        label: 'Sade Yıl-Sayaç (2026-0001)',
        template: '{YYYY}-{INDEX:4}',
        description: 'Sadece Yıl ve 4 basamaklı sayaç'
    },
    {
        id: 'short',
        label: 'Kısa Seri (TK-0001)',
        template: '{PREFIX}-{INDEX:4}',
        description: 'Önek ve doğrudan sayaç'
    },
    {
        id: 'daily',
        label: 'Günlük Detaylı (TK-20260821-01)',
        template: '{PREFIX}-{YYYY}{MM}{DD}-{INDEX:2}',
        description: 'Önek + Tam Tarih + 2 basamaklı sayaç'
    },
    {
        id: 'random',
        label: 'Rastgele Kodlu (TK-2026-8A3F)',
        template: '{PREFIX}-{YYYY}-{RANDOM:4}',
        description: 'Önek + Yıl + 4 haneli rastgele kod'
    }
];

function generateRandomCode(length = 4): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Formats a template string with given variables
 */
export function formatNumberTemplate(
    template: string,
    prefix: string,
    counter: number,
    date: Date = new Date()
): string {
    const yyyy = date.getFullYear().toString();
    const yy = yyyy.slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    let result = template;

    // Replace basic variables – Faz5: ?? nullish coalescing ('' korunur)
    result = result.replace(/\{PREFIX\}/gi, prefix ?? 'TK');
    result = result.replace(/\{YYYY\}/gi, yyyy);
    result = result.replace(/\{YY\}/gi, yy);
    result = result.replace(/\{MM\}/gi, mm);
    result = result.replace(/\{DD\}/gi, dd);

    // Replace {INDEX:N} or {INDEX}
    result = result.replace(/\{INDEX(?::(\d+))?\}/gi, (_, width) => {
        const padWidth = width ? parseInt(width, 10) : 4;
        return String(counter).padStart(padWidth, '0');
    });

    // Replace {RANDOM:N} or {RANDOM}
    result = result.replace(/\{RANDOM(?::(\d+))?\}/gi, (_, len) => {
        const randomLength = len ? parseInt(len, 10) : 4;
        return generateRandomCode(randomLength);
    });

    return result;
}

/**
 * Checks if counter needs to be reset based on resetPeriod and lastResetDate
 */
export function checkAndResetCounter(
    config: QuoteNumberConfig,
    date: Date = new Date()
): QuoteNumberConfig {
    const currentYear = date.getFullYear().toString();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const currentYearMonth = `${currentYear}-${mm}`;
    const currentYearMonthDay = `${currentYear}-${mm}-${dd}`;

    let shouldReset = false;
    let newLastResetDate = config.lastResetDate;

    if (config.resetPeriod === 'yearly') {
        if (!config.lastResetDate || !config.lastResetDate.startsWith(currentYear)) {
            shouldReset = true;
            newLastResetDate = currentYear;
        }
    } else if (config.resetPeriod === 'monthly') {
        if (config.lastResetDate !== currentYearMonth) {
            shouldReset = true;
            newLastResetDate = currentYearMonth;
        }
    } else if (config.resetPeriod === 'daily') {
        if (config.lastResetDate !== currentYearMonthDay) {
            shouldReset = true;
            newLastResetDate = currentYearMonthDay;
        }
    }

    if (shouldReset) {
        const updatedSeries = config.series
            ? config.series.map((s) => ({ ...s, counter: 1 }))
            : config.series;

        return {
            ...config,
            counter: 1,
            series: updatedSeries,
            lastResetDate: newLastResetDate
        };
    }

    return config;
}

/**
 * Generates a preview string for current configuration without incrementing counter
 */
export function previewQuoteNumber(
    config: QuoteNumberConfig,
    date: Date = new Date()
): string {
    const activeSeries = getActiveSeries(config);
    const template = activeSeries ? activeSeries.template : config.template;
    const prefix = activeSeries ? (activeSeries.prefix ?? config.prefix) : (config.prefix ?? 'TK');
    const counter = activeSeries ? activeSeries.counter : config.counter;

    return formatNumberTemplate(template, prefix ?? 'TK', counter, date);
}

/**
 * Generates next quote number and returns updated configuration with incremented counter
 */
export function generateNextQuoteNumber(
    config: QuoteNumberConfig,
    date: Date = new Date()
): { formattedNumber: string; updatedConfig: QuoteNumberConfig } {
    // Check periodic reset
    const checkedConfig = checkAndResetCounter(config, date);
    const activeSeries = getActiveSeries(checkedConfig);

    if (activeSeries && checkedConfig.series) {
        const formattedNumber = formatNumberTemplate(
            activeSeries.template,
            activeSeries.prefix,
            activeSeries.counter,
            date
        );

        const updatedSeries = checkedConfig.series.map((s) =>
            s.id === activeSeries.id ? { ...s, counter: s.counter + 1 } : s
        );

        const updatedConfig: QuoteNumberConfig = {
            ...checkedConfig,
            series: updatedSeries,
            counter: checkedConfig.counter + 1
        };

        return { formattedNumber, updatedConfig };
    }

    const formattedNumber = formatNumberTemplate(
        checkedConfig.template,
        checkedConfig.prefix,
        checkedConfig.counter,
        date
    );

    const updatedConfig: QuoteNumberConfig = {
        ...checkedConfig,
        counter: checkedConfig.counter + 1
    };

    return { formattedNumber, updatedConfig };
}

/**
 * Returns the currently active series from config
 */
export function getActiveSeries(config: QuoteNumberConfig): QuoteNumberSeries | undefined {
    if (!config.series || config.series.length === 0) return undefined;
    return config.series.find((s) => s.id === config.activeSeriesId) || config.series[0];
}
