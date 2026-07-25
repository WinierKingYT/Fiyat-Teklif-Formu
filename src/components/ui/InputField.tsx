import React from 'react';
import { UseFormRegister, FieldError, Path, FieldValues } from 'react-hook-form';

interface InputFieldProps<T extends FieldValues> {
  id?: string;
  label?: string;
  type?: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  icon?: React.ReactNode;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}

function InputField<T extends FieldValues>({
  id,
  label,
  type = 'text',
  name,
  register,
  error,
  icon,
  placeholder,
  autoComplete,
  disabled = false,
  className = '',
  ...props
}: InputFieldProps<T>) {
  const hasError = !!error;

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
          {icon}
        </div>
      )}
      {label && (
        <label htmlFor={id || name} className="form-label">
          {label}
        </label>
      )}
      <input
        id={id || name}
        type={type}
        {...register(name)}
        placeholder={placeholder}
        autoComplete={autoComplete}
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

export default InputField;
