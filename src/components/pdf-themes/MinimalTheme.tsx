import React, { useMemo } from 'react';
import { numberToWordsTurkish } from '@/utils/numberToWordsTurkish';
import type { QuoteItem, PdfThemeProps } from '@/context/quote/types';

const MinimalTheme: React.FC<PdfThemeProps> = ({
    id,
    containerStyles,
    config,
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
    const minimalStyles = useMemo(() => `
        .minimal-theme-container {
            font-family: ${config.globalFontFamily || "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif"};
            color: ${config.globalFontColor || '#000'} !important;
            background: var(--pdf-page-bg, #fff) !important;
            line-height: ${config.bodyLineHeight || '1.3'};
            font-size: ${config.fontSize || 11}px;
            box-shadow: ${config.enableShadows ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'};
        }

        .minimal-header {
            font-size: ${config.headerTitleFontSize || '0.7rem'} !important;
            font-weight: ${config.headerTitleFontWeight || '600'} !important;
            text-transform: ${config.headerTransform || 'uppercase'};
            letter-spacing: 0.05em;
            color: #9ca3af;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.25rem;
            margin-bottom: 0.5rem;
            font-family: ${config.headerFontFamily || 'inherit'};
        }

        .minimal-label {
            font-size: ${config.customerLabelFontSize || '0.65rem'} !important;
            font-weight: ${config.customerLabelFontWeight || 'normal'} !important;
            color: ${config.labelColor || '#6b7280'};
            margin-bottom: 0.1rem;
            font-family: ${config.labelFontFamily || 'inherit'};
        }

        .minimal-value {
            font-size: ${config.customerValueFontSize || '0.85rem'} !important;
            font-weight: ${config.customerValueFontWeight || '500'} !important;
            color: ${config.bodyColor || '#111'};
            font-family: ${config.bodyFontFamily || 'inherit'};
        }

        .minimal-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
        }

        .minimal-table th {
            text-align: left;
            padding: ${config.tableHeaderPadding || '0.5rem 0'};
            border-bottom: 2px solid ${config.tableHeaderBorderColor || '#000'};
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '0.7rem')};
            text-transform: ${config.tableHeaderTransform || 'uppercase'};
            letter-spacing: 0.05em;
            font-weight: ${config.tableHeaderFontWeight || '600'};
            color: ${config.tableHeaderColor || '#000'};
            background: ${config.tableHeaderBg || 'transparent'};
        }

        .minimal-table td {
            padding: ${config.tableCellPadding || '0.5rem 0'};
            border-bottom: 1px solid ${config.tableBorderColor || '#e5e7eb'};
            font-size: ${config.tableBodyFontSize || 'inherit'} !important;
            font-weight: ${config.tableBodyFontWeight || 'normal'} !important;
            vertical-align: middle;
        }

        ${config.tableStriped ? `
        .minimal-table tr:nth-child(even) {
            background: ${config.tableStripedColor || '#f9fafb'};
        }
        ` : ''}

        .minimal-table td {
            height: ${config.tableRowHeight || 0}px;
        }

        ${config.tableShowVerticalLines ? `
        .minimal-table th,
        .minimal-table td {
            border-left: 1px solid ${config.tableBorderColor || '#e5e7eb'};
        }
        .minimal-table th:first-child,
        .minimal-table td:first-child {
            border-left: none;
        }
        ` : ''}
    `, [config]);

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
        <table className="minimal-table">
            <thead>
                <tr>
                    <th style={{ width: '5%' }}>#</th>
                    {config.showTableImages && <th style={{ width: '10%' }}>{t.image}</th>}
                    <th style={{ width: '45%' }}>{config.textItem || t.item}</th>
                    {config.showTableUnit && <th style={{ width: '10%', textAlign: 'center' }}>{config.textUnit || t.unit}</th>}
                    <th style={{ width: '10%', textAlign: 'center' }}>{config.textQuantity || t.quantity}</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>{config.textUnitPrice || t.unitPrice}</th>
                    {hasLineItemDiscounts && <th style={{ width: '10%', textAlign: 'center' }}>{t.discount}</th>}
                    {config.showTableTax && <th style={{ width: '10%', textAlign: 'center' }}>{config.textVat || t.tax}</th>}
                    <th style={{ width: '15%', textAlign: 'right' }}>{config.textTotal || t.total}</th>
                </tr>
            </thead>
            <tbody>
                {tableItems.map((item, index) => (
                    <tr key={startIndex + index}>
                        <td style={{ color: '#9ca3af' }}>{startIndex + index + 1}</td>
                        {config.showTableImages && (
                            <td>
                                {item.image && <img src={item.image} alt="" style={{ width: '30px', height: '30px', objectFit: 'contain', borderRadius: '4px' }} />}
                            </td>
                        )}
                        <td>
                            <div style={{ fontWeight: '500', color: '#111' }}>{item.name}</div>
                            {item.description && <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.1rem' }}>{item.description}</div>}
                        </td>
                        {config.showTableUnit && <td style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.8rem' }}>{item.unit}</td>}
                        <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.price)}</td>
                        {hasLineItemDiscounts && <td style={{ textAlign: 'center', color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{item.discountRate ? `%${item.discountRate}` : '-'}</td>}
                        {config.showTableTax && <td style={{ textAlign: 'center', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>%{item.taxRate}</td>}
                        <td style={{ textAlign: 'right', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency((item.quantity || 0) * (item.price || 0) * (1 - (item.discountRate || 0) / 100))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div id={id} className="minimal-theme-container w-full max-w-[210mm] mx-auto" style={containerStyles}>
            <style>{minimalStyles}</style>

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

                    {/* Header Section */}
                    {showSection('header') && (pageIndex === 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                {config.showLogo && companyData.logo ? (
                                    <img src={companyData.logo} alt="Logo" style={{ height: `${config.logoMaxHeight || 35}px`, objectFit: 'contain', marginBottom: '0.35rem', alignSelf: config.logoPosition === 'center' ? 'center' : config.logoPosition === 'right' ? 'flex-end' : 'flex-start', borderRadius: config.logoStyle === 'circle' ? '50%' : config.logoStyle === 'rounded' ? '6px' : '0' }} />
                                ) : (
                                    <div style={{ fontSize: config.headerTitleFontSize || '1.15rem', fontWeight: config.headerTitleFontWeight || '800', letterSpacing: '-0.02em', color: '#000' }}>{renderEditable(companyData.name, 'companyName')}</div>
                                )}
                                {companyData.address && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{companyData.address}</div>}
                                {(companyData.phone || companyData.email || companyData.website) && (
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        {companyData.phone && <span>{companyData.phone}</span>}
                                        {companyData.phone && companyData.email && <span> • </span>}
                                        {companyData.email && <span>{companyData.email}</span>}
                                        {(companyData.phone || companyData.email) && companyData.website && <span> • </span>}
                                        {companyData.website && <span>{companyData.website}</span>}
                                    </div>
                                )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.02em', color: '#000' }}>{renderEditable(config.title, 'quoteTitle')}</div>
                                <div style={{ marginTop: '0.35rem', display: 'inline-flex', gap: '0.6rem', fontSize: '0.75rem', background: '#f8fafc', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontWeight: '700', color: '#000' }}>#{quoteData.number}</span>
                                    <span>•</span>
                                    <span>{t.date}: {formatDate(quoteData.date, currentLocale)}</span>
                                    <span>•</span>
                                    <span>{t.validUntil}: {formatDate(quoteData.validUntil, currentLocale)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.35rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                            <span>{companyData.name} - {config.title}</span>
                            {config.showPageNumbers !== false && (
                                <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                            )}
                        </div>
                    ))}

                    {/* Customer Info Box - Only Page 1 */}
                    {showSection('customer') && pageIndex === 0 && (
                        <div style={{ marginBottom: '1.25rem', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.75rem 1rem' }}>
                            <div className="minimal-header" style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.2rem' }}>{t.customer} / {t.to}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.4rem 1.5rem', alignItems: 'center' }}>
                                {customerData.company && <div style={{ gridColumn: '1 / -1', fontSize: '0.95rem', fontWeight: '700', color: '#000' }}>{renderEditable(customerData.company, 'customerCompany')}</div>}
                                {customerData.name && <div style={{ fontSize: '0.78rem', color: '#374151' }}><span style={{ color: '#64748b', fontWeight: '600' }}>{t.authorized}: </span>{renderEditable(customerData.name, 'customerName')}</div>}
                                {customerData.phone && <div style={{ fontSize: '0.78rem', color: '#374151' }}><span style={{ color: '#64748b', fontWeight: '600' }}>{t.phone}: </span>{renderEditable(customerData.phone, 'customerPhone')}</div>}
                                {customerData.email && <div style={{ fontSize: '0.78rem', color: '#374151' }}><span style={{ color: '#64748b', fontWeight: '600' }}>{t.email}: </span>{renderEditable(customerData.email, 'customerEmail')}</div>}
                                {customerData.address && <div style={{ gridColumn: '1 / -1', fontSize: '0.75rem', color: '#64748b' }}>{customerData.address}</div>}
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    <div style={{ flex: 1 }}>
                        {showSection('items') && renderTable(chunk, pageIndex * itemsPerPage)}
                    </div>

                    {/* Totals Section & Footer - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto' }}>
                            {config.showSummary && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem', marginTop: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem', pageBreakInside: 'avoid' }}>
                                    <div>
                                        {config.showBankInfo && (bankData.bankName || bankData.iban) && (
                                            <div style={{ fontSize: '0.78rem', color: '#4b5563', lineHeight: '1.6' }}>
                                                <div style={{ fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '0.2rem' }}>{t.bankInfo}</div>
                                                {bankData.bankName && <div><strong>{t.bank}:</strong> {bankData.bankName}</div>}
                                                {bankData.iban && <div><strong>{t.iban}:</strong> <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{bankData.iban}</span></div>}
                                            </div>
                                        )}
                                        {showSection('notes') && config.showNotes && quoteData.notes && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#475569' }}>
                                                <div style={{ fontWeight: '700', color: '#64748b', fontSize: '0.75rem' }}>{t.notes}</div>
                                                <div>{renderEditable(quoteData.notes, 'notes', 'textarea')}</div>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.8rem', color: '#475569' }}>
                                            <span>{t.subtotal}</span>
                                            <span style={{ fontWeight: '600', fontVariantNumeric: 'tabular-nums', color: '#000' }}>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.8rem', color: '#ef4444' }}>
                                                <span>{t.discount}</span>
                                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        {config.showTableTax && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.8rem', color: '#475569' }}>
                                                <span>{t.tax}</span>
                                                <span style={{ fontVariantNumeric: 'tabular-nums', color: '#000' }}>{formatCurrency(totalTax)}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #000', marginTop: '0.35rem', paddingTop: '0.35rem', fontSize: '1.05rem', fontWeight: '800', color: '#000' }}>
                                            <span>{t.generalTotal}</span>
                                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span>
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.25rem', textAlign: 'right' }}>
                                            {numberToWordsTurkish(total, quoteData.currency || 'TRY')}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Terms */}
                            {showSection('notes') && config.showTerms && (quoteData.deliveryTerms || quoteData.terms) && (
                                <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#64748b', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
                                    {quoteData.deliveryTerms && <div><strong>{t.delivery}:</strong> {renderEditable(quoteData.deliveryTerms, 'deliveryTerms', 'textarea')}</div>}
                                    {quoteData.terms && <div><strong>{t.payment}:</strong> {renderEditable(quoteData.terms, 'terms', 'textarea')}</div>}
                                </div>
                            )}

                            {/* Signatures */}
                            {showSection('signatures') && config.showSignatures && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem', marginBottom: '0.5rem', pageBreakInside: 'avoid' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ minHeight: '45px', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '1rem' }}>
                                            {signature && <img src={signature} alt="" style={{ maxHeight: '40px', maxWidth: '100px', objectFit: 'contain' }} />}
                                            {companyData.stamp && <img src={companyData.stamp} alt="" style={{ maxHeight: '40px', maxWidth: '80px', objectFit: 'contain', opacity: 0.85 }} />}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#000', paddingTop: '0.25rem' }}>{t.seller} (Kaşe & İmza)</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ minHeight: '45px', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#000', paddingTop: '0.25rem' }}>{t.customer} (Onay / İmza)</div>
                                    </div>
                                </div>
                            )}

                            {/* Footer - Only Last Page (Clean Single Line) */}
                            {showSection('footer') && (
                            <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
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
                                <div style={{ marginTop: '0.25rem', textAlign: 'center', fontSize: '0.65rem', color: '#9ca3af' }}>
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

export default MinimalTheme;


