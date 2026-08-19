import React from 'react';
import { UseFormRegister, FieldError, Path, FieldValues } from 'react-hook-form';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps<T extends FieldValues> extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'name'> {
  id?: string;
  label?: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  options: SelectOption[];
  error?: FieldError;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

function SelectField<T extends FieldValues>({
  id,
  label,
  name,
  register,
  options,
  error,
  icon,
  disabled = false,
  className = '',
  ...props
}: SelectFieldProps<T>) {
  const hasError = !!error;

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none z-10">
          {icon}
        </div>
      )}
      {label && (
        <label htmlFor={id || name} className="form-label">
          {label}
        </label>
      )}
      <select
        id={id || name}
        {...register(name)}
        disabled={disabled}
        className={`form-control ${icon ? 'pl-9' : ''} ${hasError ? 'field-error' : ''} ${className}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${name}-error` : undefined}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hasError && (
        <p id={`${name}-error`} className="field-error-message" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

export default SelectField;
