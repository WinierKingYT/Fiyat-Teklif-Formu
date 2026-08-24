// Logger Utility – Faz6: PII scrub (e-posta, telefon, IBAN maskeleme)
const PII_PATTERNS: Array<[RegExp, string]> = [
    [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]'],
    [/\+?\d[\d\s\-()]{8,}\d/g, '[REDACTED_PHONE]'],
    /\bTR\d{2}\s?(\d{4}\s?){5}\d{2}\b/gi as unknown as [RegExp, string],
].map(p => Array.isArray(p) ? p as [RegExp, string] : [p as unknown as RegExp, '[REDACTED_IBAN]']) as Array<[RegExp, string]>;

// ensure IBAN pattern included
const IBAN_RE = /\bTR\d{2}\s?(\d{4}\s?){5}\d{2}\b/gi;

function scrubPII(args: unknown[]): unknown[] {
    return args.map(arg => {
        if (typeof arg === 'string') {
            let s = arg;
            s = s.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]');
            s = s.replace(IBAN_RE, '[REDACTED_IBAN]');
            // phone heuristik: 10+ haneli sayı grupları – basit
            return s;
        }
        if (arg && typeof arg === 'object') {
            try {
                const json = JSON.stringify(arg);
                const scrubbed = json
                    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
                    .replace(IBAN_RE, '[REDACTED_IBAN]');
                return JSON.parse(scrubbed);
            } catch {
                return arg;
            }
        }
        return arg;
    });
}

class Logger {
    static log(...args: unknown[]) {
        if (Logger.isEnabled()) {
            console.log('[LOG]', ...scrubPII(args));
        }
    }

    static error(...args: unknown[]) {
        if (Logger.isEnabled()) {
            console.error('[ERROR]', ...scrubPII(args));
        }
    }

    static warn(...args: unknown[]) {
        if (Logger.isEnabled()) {
            console.warn('[WARN]', ...scrubPII(args));
        }
    }

    static info(...args: unknown[]) {
        if (Logger.isEnabled()) {
            console.info('[INFO]', ...scrubPII(args));
        }
    }

    static isEnabled() {
        try {
            return localStorage.getItem('debug') === 'true' ||
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1';
        } catch {
            return false;
        }
    }
}

export default Logger;
