import React, { useMemo } from 'react';
import { numberToWordsTurkish } from '@/utils/numberToWordsTurkish';
import type { QuoteItem, PdfThemeProps } from '@/context/quote/types';

const CorporateTheme: React.FC<PdfThemeProps> = ({
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
    const corporateStyles = useMemo(() => `
        .corporate-theme-container {
            font-family: ${config.globalFontFamily || "'Inter', 'Roboto', sans-serif"};
            line-height: ${config.bodyLineHeight || '1.5'};
            color: ${config.globalFontColor || '#1f2937'};
            background: var(--pdf-page-bg, #fff);
            font-size: ${config.fontSize || 11}px;
            position: relative;
            box-shadow: ${config.enableShadows ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'};
        }

        .corporate-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 0.2rem;
            margin-bottom: 0.4rem;
            border-bottom: 2px solid ${color};
        }

        .corporate-logo-box {
            width: 120px;
            height: ${config.logoMaxHeight || 45}px;
            display: flex;
            align-items: center;
            justify-content: ${config.logoPosition === 'center' ? 'center' : config.logoPosition === 'right' ? 'flex-end' : 'flex-start'};
            margin-bottom: 0.2rem;
        }

        .corporate-logo-box img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            border-radius: ${config.logoStyle === 'circle' ? '50%' : config.logoStyle === 'rounded' ? '6px' : '0'};
        }

        .corporate-title-box {
            text-align: right;
        }

        .corporate-title {
            font-size: ${config.titleFontSize || '1.4rem'} !important;
            font-weight: ${config.titleFontWeight || '800'} !important;
            color: ${color};
            text-transform: uppercase;
            letter-spacing: -0.02em;
            margin-bottom: 0.1rem;
            font-family: ${config.titleFontFamily || 'inherit'};
        }

        .corporate-meta {
            display: flex;
            flex-direction: column;
            gap: 0.1rem;
            font-size: ${config.quoteMetaLabelFontSize || '0.75em'};
            color: #4b5563;
        }

        .corporate-meta strong {
            font-weight: ${config.quoteMetaLabelFontWeight || 'bold'};
        }

        .corporate-meta div {
            font-size: ${config.quoteMetaValueFontSize || '0.9em'};
            font-weight: ${config.quoteMetaValueFontWeight || '500'};
        }

        .corporate-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 0.8rem;
        }

        .corporate-card-title {
            font-size: ${config.customerTitleFontSize || '0.85rem'} !important;
            font-weight: ${config.customerTitleFontWeight || '700'} !important;
            color: ${color};
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.4rem;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.2rem;
        }

        .corporate-info-row {
            display: flex;
            margin-bottom: 0.2rem;
            font-size: 0.85em;
        }

        .corporate-info-label {
            width: 90px;
            font-weight: ${config.customerLabelFontWeight || '600'};
            font-size: ${config.customerLabelFontSize || 'inherit'};
            color: #6b7280;
            flex-shrink: 0;
        }

        .corporate-info-value {
            color: #111827;
            font-weight: ${config.customerValueFontWeight || '500'};
            font-size: ${config.customerValueFontSize || 'inherit'};
        }

        .corporate-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
        }

        .corporate-table th {
            background: ${config.tableHeaderBg || color};
            color: ${config.tableHeaderColor || 'white'};
            padding: ${config.tableHeaderPadding || '0.25rem 0.4rem'};
            text-align: left;
            font-weight: ${config.tableHeaderFontWeight || '600'};
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '0.7em')};
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .corporate-table td {
            padding: ${config.tableCellPadding || '0.25rem 0.4rem'};
            border-bottom: 1px solid #e5e7eb;
            font-size: ${config.tableBodyFontSize || '0.75em'};
            font-weight: ${config.tableBodyFontWeight || 'normal'};
            color: #374151;
            vertical-align: middle;
        }

        ${config.tableStriped ? `
        .corporate-table tr:nth-child(even) {
            background-color: ${config.tableStripedColor || '#f9fafb'};
        }` : ''}

        .corporate-item-image {
            width: 48px;
            height: 48px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            overflow: hidden;
        }

        .corporate-item-image img {
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
        }

        .corporate-summary-section {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 3rem;
            margin-top: 2rem;
            page-break-inside: avoid;
        }

        .corporate-bank-box {
            background: #f9fafb;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }

        .corporate-totals-box {
            padding: 1.5rem;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }

        .corporate-total-row {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px dashed #e5e7eb;
            font-size: ${config.summaryLabelFontSize || '0.95em'};
            font-weight: ${config.summaryLabelFontWeight || 'normal'};
        }

        .corporate-total-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }

        .corporate-grand-total {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 2px solid ${color};
            font-weight: 800;
            font-size: ${config.summaryTotalFontSize || '1.2em'};
            color: ${color};
            display: flex;
            justify-content: space-between;
        }

        .corporate-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            margin-top: 4rem;
            page-break-inside: avoid;
        }

        .corporate-sig-box {
            text-align: center;
        }

        .corporate-sig-area {
            height: 100px;
            border-bottom: 1px solid #d1d5db;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 10px;
        }

        .corporate-sig-label {
            font-size: 0.85em;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
        }

        .corporate-table thead {
            background: ${config.tableHeaderBg || 'transparent'};
        }

        ${config.tableStriped ? `
        .corporate-table tbody tr:nth-child(even) td {
            background: ${config.tableStripedColor || '#f8fafc'};
        }
        ` : ''}

        .corporate-table td {
            height: ${config.tableRowHeight || 0}px;
        }

        ${config.tableShowVerticalLines ? `
        .corporate-table th,
        .corporate-table td {
            border-left: 1px solid ${config.tableBorderColor || '#e2e8f0'};
        }
        .corporate-table th:first-child,
        .corporate-table td:first-child {
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
        <table className="corporate-table">
            <thead>
                <tr>
                    <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                    {config.showTableImages && <th style={{ width: '10%' }}>{t.image}</th>}
                    <th style={{ width: '40%' }}>{config.textItem || t.item}</th>
                    {config.showTableUnit && <th style={{ width: '10%', textAlign: 'center' }}>{config.textUnit || t.unit}</th>}
                    <th style={{ width: '10%', textAlign: 'center' }}>{config.textQuantity || t.quantity}</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>{config.textUnitPrice || t.unitPrice}</th>
                    {hasLineItemDiscounts && <th style={{ width: '8%', textAlign: 'center' }}>{t.discount}</th>}
                    {config.showTableTax && <th style={{ width: '8%', textAlign: 'center' }}>{config.textVat || t.tax}</th>}
                    <th style={{ width: '15%', textAlign: 'right' }}>{config.textTotal || t.total}</th>
                </tr>
            </thead>
            <tbody>
                {tableItems.map((item, index) => (
                    <tr key={startIndex + index}>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#9ca3af' }}>{startIndex + index + 1}</td>
                        {config.showTableImages && (
                            <td>
                                <div className="corporate-item-image">
                                    {item.image ? (
                                        <img src={item.image} alt="" />
                                    ) : (
                                        <span style={{ fontSize: '10px', color: '#9ca3af' }}>-</span>
                                    )}
                                </div>
                            </td>
                        )}
                        <td>
                            <div style={{ fontWeight: '600', color: '#111827' }}>{item.name}</div>
                            {item.description && <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: '0.25rem' }}>{item.description}</div>}
                        </td>
                        {config.showTableUnit && <td style={{ textAlign: 'center' }}>{item.unit}</td>}
                        <td style={{ textAlign: 'center', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.price)}</td>
                        {hasLineItemDiscounts && <td style={{ textAlign: 'center', color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{item.discountRate ? `%${item.discountRate}` : '-'}</td>}
                        {config.showTableTax && <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>%{item.taxRate}</td>}
                        <td style={{ textAlign: 'right', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency((item.quantity || 0) * (item.price || 0) * (1 - (item.discountRate || 0) / 100))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div id={id} className="corporate-theme-container w-full max-w-[210mm] mx-auto" style={containerStyles}>
            <style>{corporateStyles}</style>

            {itemChunks.map((chunk, pageIndex) => (
                <div key={pageIndex} className="pdf-preview pdf-page" style={{
                    position: 'relative',
                    minHeight: containerStyles?.pageMinHeight || '290mm',
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    pageBreakAfter: pageIndex < itemChunks.length - 1 ? 'always' : 'auto'
                }}>
                    {/* Watermark - Per Page */}
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
                        <div className="corporate-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${color}` }}>
                            <div className="corporate-header-left">
                                {config.showLogo && companyData.logo && (
                                    <div className="corporate-logo-box" style={{ display: 'flex', justifyContent: config.logoPosition === 'center' ? 'center' : config.logoPosition === 'right' ? 'flex-end' : 'flex-start', marginBottom: '0.35rem' }}>
                                        <img src={companyData.logo} alt="Logo" style={{ maxHeight: `${config.logoMaxHeight || 48}px`, maxWidth: '100%', objectFit: 'contain', borderRadius: config.logoStyle === 'circle' ? '50%' : config.logoStyle === 'rounded' ? '8px' : '0' }} />
                                    </div>
                                )}
                                <div style={{ fontSize: config.headerTitleFontSize || '1.2em', fontWeight: config.headerTitleFontWeight || '800', color: color }}>{renderEditable(companyData.name, 'companyName')}</div>
                                {companyData.address && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>{companyData.address}</div>}
                            </div>
                            <div className="corporate-title-box" style={{ textAlign: 'right' }}>
                                <div className="corporate-title" style={{ fontSize: '1.25rem', fontWeight: '800', color: color }}>{renderEditable(config.title, 'quoteTitle')}</div>
                                <div className="corporate-meta" style={{ marginTop: '0.35rem', display: 'inline-flex', gap: '0.6rem', fontSize: '0.75rem', background: '#f8fafc', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                    <div><strong>{t.quoteNo}:</strong> #{quoteData.number}</div>
                                    <span>•</span>
                                    <div><strong>{t.date}:</strong> {formatDate(quoteData.date, currentLocale)}</div>
                                    <span>•</span>
                                    <div><strong>{t.validUntil}:</strong> {formatDate(quoteData.validUntil, currentLocale)}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="corporate-header" style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '0.75rem', paddingBottom: '0.35rem' }}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                                <span>{companyData.name} - {config.title}</span>
                                {config.showPageNumbers !== false && (
                                    <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Customer Single Box - Only Page 1 */}
                    {showSection('customer') && pageIndex === 0 && (
                        <div className="corporate-grid" style={{ display: 'block', marginBottom: '1rem' }}>
                            <div className="corporate-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem 1rem' }}>
                                <div className="corporate-card-title" style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.2rem' }}>{t.customer} / {t.to}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.4rem 1.5rem', alignItems: 'center' }}>
                                    {customerData.company && <div style={{ gridColumn: '1 / -1', fontWeight: '700', fontSize: '1rem', color: '#0f172a' }}>{renderEditable(customerData.company, 'customerCompany')}</div>}
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
                                    {customerData.address && (
                                        <div style={{ gridColumn: '1 / -1', fontSize: '0.75rem', color: '#64748b' }}>
                                            <span>{customerData.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Items */}
                    {showSection('items') && (
                    <div style={{ flex: 1 }}>
                        {renderTable(chunk, pageIndex * itemsPerPage)}
                    </div>
                    )}

                    {/* Summary & Footer - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto' }}>
                            {config.showSummary && (
                                <div className="corporate-summary-section" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem', marginBottom: '1rem' }}>
                                    <div className="corporate-left-col">
                                        {config.showBankInfo && (bankData.bankName || bankData.iban) && (
                                            <div className="corporate-bank-box">
                                                <div style={{ fontWeight: '700', color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase', fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.2rem' }}>{t.bankInfo}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#4b5563', lineHeight: '1.6' }}>
                                                    {bankData.bankName && <div><strong>{t.bank}:</strong> {bankData.bankName}</div>}
                                                    {bankData.branch && <div><strong>{t.branch}:</strong> {bankData.branch}</div>}
                                                    {bankData.iban && <div><strong>{t.iban}:</strong> <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>{bankData.iban}</span></div>}
                                                    {bankData.accountHolder && <div><strong>{t.accountHolder}:</strong> {bankData.accountHolder}</div>}
                                                </div>
                                            </div>
                                        )}
                                        {showSection('notes') && config.showNotes && quoteData.notes && (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <div style={{ fontWeight: '700', color: '#64748b', marginBottom: '0.2rem', fontSize: '0.75rem' }}>{t.notes}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#475569' }}>{renderEditable(quoteData.notes, 'notes', 'textarea')}</div>
                                            </div>
                                        )}
                                        {showSection('notes') && config.showTerms && (quoteData.deliveryTerms || quoteData.warrantyTerms || quoteData.terms) && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#475569', lineHeight: '1.5' }}>
                                                {quoteData.deliveryTerms && <div><strong>{t.delivery}:</strong> {renderEditable(quoteData.deliveryTerms, 'deliveryTerms', 'textarea')}</div>}
                                                {quoteData.warrantyTerms && <div><strong>{t.warranty}:</strong> {renderEditable(quoteData.warrantyTerms, 'terms', 'textarea')}</div>}
                                                {quoteData.terms && <div><strong>{t.payment}:</strong> {renderEditable(quoteData.terms, 'terms', 'textarea')}</div>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="corporate-totals-box">
                                        <div className="corporate-total-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.8rem', color: '#475569' }}>
                                            <span>{t.subtotal}</span>
                                            <span style={{ fontWeight: '600', fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="corporate-total-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.8rem', color: '#ef4444' }}>
                                                <span>{t.discount} (%{Math.round((discountAmount / subtotal) * 100)})</span>
                                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        {config.showTableTax && (
                                            <div className="corporate-total-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.8rem', color: '#475569' }}>
                                                <span>{t.tax}</span>
                                                <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(totalTax)}</span>
                                            </div>
                                        )}
                                        <div className="corporate-grand-total" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', marginTop: '0.35rem', paddingTop: '0.35rem', color: '#0f172a', fontSize: '1.05rem', fontWeight: '800' }}>
                                            <span>{t.generalTotal}</span>
                                            <span style={{ color: color, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span>
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.25rem', textAlign: 'right' }}>
                                            {numberToWordsTurkish(total, quoteData.currency || 'TRY')}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Signatures */}
                            {showSection('signatures') && config.showSignatures && (
                                <div className="corporate-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem', marginBottom: '1rem' }}>
                                    <div className="corporate-sig-box" style={{ textAlign: 'center' }}>
                                        <div className="corporate-sig-area" style={{ minHeight: '50px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '1rem', borderBottom: '1px solid #94a3b8', paddingBottom: '4px' }}>
                                            {(signature || companyData.signature) && (
                                                <img src={(signature || companyData.signature) as string} alt="" style={{ maxHeight: '45px', maxWidth: '120px', objectFit: 'contain' }} />
                                            )}
                                            {companyData.stamp && (
                                                <img src={companyData.stamp} alt="" style={{ maxHeight: '45px', maxWidth: '90px', objectFit: 'contain', opacity: 0.85 }} />
                                            )}
                                        </div>
                                        <div className="corporate-sig-label" style={{ paddingTop: '0.35rem', fontSize: '0.78rem', fontWeight: '600', color: '#0f172a' }}>{t.seller} (Kaşe & İmza)</div>
                                    </div>
                                    <div className="corporate-sig-box" style={{ textAlign: 'center' }}>
                                        <div className="corporate-sig-area" style={{ minHeight: '50px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #94a3b8', paddingBottom: '4px' }}>
                                        </div>
                                        <div className="corporate-sig-label" style={{ paddingTop: '0.35rem', fontSize: '0.78rem', fontWeight: '600', color: '#0f172a' }}>{t.customer} (Onay / İmza)</div>
                                    </div>
                                </div>
                            )}

                            {/* Footer - Only Last Page (Clean Single Line) */}
                            {showSection('footer') && (
                            <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
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

                            {/* Custom Footer */}
                            {config.customFooter && (
                                <div style={{ marginTop: '0.25rem', textAlign: 'center', fontSize: '0.65rem', color: '#6b7280' }}>
                                    {config.customFooter}
                                </div>
                            )}

                            {/* Page Number */}
                            {config.showPageNumbers && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: '0.25rem' }}>
                                    <span>{quoteData.number ? `#${quoteData.number}` : ''}</span>
                                    <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default CorporateTheme;


