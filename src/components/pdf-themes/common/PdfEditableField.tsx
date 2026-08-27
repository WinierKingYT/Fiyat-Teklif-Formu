import { memo } from 'react';

interface PdfEditableFieldProps {
    value: unknown;
    fieldKey: string;
    type?: string;
    className?: string;
    onEdit?: (fieldKey: string, value: unknown, type?: string) => void;
    t: Record<string, string>;
}

export const PdfEditableField = memo(({ value, fieldKey, type = 'text', className = '', onEdit, t }: PdfEditableFieldProps) => {
    if (!onEdit) return <span className={className}>{String(value ?? '')}</span>;
    return (
        <span
            className={`editable-field group relative cursor-pointer hover:bg-[var(--color-primary-muted)] hover:ring-2 hover:ring-[var(--color-primary-ring)] rounded px-1 -mx-1 transition-all ${className}`}
            onClick={(e) => { e.stopPropagation(); onEdit(fieldKey, value, type); }}
            title={t.clickToEdit}
        >
            {(value !== undefined && value !== null && value !== '') ? String(value) : <span className="italic text-[var(--color-text-muted)] no-print pdf-placeholder">{t.edit}</span>}
        </span>
    );
});
PdfEditableField.displayName = 'PdfEditableField';
