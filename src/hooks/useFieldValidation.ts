import { useState, useCallback } from 'react';

interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    message: string;
}

interface FieldRules {
    [field: string]: ValidationRule[];
}

export function useFieldValidation(rules: FieldRules) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validateField = useCallback((name: string, value: any) => {
        const fieldRules = rules[name];
        if (!fieldRules) return '';
        for (const rule of fieldRules) {
            if (rule.required && !value) return rule.message;
            if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) return rule.message;
            if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) return rule.message;
            if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) return rule.message;
        }
        return '';
    }, [rules]);

    const handleBlur = useCallback((name: string, value: any) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    }, [validateField]);

    const handleChange = useCallback((name: string, value: any) => {
        if (touched[name]) {
            const error = validateField(name, value);
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    }, [touched, validateField]);

    const setTouchedFields = useCallback((fields: string[]) => {
        setTouched(prev => {
            const next = { ...prev };
            fields.forEach(f => next[f] = true);
            return next;
        });
    }, []);

    const isValid = Object.values(errors).every(e => !e);

    const getFieldProps = useCallback((name: string, value: any) => ({
        value,
        onChange: (e: any) => handleChange(name, e.target?.value ?? e),
        onBlur: () => handleBlur(name, typeof value === 'string' ? value : ''),
        className: `form-control${errors[name] && touched[name] ? ' field-error' : ''}`,
        'aria-invalid': touched[name] && !!errors[name],
        'aria-describedby': errors[name] ? `${name}-error` : undefined,
    }), [errors, touched, handleChange, handleBlur]);

    return { errors, touched, handleBlur, handleChange, setTouchedFields, isValid, getFieldProps };
}
