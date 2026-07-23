import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
    message?: string;
    show?: boolean;
}

export default function FieldError({ message, show }: FieldErrorProps) {
    if (!message || !show) return null;
    return (
        <div className="field-error-text animate-fadeIn" role="alert" id={message ? `${message}-error` : undefined}>
            <AlertCircle size={12} />
            {message}
        </div>
    );
}
