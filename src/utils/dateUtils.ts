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

export const formatLocalDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
        // Faz5: timezone fix – YYYY-MM-DD as locale date, avoid UTC shift (T00:00)
        const clean = dateString.split('T')[0].split(' ')[0];
        // ensure local midnight interpretation
        const isoLocal = clean.includes('-') ? `${clean}T00:00:00` : clean;
        // Validate via Date with T00:00 to catch invalid dates, but format manually
        if (isoLocal) {
            const test = new Date(isoLocal);
            if (isNaN(test.getTime())) {
                const [y, m, d] = clean.split('-').map(Number);
                if (isNaN(y) || isNaN(m) || isNaN(d)) return dateString;
                return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
            }
        }
        const [y, m, d] = clean.split('-').map(Number);
        if (isNaN(y) || isNaN(m) || isNaN(d)) return dateString;
        return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
    } catch {
        return dateString;
    }
};

export const parseLocalDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const clean = dateString.split('T')[0].split(' ')[0];
    const d = new Date(`${clean}T00:00:00`);
    return isNaN(d.getTime()) ? null : d;
};
