import React from 'react';
import { UseFormRegister, FieldError, Path, FieldValues } from 'react-hook-form';

interface TextAreaFieldProps<T extends FieldValues> extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {
  id?: string;
  label?: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  icon?: React.ReactNode;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

function TextAreaField<T extends FieldValues>({
  id,
  label,
  name,
  register,
  error,
  icon,
  placeholder,
  rows = 3,
  disabled = false,
  className = '',
  ...props
}: TextAreaFieldProps<T>) {
  const hasError = !!error;

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-3.5 text-[var(--color-text-muted)] pointer-events-none">
          {icon}
        </div>
      )}
      {label && (
        <label htmlFor={id || name} className="form-label">
          {label}
        </label>
      )}
      <textarea
        id={id || name}
        {...register(name)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`form-control ${icon ? 'pl-9' : ''} ${hasError ? 'field-error' : ''} ${className}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${name}-error` : undefined}
        {...props}
      />
      {hasError && (
        <p id={`${name}-error`} className="field-error-message" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

export default TextAreaField;
