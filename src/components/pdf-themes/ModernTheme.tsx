import React, { useMemo } from 'react';
import { numberToWordsTurkish } from '@/utils/numberToWordsTurkish';
import type { QuoteItem, PdfThemeProps } from '@/context/quote/types';

const ModernTheme: React.FC<PdfThemeProps> = ({
    id,
    containerStyles,
    config,
    color,
    activeLayout,
    companyData,
    quoteData,
    customerData,
    items,
    bankData,
    signature,
    t,
    formatDate,
    formatCurrency,
    subtotal,
    discountAmount,
    totalTax,
    total,
    currentLocale,
    hasLineItemDiscounts,
    onEdit
}) => {
    // Helper for editable fields
    const layoutMap = useMemo(() => {
        const map: Record<string, boolean> = {};
        (activeLayout || []).forEach((l) => { map[l.id] = l.enabled !== false; });
        return map;
    }, [activeLayout]);
    const showSection = (sectionId: string) => layoutMap[sectionId] !== false;

    const renderEditable = (value: unknown, fieldKey: string, type = 'text', className = '') => {
        if (!onEdit) return <span className={className}>{String(value ?? '')}</span>;

        return (
            <span
                className={`editable-field group relative cursor-pointer hover:bg-[var(--color-primary-muted)] hover:ring-2 hover:ring-[var(--color-primary-ring)] rounded px-1 -mx-1 transition-all ${className}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(fieldKey, value, type);
                }}
                title={t.clickToEdit}
            >
                {String(value || '') || <span className="italic text-[var(--color-text-muted)]">{t.edit}</span>}
            </span>
        );
    };

    const modernStyles = useMemo(() => `
        .modern-theme-container {
            font-family: ${config.globalFontFamily || "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"};
            line-height: ${config.bodyLineHeight || '1.4'};
            color: ${config.globalFontColor || '#000000'} !important;
            background: var(--pdf-page-bg, #ffffff) !important;
            font-size: ${config.fontSize || 12}px;
            position: relative;
            overflow: hidden;
            border-radius: ${config.borderRadius || 6}px;
            box-shadow: ${config.enableShadows ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .modern-theme-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: ${color};
        }

        .modern-theme-container, .modern-theme-container * {
            box-sizing: border-box;
        }
        
        /* HEADER */
        .modern-theme-container .pdf-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2em;
            padding-bottom: 0;
            position: relative;
            padding-top: 1em;
        }
        
        .modern-theme-container .header-left {
            flex: 1;
            padding-right: 2em;
            display: flex;
            flex-direction: row; /* Changed to row for side-by-side logo */
            align-items: center;
            gap: 1.5em;
        }

        .modern-theme-container .company-logo {
            flex-shrink: 0;
        }

        .modern-theme-container .company-logo img {
            max-height: 80px;
            max-width: 150px;
            object-fit: contain;
        }

        .modern-theme-container .company-info {
            flex: 1;
            min-width: 0; /* Prevents flex item from overflowing */
        }
        
        .modern-theme-container .header-right {
            flex: 0 0 300px;
            padding-left: 1.5em;
            text-align: right;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-end;
            border-left: 3px solid ${color}; /* Thick vertical line */
            border-radius: 2px 0 0 2px;
        }
        
        .modern-theme-container .company-name {
            word-wrap: break-word; /* Ensure long names wrap */
            font-size: ${config.headerTitleFontSize || '1.4em'};
            font-weight: ${config.headerTitleFontWeight || '800'};
        }
        
        .modern-theme-container .company-address {
            font-size: ${config.headerInfoFontSize || '0.8em'};
            color: #4b5563;
            line-height: 1.3;
        }

        .modern-theme-container .quote-title {
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-size: ${config.titleFontSize || '1.4em'};
            font-weight: ${config.titleFontWeight || '800'};
            font-family: ${config.titleFontFamily || 'inherit'};
        }
        
        .modern-theme-container .quote-meta-grid {
            display: grid;
            grid-template-columns: auto auto;
            gap: 0.5em 1em;
            font-size: ${config.quoteMetaLabelFontSize || '0.8em'};
            color: #4b5563;
        }

        .modern-theme-container .quote-meta-label {
            color: #6b7280;
            font-weight: ${config.quoteMetaLabelFontWeight || '500'};
        }

        .modern-theme-container .quote-meta-value {
            font-weight: ${config.quoteMetaValueFontWeight || '600'};
            color: #000;
            font-size: ${config.quoteMetaValueFontSize || 'inherit'};
        }
        
        /* CUSTOMER SECTION */
        .modern-theme-container .customer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5em;
            margin-bottom: 2em;
        }
        
        .modern-theme-container .customer-box {
            background: #f8fafc !important;
            border-radius: 8px;
            padding: 1.25em;
            border: 1px solid #e2e8f0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .modern-theme-container .section-title {
            text-transform: uppercase;
            font-size: ${config.customerTitleFontSize || '0.9em'};
            font-weight: ${config.customerTitleFontWeight || '700'};
        }

        /* Force light theme for PDF container - Stronger Selector */
        [data-theme="dark"] .modern-theme-container,
        .modern-theme-container {
            background-color: var(--pdf-page-bg, #ffffff) !important;
            color: ${config.globalFontColor || '#000000'} !important;
        }

        [data-theme="dark"] .modern-theme-container *,
        .modern-theme-container * {
            border-color: #e2e8f0 !important;
        }

        [data-theme="dark"] .modern-theme-container .customer-box,
        [data-theme="dark"] .modern-theme-container .bottom-section,
        .modern-theme-container .customer-box,
        .modern-theme-container .bottom-section {
            background-color: #f8fafc !important;
            color: #000000 !important;
            border: 1px solid #e2e8f0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        [data-theme="dark"] .modern-theme-container .company-name,
        [data-theme="dark"] .modern-theme-container .quote-title,
        [data-theme="dark"] .modern-theme-container .section-title,
        .modern-theme-container .company-name,
        .modern-theme-container .quote-title,
        .modern-theme-container .section-title {
            color: ${color} !important;
        }

        [data-theme="dark"] .modern-theme-container .quote-meta-value,
        [data-theme="dark"] .modern-theme-container .info-value strong,
        [data-theme="dark"] .modern-theme-container .summary-row,
        .modern-theme-container .quote-meta-value,
        .modern-theme-container .info-value strong,
        .modern-theme-container .summary-row {
            color: #000000 !important;
        }

        [data-theme="dark"] .modern-theme-container .header-right,
        .modern-theme-container .header-right {
            border-left-color: ${color} !important;
        }
        
        /* Ensure summary row text is dark */
        .modern-theme-container .summary-row span {
            color: #000000 !important;
        }
        .modern-theme-container .summary-row.discount span {
            color: #ef4444 !important;
        }
        
        .modern-theme-container .info-grid {
            display: grid;
            gap: 0.5em;
        }
        
        .modern-theme-container .info-line {
            display: grid;
            grid-template-columns: 80px 1fr;
            font-size: 0.8em;
            align-items: baseline;
        }
        
        .modern-theme-container .info-label {
            color: #64748b;
            font-weight: ${config.customerLabelFontWeight || '500'};
            font-size: ${config.customerLabelFontSize || 'inherit'};
        }
        
        .modern-theme-container .info-value {
            color: #1e293b;
            font-weight: ${config.customerValueFontWeight || '500'};
            font-size: ${config.customerValueFontSize || 'inherit'};
        }
        
        /* TABLE */
        .modern-theme-container .pdf-items-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 2em;
        }
        
        .modern-theme-container .pdf-items-table th {
            padding: 0.75em 0.5em;
            text-align: left;
            font-weight: ${config.tableHeaderFontWeight || '700'};
            color: ${config.tableHeaderColor || '#94a3b8'}; /* Lighter gray for headers */
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '1.15em')} !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid ${config.tableBorderColor || '#e2e8f0'};
        }
        .modern-theme-container .pdf-items-table thead th:first-child { border-top-left-radius: 8px; }
        .modern-theme-container .pdf-items-table thead th:last-child { border-top-right-radius: 8px; }
        .modern-theme-container .pdf-items-table tbody tr:last-child td:first-child { border-bottom-left-radius: 8px; }
        .modern-theme-container .pdf-items-table tbody tr:last-child td:last-child { border-bottom-right-radius: 8px; }
        
        .modern-theme-container .pdf-items-table thead {
            background: ${config.tableHeaderBg || 'transparent'};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .modern-theme-container .pdf-items-table td {
            padding: ${config.tableCellPadding || '1em 0.5em'};
            border-bottom: 1px solid ${config.tableBorderColor || '#f1f5f9'};
            vertical-align: middle;
            font-size: ${config.tableBodyFontSize || 'inherit'};
            font-weight: ${config.tableBodyFontWeight || 'normal'};
            height: ${config.tableRowHeight || 0}px;
        }

        ${config.tableStriped ? `
        .modern-theme-container .pdf-items-table tbody tr:nth-child(even) td {
            background: ${config.tableStripedColor || '#f8fafc'};
        }` : ''}

        ${config.tableShowVerticalLines ? `
        .modern-theme-container .pdf-items-table th,
        .modern-theme-container .pdf-items-table td {
            border-left: 1px solid ${config.tableBorderColor || '#e2e8f0'};
        }
        .modern-theme-container .pdf-items-table th:first-child,
        .modern-theme-container .pdf-items-table td:first-child {
            border-left: none;
        }` : ''}

        .modern-theme-container .item-image {
            width: 48px;
            height: 48px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: #fff;
        }
        
        .modern-theme-container .item-image img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .modern-theme-container .item-name {
            font-weight: 600;
            color: ${color};
            font-size: 1.2em;
            margin-bottom: 0.25em;
        }

        .modern-theme-container .item-desc {
            font-size: 1em !important;
            color: #64748b;
            line-height: 1.4;
        }

        .modern-theme-container .item-value {
            font-weight: 600;
            color: ${color};
            font-size: 0.85em;
        }

        /* SUMMARY & BANK SECTION - COMBINED CONTAINER */
        .modern-theme-container .bottom-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2em;
            margin-bottom: 2em;
            background: #f8fafc !important; /* Shared background */
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5em;
        }

        .modern-theme-container .summary-section {
            /* No individual background */
        }

        .modern-theme-container .bank-section {
            /* No individual background */
        }

        .modern-theme-container .summary-row {
            padding: 0.5em 0;
            font-size: ${config.summaryLabelFontSize || '0.85em'};
            font-weight: ${config.summaryLabelFontWeight || 'normal'};
            color: #475569;
        }

        .modern-theme-container .summary-row.discount {
            color: #ef4444;
        }

        .modern-theme-container .summary-row.grand-total {
            margin-top: 1em;
            padding-top: 1em;
            border-top: 1px solid #e2e8f0;
            align-items: center;
            font-size: ${config.summaryTotalFontSize || '1.1em'};
        }

        .modern-theme-container .bank-list {
            font-size: 0.8em;
            color: #475569;
            line-height: 1.6;
        }

        .modern-theme-container .bank-row {
            display: grid;
            grid-template-columns: 80px 1fr;
            margin-bottom: 0.25em;
        }

        /* TERMS & NOTES */
        .modern-theme-container .notes-section {
            margin-bottom: 2em;
        }

        .modern-theme-container .notes-title {
            font-size: 0.8em;
            font-weight: 700;
            color: ${color};
            margin-bottom: 0.5em;
            text-transform: uppercase;
        }

        .modern-theme-container .notes-content {
            font-size: 0.8em;
            color: #475569;
            line-height: 1.5;
        }

        .modern-theme-container .terms-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1em;
            margin-bottom: 2em;
        }

        /* SIGNATURES */
        .modern-theme-container .signatures-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4em;
            margin-top: 3em;
            margin-bottom: 2em;
        }

        .modern-theme-container .signature-col {
            text-align: center;
        }

        .modern-theme-container .signature-line {
            border-bottom: 1px solid #cbd5e1;
            height: 60px;
            margin-bottom: 0.5em;
        }

        .modern-theme-container .signature-label {
            font-size: 0.8em;
            font-weight: 600;
            color: #64748b;
        }

        /* FOOTER */
        .modern-theme-container .pdf-footer {
            text-align: center;
            padding-top: 2em;
            border-top: 1px solid #e2e8f0;
            margin-top: auto;
        }

            margin-bottom: 0.5em;
            font-size: ${config.footerFontSize ? `calc(${config.footerFontSize} * 1.2)` : '0.9rem'};
            font-weight: ${config.footerFontWeight || '700'};
        }

        .modern-theme-container .footer-info {
            display: flex;
            justify-content: center;
            gap: 1.5rem;
            font-size: ${config.footerFontSize || '0.75rem'};
            font-weight: ${config.footerFontWeight || 'normal'};
            color: #64748b;
        }

        .modern-theme-container .footer-item {
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }

        /* COMPACT MODES */
        .pdf-compact-mode .pdf-items-table th,
        .pdf-compact-mode .pdf-items-table td {
            padding: 0.5rem 0.25rem;
        }
        
        .pdf-compact-mode .item-image {
            width: 32px;
            height: 32px;
        }
    `, [color, config]);

    const itemsPerPage = config.itemsPerPage || 14;
    const itemChunks = useMemo(() => {
        const chunks: QuoteItem[][] = [];
        if (items.length === 0) {
            chunks.push([]);
        } else {
            for (let i = 0; i < items.length; i += itemsPerPage) {
                chunks.push(items.slice(i, i + itemsPerPage));
            }
        }
        return chunks;
    }, [items, itemsPerPage]);

    const renderTable = (tableItems: QuoteItem[], startIndex: number) => (
        <table className="pdf-items-table">
            <thead>
                <tr>
                    <th style={{ width: '30px', textAlign: 'center' }}>#</th>
                    {config.showTableImages && <th style={{ width: '50px', textAlign: 'center' }}>{t.image}</th>}
                    <th>{config.textItem || t.item} / {t.description}</th>
                    {config.showTableUnit && <th style={{ width: '60px', textAlign: 'center' }}>{config.textUnit || t.unit}</th>}
                    <th style={{ width: '60px', textAlign: 'center' }}>{config.textQuantity || t.quantity}</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>{config.textUnitPrice || t.unitPrice}</th>
                    {hasLineItemDiscounts && <th style={{ width: '60px', textAlign: 'center' }}>{t.discount}</th>}
                    {config.showTableTax && <th style={{ width: '60px', textAlign: 'center' }}>{config.textVat || t.tax}</th>}
                    <th style={{ width: '110px', textAlign: 'right' }}>{config.textTotal || t.total}</th>
                </tr>
            </thead>
            <tbody>
                {tableItems.map((item, index) => (
                    <tr key={startIndex + index}>
                        <td style={{ textAlign: 'center', color: '#64748b' }}>{startIndex + index + 1}</td>
                        {config.showTableImages && (
                            <td>
                                <div className="item-image">
                                    {item.image ? (
                                        <img src={item.image} alt="" />
                                    ) : (
                                        <span style={{ fontSize: '8px' }}>-</span>
                                    )}
                                </div>
                            </td>
                        )}
                        <td>
                            <div className="item-name">{item.name}</div>
                            {item.description && <div className="item-desc">{item.description}</div>}
                        </td>
                        {config.showTableUnit && <td className="item-unit" style={{ textAlign: 'center' }}>{item.unit}</td>}
                        <td className="item-quantity" style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
                        <td className="item-price" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.price)}</td>
                        {hasLineItemDiscounts && <td className="item-discount" style={{ textAlign: 'center', color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{item.discountRate ? `%${item.discountRate}` : '-'}</td>}
                        {config.showTableTax && <td className="item-tax" style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>%{item.taxRate}</td>}
                        <td className="item-total" style={{ textAlign: 'right', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency((item.quantity || 0) * (item.price || 0) * (1 - (item.discountRate || 0) / 100))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div id={id} className="modern-theme-container w-full max-w-[210mm] mx-auto" style={containerStyles}>
            <style>{modernStyles}</style>

            {itemChunks.map((chunk, pageIndex) => (
                <div key={pageIndex} className="pdf-preview pdf-page" style={{
                    position: 'relative',
                    minHeight: containerStyles?.pageMinHeight || '290mm',
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    pageBreakAfter: pageIndex < itemChunks.length - 1 ? 'always' : 'auto'
                }}>
                    {/* Watermark */}
                    {config.showWatermark && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none',
                                zIndex: 0,
                                transform: `rotate(${config.watermarkRotation || -45}deg)`,
                                opacity: config.watermarkOpacity,
                                fontSize: `${config.watermarkFontSize || 120}px`,
                                fontWeight: 'bold',
                                color: config.watermarkColor || '#000000',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {config.watermarkText}
                        </div>
                    )}

                    {/* Header */}
                    {showSection('header') && (pageIndex === 0 ? (
                        <div className="pdf-header" style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${color}` }}>
                            <div className="header-left">
                                {config.showLogo && companyData.logo && (
                                    <div className="company-logo" style={{ display: 'flex', justifyContent: config.logoPosition === 'center' ? 'center' : config.logoPosition === 'right' ? 'flex-end' : 'flex-start', marginBottom: '0.35rem' }}>
                                        <img src={companyData.logo} alt="Logo" style={{ maxHeight: `${config.logoMaxHeight || 48}px`, maxWidth: '100%', objectFit: 'contain', borderRadius: config.logoStyle === 'circle' ? '50%' : config.logoStyle === 'rounded' ? '8px' : '0' }} />
                                    </div>
                                )}
                                <div className="company-info">
                                    <div className="company-name" style={{ fontSize: '1.15rem', fontWeight: '800', color: color }}>{renderEditable(companyData.name, 'companyName')}</div>
                                    <div className="company-details" style={{ fontSize: config.headerInfoFontSize || '0.78rem', color: '#475569', marginTop: '0.2rem' }}>
                                        {companyData.address && <div>{companyData.address}</div>}
                                        {(companyData.phone || companyData.email || companyData.website) && (
                                            <div style={{ marginTop: '0.15rem', color: '#64748b' }}>
                                                {companyData.phone && <span>{companyData.phone}</span>}
                                                {companyData.phone && companyData.email && <span> • </span>}
                                                {companyData.email && <span>{companyData.email}</span>}
                                                {(companyData.phone || companyData.email) && companyData.website && <span> • </span>}
                                                {companyData.website && <span>{companyData.website}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="header-right" style={{ textAlign: 'right' }}>
                                <div className="quote-title" style={{ fontSize: '1.25rem', fontWeight: '800', color: color, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{renderEditable(config.title, 'quoteTitle')}</div>
                                <div className="quote-meta" style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.4rem', display: 'inline-flex', gap: '0.6rem', alignItems: 'center', background: '#f8fafc', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontWeight: '700', color: '#0f172a' }}>#{quoteData.number}</span>
                                    <span>•</span>
                                    <span>{t.date}: {formatDate(quoteData.date, currentLocale)}</span>
                                    <span>•</span>
                                    <span>{t.validUntil}: {formatDate(quoteData.validUntil, currentLocale)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="pdf-header" style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${color}` }}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: config.headerInfoFontSize || '0.8em', color: '#666' }}>
                                <span>{companyData.name} - {config.title}</span>
                                {config.showPageNumbers !== false && (
                                    <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Customer Section - Only Page 1 (Single Full-Width Clean Card) */}
                    {showSection('customer') && pageIndex === 0 && (
                        <div className="customer-section" style={{ marginBottom: '1.25rem' }}>
                            <div className="customer-box" style={{ width: '100%', backgroundColor: '#ffffff', color: '#000000', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem 1.25rem', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <div className="section-title" style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.25rem' }}>
                                    {t.customer} / {t.to}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem 1.5rem', alignItems: 'center' }}>
                                    {customerData.company && (
                                        <div style={{ gridColumn: '1 / -1', fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>
                                            {renderEditable(customerData.company, 'customerCompany')}
                                        </div>
                                    )}
                                    {customerData.name && (
                                        <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>{t.authorized}: </span>
                                            <span style={{ fontWeight: '500' }}>{renderEditable(customerData.name, 'customerName')}</span>
                                        </div>
                                    )}
                                    {customerData.phone && (
                                        <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>{t.phone}: </span>
                                            <span>{renderEditable(customerData.phone, 'customerPhone')}</span>
                                        </div>
                                    )}
                                    {customerData.email && (
                                        <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>{t.email}: </span>
                                            <span>{renderEditable(customerData.email, 'customerEmail')}</span>
                                        </div>
                                    )}
                                    {customerData.address && (
                                        <div style={{ gridColumn: '1 / -1', fontSize: '0.78rem', color: '#64748b' }}>
                                            <span>{customerData.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    {showSection('items') && (
                        <div style={{ flex: 1 }}>
                            {renderTable(chunk, pageIndex * itemsPerPage)}
                        </div>
                    )}

                    {/* Summary, Notes, Signatures - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto' }}>
                            {(config.showSummary || config.showBankInfo) && (
                                <div className="bottom-section" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem', backgroundColor: '#ffffff', color: '#000000', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.25rem', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                    <div className="bank-section" style={{ backgroundColor: 'transparent', color: '#000000' }}>
                                        {config.showBankInfo && (bankData.bankName || bankData.iban) && (
                                            <div className="bank-info">
                                                <div className="section-title" style={{ marginBottom: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.2rem', textTransform: 'uppercase', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
                                                    {t.bankInfo}
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: '1.6' }}>
                                                    {bankData.bankName && (
                                                        <div style={{ display: 'flex' }}><strong style={{ width: '80px', color: '#64748b' }}>{t.bank}:</strong> <span style={{ color: '#0f172a', fontWeight: '500' }}>{bankData.bankName}</span></div>
                                                    )}
                                                    {bankData.branch && (
                                                        <div style={{ display: 'flex' }}><strong style={{ width: '80px', color: '#64748b' }}>{t.branch}:</strong> <span>{bankData.branch}</span></div>
                                                    )}
                                                    {bankData.accountHolder && (
                                                        <div style={{ display: 'flex' }}><strong style={{ width: '80px', color: '#64748b' }}>{t.accountHolder}:</strong> <span>{bankData.accountHolder}</span></div>
                                                    )}
                                                    {bankData.iban && (
                                                        <div style={{ display: 'flex', marginTop: '0.2rem' }}><strong style={{ width: '80px', color: '#64748b' }}>{t.iban}:</strong> <span style={{ fontFamily: 'monospace', fontWeight: '700', letterSpacing: '0.03em', color: '#0f172a' }}>{bankData.iban}</span></div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="summary-section" style={{ backgroundColor: 'transparent', color: '#000000' }}>
                                        <div className="section-title" style={{ marginBottom: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.2rem', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                                            {t.summary}
                                        </div>
                                        <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#475569', fontSize: '0.8rem' }}>
                                            <span>{t.subtotal}:</span>
                                            <span style={{ fontWeight: '600', fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="summary-row discount" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#ef4444', fontSize: '0.8rem' }}>
                                                <span>{t.discount} (%{Math.round((discountAmount / subtotal) * 100)}):</span>
                                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        {config.showTableTax && (
                                            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#475569', fontSize: '0.8rem' }}>
                                                <span>{t.vat}:</span>
                                                <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(totalTax)}</span>
                                            </div>
                                        )}
                                        <div className="summary-row grand-total" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', marginTop: '0.4rem', paddingTop: '0.4rem', color: '#0f172a', fontSize: '1.05rem', fontWeight: '800' }}>
                                            <span>{t.generalTotal}:</span>
                                            <span style={{ color: color, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span>
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.25rem', textAlign: 'right' }}>
                                            {numberToWordsTurkish(total, quoteData.currency || 'TRY')}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Unified Notes & Terms */}
                            {showSection('notes') && (config.showTerms || config.showNotes) && (quoteData.notes || quoteData.deliveryTerms || quoteData.warrantyTerms || quoteData.terms) && (
                                <div className="terms-box" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                                    <div className="notes-title" style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{t.terms} & {t.notes}</div>
                                    <div className="notes-content" style={{ fontSize: '0.78rem', color: '#475569', lineHeight: '1.5' }}>
                                        {quoteData.notes && <div style={{ marginBottom: '0.25rem' }}><strong>{t.notes}:</strong> {renderEditable(quoteData.notes, 'notes', 'textarea')}</div>}
                                        {quoteData.deliveryTerms && <div><strong>{t.delivery}:</strong> {renderEditable(quoteData.deliveryTerms, 'deliveryTerms', 'textarea')}</div>}
                                        {quoteData.warrantyTerms && <div><strong>{t.warranty}:</strong> {renderEditable(quoteData.warrantyTerms, 'warrantyTerms', 'textarea')}</div>}
                                        {quoteData.terms && <div><strong>{t.payment}:</strong> {renderEditable(quoteData.terms, 'terms', 'textarea')}</div>}
                                    </div>
                                </div>
                            )}

                            {/* Signatures - 2 Sütun (Teklifi Hazırlayan & Müşteri Onayı) */}
                            {showSection('signatures') && config.showSignatures && (
                                <div className="signatures-grid" style={{ marginTop: '2rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                                    <div className="signature-col" style={{ textAlign: 'center' }}>
                                        <div className="signature-line" style={{
                                            height: 'auto',
                                            minHeight: (signature || companyData.signature || companyData.stamp) ? '55px' : '35px',
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            justifyContent: 'center',
                                            gap: '1rem',
                                            paddingBottom: '4px',
                                            borderBottom: '1px solid #94a3b8'
                                        }}>
                                            {(signature || companyData.signature) && (
                                                <img
                                                    src={(signature || companyData.signature) as string}
                                                    alt="Signature"
                                                    style={{ maxHeight: '50px', maxWidth: '120px', objectFit: 'contain' }}
                                                />
                                            )}
                                            {companyData.stamp && (
                                                <img
                                                    src={companyData.stamp}
                                                    alt="Stamp"
                                                    style={{ maxHeight: '50px', maxWidth: '100px', objectFit: 'contain', opacity: 0.85 }}
                                                />
                                            )}
                                        </div>
                                        <div className="signature-label" style={{ paddingTop: '0.35rem', fontWeight: '600', color: '#0f172a', fontSize: '0.8rem' }}>
                                            {t.seller} (Kaşe & İmza)
                                        </div>
                                    </div>
                                    <div className="signature-col" style={{ textAlign: 'center' }}>
                                        <div className="signature-line" style={{
                                            height: 'auto',
                                            minHeight: (signature || companyData.signature || companyData.stamp) ? '55px' : '35px',
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            justifyContent: 'center',
                                            paddingBottom: '4px',
                                            borderBottom: '1px solid #94a3b8'
                                        }}>
                                        </div>
                                        <div className="signature-label" style={{ paddingTop: '0.35rem', fontWeight: '600', color: '#0f172a', fontSize: '0.8rem' }}>
                                            {t.customer} (Onay / İmza)
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer - Only Last Page (Clean Single Line) */}
                    {showSection('footer') && pageIndex === itemChunks.length - 1 && (
                        <div className="pdf-footer" style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                <span><strong>{companyData.name}</strong></span>
                                {companyData.phone && <span>• {companyData.phone}</span>}
                                {companyData.email && <span>• {companyData.email}</span>}
                                {companyData.website && <span>• {companyData.website}</span>}
                            </div>
                            <div style={{ marginTop: '0.25rem', fontSize: '0.7rem', color: '#94a3b8' }}>
                                {t.thankYou} • {t.regards}
                            </div>
                        </div>
                    )}
                    {config.customFooter && (
                        <div className="custom-footer" style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.25rem' }}>
                            {config.customFooter}
                        </div>
                    )}

                    {/* Page Number */}
                    {config.showPageNumbers && (
                        <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '0.25rem' }}>
                            <span>{quoteData.number ? `#${quoteData.number}` : ''}</span>
                            <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ModernTheme;


