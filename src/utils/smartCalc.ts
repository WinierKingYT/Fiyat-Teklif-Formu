/**
 * Evaluates a mathematical expression safely.
 * Supports basic arithmetic: +, -, *, /, (, )
 * Handles decimal points (.) and commas (,)
 * 
 * @param {string|number} value - The input value to evaluate
 * @returns {number|string} - The calculated number or the original value if invalid
 */
export const evaluateMathExpression = (value: unknown): unknown => {
    if (value === null || value === undefined || value === '') return value;

    // If it's already a number, return it
    if (typeof value === 'number') return value;

    const strValue = String(value).trim();

    // Check if it looks like a math expression
    // Allowed chars: 0-9, ., ,, +, -, *, /, (, ), space
    const validCharsRegex = /^[0-9.,+\-*/()\s]+$/;

    if (!validCharsRegex.test(strValue)) {
        return value;
    }

    try {
        // Normalize each number token within the arithmetic expression
        const normalizedExpression = strValue.replace(/[\d.,]+/g, (token) => {
            const hasDot = token.includes('.');
            const hasComma = token.includes(',');

            if (hasDot && hasComma) {
                const lastDot = token.lastIndexOf('.');
                const lastComma = token.lastIndexOf(',');
                if (lastComma > lastDot) {
                    // Turkish/European format: 1.000.000,50 -> 1000000.50
                    return token.replace(/\./g, '').replace(',', '.');
                } else {
                    // English format: 1,000,000.50 -> 1000000.50
                    return token.replace(/,/g, '');
                }
            } else if (hasDot) {
                const dotCount = (token.match(/\./g) || []).length;
                if (dotCount > 1) {
                    // Multiple dots: 1.000.000 -> 1000000
                    return token.replace(/\./g, '');
                }
                // Single dot: Faz5 heuristic – 1.500 vs 3.5 ayrımı iyileştirildi
                const parts = token.split('.');
                if (parts[1] && parts[1].length === 3) {
                    // Heuristic: 1-3 haneli + .### -> muhtemelen bin ayracı; 0.xxx -> ondalık korunur
                    // Ayrıca 4+ haneli integer + .### -> muhtemelen ondalık değil, bin ayracı
                    // Fakat 0.500 gibi durumlarda Number('0')=0 ise ondalık korunmalı
                    const intPart = parts[0].replace(/^[-+]/, '');
                    if (intPart !== '0' && Number(intPart) > 0 && intPart.length <= 3) {
                        return token.replace('.', '');
                    }
                    if (intPart.length > 3) {
                        return token.replace('.', '');
                    }
                }
                return token;
            } else if (hasComma) {
                const commaCount = (token.match(/,/g) || []).length;
                if (commaCount > 1) {
                    // Multiple commas: 1,000,000 -> 1000000
                    return token.replace(/,/g, '');
                }
                // Single comma as decimal separator: 3,5 -> 3.5
                return token.replace(',', '.');
            }
            return token;
        });

        const result = safeEval(normalizedExpression);
        if (typeof result === 'number' && isFinite(result)) {
            return Math.round(result * 10000) / 10000;
        }
        return value;
    } catch {
        return value;
    }
};

function safeEval(expr: string): number {
    const s = expr.replace(/\s+/g, '');
    if (!s || /[^0-9+\-*/().]/.test(s)) throw new Error('invalid');
    if (s.length > 64) throw new Error('too long');
    const vals: number[] = [];
    const ops: string[] = [];
    const prec = (o: string) => (o === '+' || o === '-' ? 1 : 2);
    const apply = () => {
        const op = ops.pop()!;
        const b = vals.pop()!;
        const a = vals.pop()!;
        if (a === undefined || b === undefined) throw new Error('syntax');
        let r = 0;
        if (op === '+') r = a + b;
        else if (op === '-') r = a - b;
        else if (op === '*') r = a * b;
        else if (op === '/') { if (b === 0) throw new Error('div0'); r = a / b; }
        vals.push(r);
    };
    let i = 0;
    let expectNum = true;
    while (i < s.length) {
        const ch = s[i];
        if (ch === '(') { ops.push(ch); i++; expectNum = true; }
        else if (ch === ')') { while (ops.length && ops[ops.length - 1] !== '(') apply(); if (ops.pop() !== '(') throw new Error('paren'); i++; expectNum = false; }
        else if (/[+\-*/]/.test(ch)) {
            if (expectNum && (ch === '+' || ch === '-')) {
                let j = i + 1; while (j < s.length && /[0-9.]/.test(s[j])) j++;
                const numStr = s.slice(i, j);
                const n = Number(numStr);
                if (!isFinite(n)) throw new Error('num'); vals.push(n); i = j; expectNum = false;
            } else {
                while (ops.length && ops[ops.length - 1] !== '(' && prec(ops[ops.length - 1]) >= prec(ch)) apply();
                ops.push(ch); i++; expectNum = true;
            }
        } else if (/[0-9.]/.test(ch)) {
            let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
            const n = Number(s.slice(i, j));
            if (!isFinite(n)) throw new Error('num'); vals.push(n); i = j; expectNum = false;
        } else throw new Error('char');
    }
    while (ops.length) { if (ops[ops.length - 1] === '(') throw new Error('paren'); apply(); }
    if (vals.length !== 1) throw new Error('val');
    return vals[0];
}
