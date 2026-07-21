/**
 * Evaluates a mathematical expression safely.
 * Supports basic arithmetic: +, -, *, /, (, )
 * Handles decimal points (.) and commas (,)
 * 
 * @param {string|number} value - The input value to evaluate
 * @returns {number|string} - The calculated number or the original value if invalid
 */
export const evaluateMathExpression = (value) => {
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
        // Replace comma with dot for JS evaluation
        const normalizedExpression = strValue.replace(/,/g, '.');

        // Use Function constructor for evaluation (safer than eval, but still needs care)
        // We already validated allowed characters, so it should be relatively safe from injection
        // eslint-disable-next-line no-new-func
        const result = new Function(`return ${normalizedExpression}`)();

        // Check if result is a valid finite number
        if (typeof result === 'number' && isFinite(result)) {
            // Round to 4 decimal places to avoid floating point errors
            return Math.round(result * 10000) / 10000;
        }

        return value;
    } catch (error) {
        // If evaluation fails (e.g. syntax error), return original value
        return value;
    }
};
