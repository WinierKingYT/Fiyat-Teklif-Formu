
// Debouncer Utility
class Debouncer {
    constructor(delay) {
        this.delay = delay;
        this.timeoutId = null;
    }

    debounce(func) {
        return (...args) => {
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => func.apply(null, args), this.delay);
        };
    }

    cancel() {
        clearTimeout(this.timeoutId);
    }
}

export default Debouncer;
