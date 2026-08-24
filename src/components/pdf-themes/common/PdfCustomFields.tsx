import React from 'react';
import type { CustomField } from '@/context/quote/types';

interface PdfCustomFieldsProps {
    customFields?: CustomField[];
    themeColor?: string;
    variant?: 'chips' | 'grid' | 'inline';
    className?: string;
    style?: React.CSSProperties;
}

export const PdfCustomFields: React.FC<PdfCustomFieldsProps> = ({
    customFields = [],
    themeColor = '#3b82f6',
    variant = 'grid',
    className = '',
    style = {}
}) => {
    const visibleFields = customFields.filter(
        f => f.showOnPdf !== false && f.value !== undefined && f.value !== null && String(f.value).trim() !== ''
    );

    if (visibleFields.length === 0) return null;

    if (variant === 'chips') {
        return (
            <div
                className={`pdf-custom-fields-chips ${className}`}
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.35rem 0.65rem',
                    fontSize: '8pt',
                    margin: '0.4rem 0',
                    ...style
                }}
            >
                {visibleFields.map((field) => (
                    <div
                        key={field.id}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: '#f8fafc',
                            border: `1px solid ${themeColor}33`,
                            color: '#334155'
                        }}
                    >
                        <span style={{ fontWeight: '700', color: themeColor }}>{field.label}:</span>
                        <span>{field.value}</span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div
            className={`pdf-custom-fields-grid ${className}`}
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.3rem 0.85rem',
                fontSize: '8pt',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderLeft: `3px solid ${themeColor}`,
                padding: '0.4rem 0.65rem',
                borderRadius: '4px',
                margin: '0.4rem 0',
                ...style
            }}
        >
            {visibleFields.map((field) => (
                <div key={field.id} style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                    <span style={{ fontWeight: '600', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {field.label}:
                    </span>
                    <span style={{ fontWeight: '600', color: '#0f172a', wordBreak: 'break-word' }}>
                        {field.value}
                    </span>
                </div>
            ))}
        </div>
    );
};
