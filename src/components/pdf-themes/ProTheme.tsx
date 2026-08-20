import React, { useMemo } from 'react';
import { numberToWordsTurkish } from '@/utils/numberToWordsTurkish';
import { getAdjustedFontSize } from '@/utils/themeHelpers';
import type { QuoteItem, PdfThemeProps } from '@/context/quote/types';

const ProTheme: React.FC<PdfThemeProps> = ({
    id,
    containerStyles,
    config,
    color,
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
    discount,
    discountAmount,
    totalTax,
    total,
    currentLocale,
    hasLineItemDiscounts,
    onEdit,
    activeLayout
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
    const proStyles = useMemo(() => `
        .pro-theme-container {
            font-family: ${config.globalFontFamily || "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"};
            line-height: ${config.bodyLineHeight || '1.4'};
            color: ${config.globalFontColor || '#1e293b'};
            font-size: ${config.fontSize || 12}px;
            background-color: var(--pdf-page-bg, #ffffff) !important;
            position: relative;
            box-shadow: ${config.enableShadows ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'};
        }

        .pro-theme-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, ${color}, #ededed);
        }

        .pro-theme-container .pdf-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: ${config.sectionSpacing || '1.5em'};
            padding-bottom: 1em;
            border-bottom: ${config.boxBorderWidth || '1px'} ${config.boxBorderStyle || 'solid'} ${config.boxBorderColor || '#e2e8f0'};
        }

        .pro-theme-container .header-left {
            display: flex;
            align-items: flex-start;
            gap: 1.5em;
            flex: 1;
        }

        .pro-theme-container .company-logo {
            width: 120px;
            height: ${config.logoMaxHeight || 60}px;
            border: ${config.boxBorderWidth || '1px'} ${config.boxBorderStyle || 'solid'} ${config.boxBorderColor || '#e2e8f0'};
            border-radius: ${config.logoStyle === 'circle' ? '999px' : config.logoStyle === 'rounded' ? '8px' : (config.borderRadius || 6) + 'px'};
            display: flex;
            align-items: center;
            justify-content: ${config.logoPosition === 'center' ? 'center' : config.logoPosition === 'right' ? 'flex-end' : 'flex-start'};
            background: #f8fafc;
            color: #000000;
            font-size: 0.6em;
            text-align: center;
            padding: 0.5em;
            overflow: hidden;
        }

        .pro-theme-container .company-logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }

        .pro-theme-container .company-info {
            flex: 1;
        }

        .pro-theme-container .company-name {
            font-size: ${config.headerTitleFontSize || '1.4em'} !important;
            font-weight: ${config.headerTitleFontWeight || '800'} !important;
            color: ${color};
            margin-bottom: 0.25em;
            font-family: ${config.headerFontFamily || 'inherit'};
        }

        .pro-theme-container .company-details {
            font-size: ${config.headerInfoFontSize || '0.85em'} !important;
            color: ${config.bodyColor || '#334155'};
            line-height: 1.4;
            font-family: ${config.bodyFontFamily || 'inherit'};
        }

        .pro-theme-container .quote-info {
            text-align: right;
            background: #f8fafc;
            padding: 1em;
            border-radius: ${config.borderRadius || 6}px;
            border-left: 4px solid ${color};
            min-width: 200px;
        }

        .pro-theme-container .quote-title {
            font-family: ${config.titleFontFamily || 'inherit'};
            font-size: ${config.titleFontSize || '1.2em'};
            font-weight: ${config.titleFontWeight || '800'};
            color: ${color};
            letter-spacing: ${config.titleLetterSpacing || 'normal'};
            text-transform: ${config.titleTransform || 'uppercase'};
            margin-bottom: 0.5em;
        }

        .pro-theme-container .quote-meta {
            font-size: ${config.quoteMetaLabelFontSize || '0.85em'};
            color: ${config.labelColor || '#64748b'};
            font-family: ${config.labelFontFamily || 'inherit'};
        }

        .pro-theme-container .quote-meta div {
            margin-bottom: 0.25em;
            font-weight: ${config.quoteMetaValueFontWeight || 'normal'};
            font-size: ${config.quoteMetaValueFontSize || 'inherit'};
        }

        .pro-theme-container .quote-meta div strong {
             font-weight: ${config.quoteMetaLabelFontWeight || 'bold'};
        }

        .pro-theme-container .quote-number {
            font-weight: 700;
            color: #0f172a;
            font-size: 1.1em;
            margin-bottom: 0.5em;
        }

        .pro-theme-container .customer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5em;
            margin-bottom: ${config.sectionSpacing || '1.5em'};
        }

        .pro-theme-container .customer-box {
            background: #f8fafc;
            border-radius: ${config.borderRadius || 6}px;
            padding: ${config.boxPadding || '1.2em'};
            border: ${config.boxBorderWidth || '1px'} ${config.boxBorderStyle || 'solid'} ${config.boxBorderColor || '#e2e8f0'};
        }

        .pro-theme-container .section-title {
            font-family: ${config.headerFontFamily || 'inherit'};
            font-size: ${config.customerTitleFontSize || '0.9em'} !important;
            font-weight: ${config.customerTitleFontWeight || '700'} !important;
            color: ${color};
            text-transform: ${config.headerTransform || 'uppercase'};
            margin-bottom: 1em;
            display: flex;
            align-items: center;
            gap: 0.5em;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 0.5em;
        }

        .pro-theme-container .info-grid {
            display: grid;
            color: #334155;
            gap: 0.5em;
        }

        .pro-theme-container .info-line {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
        }

        .pro-theme-container .info-label {
            font-family: ${config.labelFontFamily || 'inherit'};
            font-size: ${config.customerLabelFontSize || '0.85em'} !important;
            font-weight: ${config.customerLabelFontWeight || '600'} !important;
            color: #64748b;
        }

        .pro-theme-container .info-value {
            font-family: ${config.bodyFontFamily || 'inherit'};
            font-size: ${config.customerValueFontSize || '0.9em'} !important;
            font-weight: ${config.customerValueFontWeight || '500'} !important;
            text-align: right;
        }

        .pro-theme-container .term-content {
            font-size: 0.85em;
            line-height: 1.5;
            color: #475569;
            font-family: ${config.bodyFontFamily || 'inherit'};
        }

        .pro-theme-container .pdf-items-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 2em;
        }

        .pro-theme-container .pdf-items-table thead th:first-child { border-top-left-radius: 10px; }
        .pro-theme-container .pdf-items-table thead th:last-child { border-top-right-radius: 10px; }
        .pro-theme-container .pdf-items-table tbody tr:last-child td:first-child { border-bottom-left-radius: 10px; }
        .pro-theme-container .pdf-items-table tbody tr:last-child td:last-child { border-bottom-right-radius: 10px; }
        .pro-theme-container .pdf-items-table tbody tr:last-child td { border-bottom: none; }

        .pro-theme-container .pdf-items-table th {
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : config.tableHeaderFontSize || '1.2em'} !important;
            font-weight: ${config.tableHeaderFontWeight || '700'} !important;
            color: ${config.tableHeaderColor || color};
            background: ${config.tableHeaderBg || '#f1f5f9'};
            padding: ${config.tableHeaderPadding || '1em 1em'};
            text-transform: ${config.tableHeaderTransform || 'uppercase'};
            text-align: left;
        }

        .pro-theme-container .pdf-items-table td {
            font-size: ${getAdjustedFontSize(config.tableBodyFontSize, 0.8, '0.75em')} !important;
            font-weight: ${config.tableBodyFontWeight || '500'} !important;
            padding: ${config.tableCellPadding || '0.8em'};
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
            vertical-align: middle;
        }

        .pro-theme-container .item-image {
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
            margin: 0 auto;
        }

        .pro-theme-container .item-image img {
            max-width: 80%;
            max-height: 80%;
            object-fit: contain;
        }

        .pro-theme-container .item-name {
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 0.25em;
        }

        .pro-theme-container .item-desc {
            font-size: 0.85em;
            color: #64748b;
        }

        .pro-theme-container .pdf-summary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2em;
            margin-top: 1em;
            page-break-inside: avoid;
        }

        .pro-theme-container .payment-info {
            background: #f8fafc;
            padding: 1.5em;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }

        .pro-theme-container .totals-section {
            background: #ffffff;
            padding: 1.5em;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }

        .pro-theme-container .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75em;
            padding-bottom: 0.75em;
            border-bottom: 1px dashed #e2e8f0;
        }

        .pro-theme-container .summary-row:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }

        .pro-theme-container .summary-row span:first-child {
            font-size: ${config.summaryLabelFontSize || '0.9em'} !important;
            font-weight: ${config.summaryLabelFontWeight || '600'} !important;
            color: #64748b;
        }

        .pro-theme-container .summary-row span:last-child {
            font-size: ${config.summaryValueFontSize || '1em'} !important;
            font-weight: ${config.summaryValueFontWeight || '700'} !important;
            color: #0f172a;
        }

        .pro-theme-container .grand-total {
            margin-top: 1em;
            padding-top: 1em;
            border-top: 2px solid #0f172a;
        }

        .pro-theme-container .grand-total span {
            font-size: ${config.summaryTotalFontSize || '1.4em'} !important;
            font-weight: ${config.summaryTotalFontWeight || '800'} !important;
            color: ${color};
        }

        .pro-theme-container .pdf-footer {
            margin-top: 2em;
            padding-top: 1.5em;
            border-top: 1px solid #e2e8f0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1em;
            font-size: ${config.footerFontSize || '0.8em'} !important;
            font-weight: ${config.footerFontWeight || '500'} !important;
            color: ${config.footerColor || '#64748b'};
        }

        .pro-theme-container .footer-contact div {
            margin-bottom: 0.25em;
        }

        .pro-theme-container .footer-thanks {
            text-align: right;
        }

        .pro-theme-container .footer-thanks .thanks-text {
            font-weight: 700;
            color: ${color};
            margin-bottom: 0.25em;
            font-size: 1.1em;
        }
        
        .pro-theme-container .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-top: 2rem;
            page-break-inside: avoid;
        }

        .pro-theme-container .signature-box {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .pro-theme-container .signature-area {
            height: 80px;
            width: 100%;
            border-bottom: 1px solid #cbd5e1;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 5px;
        }

        .pro-theme-container .stamp-area {
            height: 80px;
            width: 100%;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
        }

        .pro-theme-container .signature-label {
            font-size: 0.8em;
            color: #64748b;
            font-weight: 500;
        }

        ${config.tableStriped ? `
        .pro-theme-container .pdf-items-table tbody tr:nth-child(even) td {
            background: ${config.tableStripedColor || '#f8fafc'};
        }
        ` : ''}

        .pro-theme-container .pdf-items-table td {
            height: ${config.tableRowHeight || 0}px;
        }

        ${config.tableShowVerticalLines ? `
        .pro-theme-container .pdf-items-table th,
        .pro-theme-container .pdf-items-table td {
            border-left: 1px solid ${config.tableBorderColor || '#e2e8f0'};
        }
        .pro-theme-container .pdf-items-table th:first-child,
        .pro-theme-container .pdf-items-table td:first-child {
            border-left: none;
        }
        ` : ''}
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
                    <th>#</th>
                    {config.showTableImages && <th>{t.image}</th>}
                    <th>{config.textItem || t.item}</th>
                    {config.showTableUnit && <th>{config.textUnit || t.unit}</th>}
                    <th>{config.textQuantity || t.quantity}</th>
                    <th style={{ textAlign: 'right' }}>{config.textUnitPrice || t.unitPrice}</th>
                    {hasLineItemDiscounts && <th style={{ textAlign: 'center' }}>{t.discount}</th>}
                    {config.showTableTax && <th style={{ textAlign: 'center' }}>{config.textVat || t.tax}</th>}
                    <th style={{ textAlign: 'right' }}>{config.textTotal || t.total}</th>
                </tr>
            </thead>
            <tbody>
                {tableItems.map((item, index) => (
                    <tr key={startIndex + index}>
                        <td>{startIndex + index + 1}</td>
                        {config.showTableImages && (
                            <td>
                                <div className="item-image">
                                    {item.image ? (
                                        <img src={item.image} alt="" />
                                    ) : (
                                        <span style={{ fontSize: '8px' }}>{t.noImage}</span>
                                    )}
                                </div>
                            </td>
                        )}
                        <td>
                            <div className="item-description">{item.name}</div>
                            {item.description && <div className="item-details">{item.description}</div>}
                        </td>
                        {config.showTableUnit && <td className="item-unit">{item.unit}</td>}
                        <td className="item-quantity">{item.quantity}</td>
                        <td className="item-price">{formatCurrency(item.price)}</td>
                        {hasLineItemDiscounts && <td className="item-discount" style={{ textAlign: 'center', color: '#ef4444' }}>{item.discountRate ? `%${item.discountRate}` : '-'}</td>}
                        {config.showTableUnit && <td className="item-unit">{item.unit}</td>}
                        <td className="item-quantity" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
                        <td className="item-price" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.price)}</td>
                        {hasLineItemDiscounts && <td className="item-discount" style={{ color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{item.discountRate ? `%${item.discountRate}` : '-'}</td>}
                        {config.showTableTax && <td className="item-tax" style={{ fontVariantNumeric: 'tabular-nums' }}>%{item.taxRate}</td>}
                        <td className="item-total" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: '600' }}>{formatCurrency((item.quantity || 0) * (item.price || 0) * (1 - (item.discountRate || 0) / 100))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div id={id} className={`pro-theme-container w-full max-w-[210mm] mx-auto ${config.tableDensity === 'compact' ? 'pdf-compact-mode' :
            config.tableDensity === 'ultra-compact' ? 'pdf-ultra-compact' : ''
            } `} style={containerStyles}>
            <style>{proStyles}</style>

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
                                fontSize: `${config.watermarkFontSize || 48}px`,
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
                        <div className="pdf-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${color}` }}>
                            <div className="header-brand">
                                {config.showLogo && companyData.logo && (
                                    <div className="company-logo" style={{ marginBottom: '0.35rem' }}>
                                        <img src={companyData.logo} alt="Logo" style={{ maxHeight: `${config.logoMaxHeight || 48}px`, maxWidth: '100%', objectFit: 'contain' }} />
                                    </div>
                                )}
                                <div className="company-name" style={{ fontSize: '1.15rem', fontWeight: '800', color: color }}>{renderEditable(companyData.name, 'companyName')}</div>
                                {companyData.address && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>{companyData.address}</div>}
                            </div>
                            <div className="quote-meta" style={{ textAlign: 'right' }}>
                                <div className="quote-number" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>#{quoteData.number}</div>
                                <div className="quote-dates" style={{ marginTop: '0.35rem', display: 'inline-flex', gap: '0.6rem', fontSize: '0.75rem', background: '#f8fafc', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                    <div className="date-item">
                                        <span className="date-label" style={{ color: '#64748b' }}>{t.date}: </span>
                                        <span className="date-value" style={{ fontWeight: '600', color: '#0f172a' }}>{formatDate(quoteData.date, currentLocale)}</span>
                                    </div>
                                    <span>•</span>
                                    <div className="date-item">
                                        <span className="date-label" style={{ color: '#64748b' }}>{t.validUntil}: </span>
                                        <span className="date-value" style={{ fontWeight: '600', color: '#0f172a' }}>{formatDate(quoteData.validUntil, currentLocale)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="pdf-header-compact" style={{ marginBottom: '0.75rem', paddingBottom: '0.35rem', borderBottom: `1px solid ${color}`, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                            <span>{companyData.name} - #{quoteData.number}</span>
                            <span>{formatDate(quoteData.date, currentLocale)}</span>
                        </div>
                    ))}

                    {/* Customer Single Box - Only Page 1 */}
                    {pageIndex === 0 && showSection('customer') && (
                        <div className="details-grid" style={{ display: 'block', marginBottom: '1rem' }}>
                            <div className="info-box" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem 1rem' }}>
                                <div className="info-title" style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.2rem' }}>{t.customer} / {t.to}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.4rem 1.5rem', alignItems: 'center' }}>
                                    {customerData.company && (
                                        <div style={{ gridColumn: '1 / -1', fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                                            {renderEditable(customerData.company, 'customerCompany')}
                                        </div>
                                    )}
                                    {customerData.name && (
                                        <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>{t.authorized}: </span>
                                            <span>{renderEditable(customerData.name, 'customerName')}</span>
                                        </div>
                                    )}
                                    {customerData.phone && (
                                        <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>{t.phone}: </span>
                                            <span>{renderEditable(customerData.phone, 'customerPhone')}</span>
                                        </div>
                                    )}
                                    {customerData.email && (
                                        <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>{t.email}: </span>
                                            <span>{renderEditable(customerData.email, 'customerEmail')}</span>
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

                    {/* Summary, Signatures, Terms - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto' }}>
                            {/* Summary & Bank Info */}
                            {config.showSummary && (
                                <div className="pdf-summary" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem', marginBottom: '1rem' }}>
                                    <div className="payment-info">
                                        {config.showBankInfo && (bankData.bankName || bankData.iban) && (
                                            <div className="bank-info" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                                                <div className="section-title" style={{ marginBottom: '0.4rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.2rem', textTransform: 'uppercase', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
                                                    {t.bankInfo}
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: '1.6' }}>
                                                    {bankData.bankName && <div style={{ display: 'flex' }}><strong style={{ width: '80px', color: '#64748b' }}>{t.bank}:</strong> <span>{bankData.bankName}</span></div>}
                                                    {bankData.branch && <div style={{ display: 'flex' }}><strong style={{ width: '80px', color: '#64748b' }}>{t.branch}:</strong> <span>{bankData.branch}</span></div>}
                                                    {bankData.accountHolder && <div style={{ display: 'flex' }}><strong style={{ width: '80px', color: '#64748b' }}>{t.accountHolder}:</strong> <span>{bankData.accountHolder}</span></div>}
                                                    {bankData.iban && <div style={{ display: 'flex', marginTop: '0.15rem' }}><strong style={{ width: '80px', color: '#64748b' }}>{t.iban}:</strong> <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>{bankData.iban}</span></div>}
                                                </div>
                                            </div>
                                        )}
                                        {showSection('notes') && config.showNotes && quoteData.notes && (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>{t.notes}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#475569' }}>{renderEditable(quoteData.notes, 'notes', 'textarea')}</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="totals-section">
                                        <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.8rem', color: '#475569' }}>
                                            <span>{t.subtotal}</span>
                                            <span style={{ fontWeight: '600', fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="summary-row discount" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.8rem', color: '#ef4444' }}>
                                                <span>{t.discount} (%{Math.round((discountAmount / subtotal) * 100)})</span>
                                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.8rem', color: '#475569' }}>
                                            <span>{t.tax}</span>
                                            <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(totalTax)}</span>
                                        </div>
                                        <div className="summary-row grand-total" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', marginTop: '0.35rem', paddingTop: '0.35rem', color: '#0f172a', fontSize: '1.05rem', fontWeight: '800' }}>
                                            <span>{t.generalTotal}</span>
                                            <span style={{ color: color, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span>
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.25rem', textAlign: 'right' }}>
                                            {numberToWordsTurkish(total, quoteData.currency || 'TRY')}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Terms */}
                            {showSection('notes') && config.showTerms && (quoteData.deliveryTerms || quoteData.warrantyTerms || quoteData.terms) && (
                                <div className="terms-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{t.terms}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: '1.5' }}>
                                        {quoteData.deliveryTerms && <div><strong>{t.deliveryConditions}:</strong> {renderEditable(quoteData.deliveryTerms, 'deliveryTerms', 'textarea')}</div>}
                                        {(quoteData.warrantyTerms || quoteData.terms) && <div><strong>{t.warrantyConditions}:</strong> {renderEditable(quoteData.warrantyTerms || quoteData.terms, 'terms', 'textarea')}</div>}
                                    </div>
                                </div>
                            )}

                            {/* Signatures */}
                            {showSection('signatures') && config.showSignatures && (
                                <div className="signature-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem', marginBottom: '1rem' }}>
                                    <div className="signature-box" style={{ textAlign: 'center' }}>
                                        <div className="signature-area" style={{ minHeight: '50px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '1rem', borderBottom: '1px solid #94a3b8', paddingBottom: '4px' }}>
                                            {(signature || companyData.signature) && (
                                                <img src={(signature || companyData.signature) as string} alt={t.signature} style={{ maxHeight: '45px', maxWidth: '120px', objectFit: 'contain' }} />
                                            )}
                                            {companyData.stamp && (
                                                <img src={companyData.stamp} alt={t.companyStamp} style={{ maxHeight: '45px', maxWidth: '90px', objectFit: 'contain', opacity: 0.85 }} />
                                            )}
                                        </div>
                                        <div className="signature-label" style={{ paddingTop: '0.35rem', fontSize: '0.78rem', fontWeight: '600', color: '#0f172a' }}>{t.seller} (Kaşe & İmza)</div>
                                    </div>
                                    <div className="signature-box" style={{ textAlign: 'center' }}>
                                        <div className="signature-area" style={{ minHeight: '50px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #94a3b8', paddingBottom: '4px' }}>
                                        </div>
                                        <div className="signature-label" style={{ paddingTop: '0.35rem', fontSize: '0.78rem', fontWeight: '600', color: '#0f172a' }}>{t.customer} (Onay / İmza)</div>
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
                        <div className="pdf-footer" style={{ marginTop: 0, borderTop: 'none', paddingTop: '0.25rem', textAlign: 'center', fontSize: '0.65rem', color: '#94a3b8' }}>
                            {config.customFooter}
                        </div>
                    )}

                    {/* Page Number */}
                    {config.showPageNumbers && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '0.25rem' }}>
                            <span>{quoteData.number ? `#${quoteData.number}` : ''}</span>
                            <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ProTheme;


