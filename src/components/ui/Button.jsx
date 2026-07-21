import React from 'react';

const variants = {
    primary: 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]',
    outline: 'bg-transparent text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
    ghost: 'bg-transparent text-[var(--color-text-secondary)] border-transparent hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]',
    danger: 'bg-[var(--color-error)] text-white border-[var(--color-error)] hover:bg-[#B91C1C]',
    success: 'bg-[var(--color-success)] text-white border-[var(--color-success)] hover:bg-[#15803D]',
};

const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-sm',
};

const Button = React.forwardRef(({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
        <button
            ref={ref}
            className={`inline-flex items-center justify-center gap-1.5 rounded-[var(--radius)] font-medium border transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[var(--color-info)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none whitespace-nowrap ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
});

Button.displayName = 'Button';
export default Button;
