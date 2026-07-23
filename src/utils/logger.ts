// Logger Utility
class Logger {
    static log(...args: any[]) {
        if (Logger.isEnabled()) {
            console.log('[LOG]', ...args);
        }
    }

    static error(...args: any[]) {
        if (Logger.isEnabled()) {
            console.error('[ERROR]', ...args);
        }
    }

    static warn(...args: any[]) {
        if (Logger.isEnabled()) {
            console.warn('[WARN]', ...args);
        }
    }

    static info(...args: any[]) {
        if (Logger.isEnabled()) {
            console.info('[INFO]', ...args);
        }
    }

    static isEnabled() {
        return localStorage.getItem('debug') === 'true' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';
    }
}

export default Logger;
