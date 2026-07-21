export const getLocalDateString = (date = new Date()) => {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000)
        .toISOString()
        .split('T')[0];
};

export const getLocalDateTimeString = (date = new Date()) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
        .toISOString()
        .replace('Z', '');
};

export const formatLocalDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const [y, m, d] = dateString.split('-').map(Number);
        return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
    } catch {
        return dateString;
    }
};
