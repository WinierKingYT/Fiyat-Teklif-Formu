export const getAdjustedFontSize = (size: any, factor: number = 0.9, defaultSize: string = '0.85em') => {
    if (!size || size === 'inherit') return defaultSize;
    if (typeof size === 'number') return `${size * factor}px`;
    if (typeof size === 'string') {
        if (size.endsWith('px')) return `${parseFloat(size) * factor}px`;
        if (size.endsWith('rem') || size.endsWith('em')) return `calc(${size} * ${factor})`;
    }
    return defaultSize;
};